/* ==========================================================================
   零依赖 Chrome DevTools Protocol 小封装（Node 22 自带 fetch + WebSocket）
   供 verify.js / functest.js 复用
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 每次运行随机挑一个调试端口，避免连到上一次残留的浏览器实例上
   （否则会读到旧实例的 localStorage，测试结果全是脏的） */
const state = { port: 9300 + Math.floor(Math.random() * 400), proc: null, profile: null };

process.on('exit', () => { if (state.proc) { try { state.proc.kill(); } catch (_) { } } });
process.on('SIGINT', () => { if (state.proc) { try { state.proc.kill(); } catch (_) { } } process.exit(130); });

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    ws.addEventListener('message', e => this._onMsg(e));
  }
  _onMsg(e) {
    let m; try { m = JSON.parse(e.data); } catch (_) { return; }
    if (m.id && this.pending.has(m.id)) {
      const { res, rej } = this.pending.get(m.id);
      this.pending.delete(m.id);
      m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
    }
  }
  send(method, params) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params: params || {} }));
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('CDP 超时: ' + method)); }
      }, 20000);
    });
  }
  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.text + ' ' +
        ((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || ''));
    }
    return r.result.value;
  }
  async json(expr) {
    const v = await this.eval(expr);
    return typeof v === 'string' ? JSON.parse(v) : v;
  }
}

async function findBrowser() { return CANDIDATES.find(p => fs.existsSync(p)); }

async function launch(browserPath) {
  const dir = path.join(os.tmpdir(), 'tc-cdp-profile-' + Date.now());
  const proc = spawn(browserPath, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--mute-audio', '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required',
    '--remote-debugging-port=' + state.port,
    '--user-data-dir=' + dir,
    'about:blank'
  ], { stdio: 'ignore' });

  state.proc = proc;
  state.profile = dir;

  for (let i = 0; i < 60; i++) {
    try {
      const v = await (await fetch('http://127.0.0.1:' + state.port + '/json/version')).json();
      if (v && v.webSocketDebuggerUrl) return { proc, dir };
    } catch (_) { }
    await sleep(250);
  }
  proc.kill();
  throw new Error('浏览器启动超时（端口 ' + state.port + '）');
}

function cleanup() {
  if (state.proc) { try { state.proc.kill(); } catch (_) { } state.proc = null; }
  if (state.profile) { try { fs.rmSync(state.profile, { recursive: true, force: true }); } catch (_) { } state.profile = null; }
}

async function openPage() {
  const t = await (await fetch('http://127.0.0.1:' + state.port + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const cdp = new CDP(ws);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  /* 在任何页面脚本之前挂上错误捕获，第一时间拿到 JS 报错 */
  await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__tcError=null;' +
      'window.addEventListener("error",function(e){' +
      'if(!window.__tcError)window.__tcError=(e.message||"")+" @line"+(e.lineno||0);});' +
      'window.addEventListener("unhandledrejection",function(e){' +
      'if(!window.__tcError)window.__tcError="Promise: "+(e.reason&&e.reason.message||e.reason);});'
  });
  return {
    cdp, id: t.id,
    async close() {
      ws.close();
      await fetch('http://127.0.0.1:' + state.port + '/json/close/' + t.id).catch(() => { });
    }
  };
}

async function goto(cdp, filePath, w, h) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: w || 1280, height: h || 720, deviceScaleFactor: 1, mobile: false
  });
  await cdp.send('Page.navigate', { url: 'file:///' + filePath.replace(/\\/g, '/') });
  await sleep(1100);
}

const fileUrl = p => 'file:///' + p.replace(/\\/g, '/');

module.exports = { CDP, launch, openPage, findBrowser, goto, fileUrl, sleep, cleanup };
