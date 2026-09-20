/* 11/12/13 运行时冒烟：jsdom 启动生成的页面，跑完整摇人流程，抓异常（验完可删） */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..', '..');
const dirs = ['11-聚光灯黑板剧场点名', '12-盲盒拆拆乐点名', '13-时空传送阵法点名'];

function mockCtx() {
  const grad = { addColorStop: function () { } };
  const c = {
    canvas: null, globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1,
    shadowBlur: 0, shadowColor: '', lineCap: '', font: '', textAlign: '', textBaseline: '',
    lineDashOffset: 0, filter: '',
    setTransform() { }, clearRect() { }, save() { }, restore() { }, translate() { },
    rotate() { }, scale() { }, beginPath() { }, closePath() { }, moveTo() { },
    lineTo() { }, arc() { }, fill() { }, stroke() { }, fillRect() { }, strokeRect() { },
    fillText() { }, strokeText() { }, setLineDash() { }, clip() { }, rect() { },
    createRadialGradient() { return grad; }, createLinearGradient() { return grad; },
    measureText() { return { width: 10 }; }, drawImage() { }, quadraticCurveTo() { },
    bezierCurveTo() { }, ellipse() { }, arcTo() { }
  };
  return c;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run(dir) {
  const html = fs.readFileSync(path.join(ROOT, dir, 'index.html'), 'utf8');
  const errors = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'https://local.test/',
    beforeParse(window) {
      window.fetch = function () { return Promise.reject(new Error('no-net')); };
      window.HTMLCanvasElement.prototype.getContext = function () { return mockCtx(); };
      Object.defineProperty(window.HTMLElement.prototype, 'clientWidth', { get() { return 1229; }, configurable: true });
      Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', { get() { return 527; }, configurable: true });
      window.addEventListener('error', e => errors.push('window.error: ' + ((e.error && e.error.stack) || e.message)));
    }
  });
  const win = dom.window;
  await sleep(60);

  const T = win.TC;
  if (!T) { errors.push('TC 未挂载'); return { errors, info: 'n/a' }; }

  const step = async (label, fn) => {
    try { fn(); } catch (e) { errors.push(label + ' -> ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')); }
    await sleep(45);
  };

  for (const h of ['stageInit', 'stageLayout', 'stageStartRoll', 'stageStopRoll', 'revealWinners',
    'stageClearReveal', 'onResetHook', 'themedPillStyle']) {
    if (typeof win[h] !== 'function') errors.push('钩子缺失: ' + h);
  }

  const readGrid = sel => {
    const g = win.document.querySelector(sel);
    if (!g) return sel + ': 未找到';
    return sel + ' cols=' + g.dataset.cols + ' cw=' + g.dataset.cw + ' ch=' + g.dataset.ch +
      ' 子元素=' + g.children.length;
  };

  /* 走内核真实入口（toggleRoll -> startRolling/stopRolling 完整链路） */
  const counts = [1, 2, 3, 4, 5, 6];
  const infos = [];
  for (const n of counts) {
    const sel = win.document.getElementById('sel-count');
    sel.value = String(n);
    await step('layout', () => win.stageLayout());
    await step('startRoll(n=' + n + ')', () => T.toggleRoll());
    await sleep(180);
    await step('layout-rolling', () => win.stageLayout());
    /* 内核 stopRolling 会顺带调用 stageStopRoll + revealWinners + 礼花 */
    await step('stopRoll(n=' + n + ')', () => T.toggleRoll());
    await sleep(260);
    await step('layout-revealed', () => win.stageLayout());
    infos.push('n=' + n + '  ' + readGrid('#sp-chalk, #bb-cards, #tp-names'));
    await step('clearReveal', () => T.clearReveal());
  }
  await step('onResetHook', () => win.onResetHook());
  await step('themedPillStyle', () => {
    const el = win.document.createElement('div');
    win.themedPillStyle(el);
  });
  await sleep(200);
  win.close();
  return { errors, info: infos.join('\n            ') };
}

(async () => {
  for (const d of dirs) {
    const r = await run(d);
    console.log('=== ' + d + ' ===');
    console.log('  ' + r.info);
    if (r.errors.length) r.errors.forEach(e => console.log('  ✗ ' + e));
    else console.log('  ✓ 全流程无运行时报错（1~6 人各跑一轮）');
  }
  process.exit(0);
})();
