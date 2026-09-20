/* ==========================================================================
   课堂随机点名 v2 · 屏幕适配自动化验证
   用法： node _build/verify.js                 仅做布局体检
          node _build/verify.js --shots         体检 + 每个分辨率出一张截图
          node _build/verify.js --roll          体检 + 模拟一次完整抽取再体检
          node _build/verify.js --only=04       只验证 04 开头的主题
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const { launch, openPage, findBrowser, goto, fileUrl, sleep, cleanup } = require('./cdp');

const ROOT = path.resolve(__dirname, '..');
const ARGS = process.argv.slice(2);
const SHOTS = ARGS.includes('--shots');
const DO_ROLL = ARGS.includes('--roll');
const ONLY = (ARGS.find(a => a.startsWith('--only=')) || '').split('=')[1];

/* 14 寸笔记本常见实际可视区（含 125% / 150% 系统缩放），外加教室大屏 */
const VIEWPORTS = [
  { w: 1280, h: 720, name: '14寸@150%' },
  { w: 1366, h: 768, name: '常见1366' },
  { w: 1536, h: 864, name: '14寸@125%' },
  { w: 1920, h: 1080, name: '大屏/投影' }
];

/* --- 在页面里跑的布局体检脚本 --- */
const LAYOUT_CHECK = `(function(){
  var vw = window.innerWidth, vh = window.innerHeight;
  var doc = document.documentElement;
  var out = {
    vw: vw, vh: vh,
    scrollX: doc.scrollWidth > vw + 1,
    scrollY: doc.scrollHeight > vh + 1,
    docW: doc.scrollWidth, docH: doc.scrollHeight,
    clipped: [], deco: [], stageEmpty: false, jsError: window.__tcError || null
  };
  var stage = document.querySelector('.tc-stage');
  if (!stage) { out.stageEmpty = true; return JSON.stringify(out); }

  var sel = '.tc-stage > * > *, .tc-stage > *, .control-panel, .control-panel > *,' +
            '.tc-header, .tc-header > *, .tc-status, .tc-status > *,' +
            '.tc-history, .tc-history > *';
  var nodes = document.querySelectorAll(sel);
  var seen = 0;
  for (var i = 0; i < nodes.length; i++) {
    var el = nodes[i];
    if (el.hasAttribute('data-dyn') && !el.children.length) continue;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    if (cs.position === 'fixed') continue;
    var r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    seen++;
    if (!(r.right > vw + 2 || r.bottom > vh + 2 || r.left < -2 || r.top < -2)) continue;

    /* 判定是「真的把内容切了」还是「装饰性出血 / 入场动画」：
       - 左右被切、或底部被切，且元素里带文字   → 严重（学生名字被切掉了）
       - 只在顶部之上（降落伞入场、光晕上沿等） → 装饰，仅提示
       - 纯装饰元素（无文字）被切               → 装饰，仅提示          */
    var hasText = (el.textContent || '').replace(/\s/g, '').length > 0;
    var sidewaysOrBottom = (r.left < -2 || r.right > vw + 2 || r.bottom > vh + 2);
    var item = {
      cls: (el.className && el.className.toString().slice(0, 46)) || el.tagName,
      l: Math.round(r.left), t: Math.round(r.top),
      r: Math.round(r.right), b: Math.round(r.bottom)
    };
    if (hasText && sidewaysOrBottom) { if (out.clipped.length < 12) out.clipped.push(item); }
    else { if (out.deco.length < 12) out.deco.push(item); }
  }
  out.checked = seen;
  out.stageNodes = stage.querySelectorAll('*').length;
  return JSON.stringify(out);
})()`;

const ROLL = 'TC.toggleRoll()';

function judge(r, tag) {
  const p = [];
  if (r.jsError) p.push('JS报错: ' + r.jsError);
  if (r.scrollY) p.push('页面出现纵向滚动 docH=' + r.docH + ' > ' + r.vh);
  if (r.stageEmpty) p.push('找不到 .tc-stage');
  if (r.stageNodes < 4) p.push('舞台内容为空');
  if (r.clipped && r.clipped.length) {
    p.push('内容被切 ' + r.clipped.length + ' 处: ' +
      r.clipped.slice(0, 3).map(c => c.cls + '(' + c.l + ',' + c.t + '→' + c.r + ',' + c.b + ')').join(' | '));
  }
  return p;
}

/* 装饰性出血 / 入场动画，不算失败，但要露出来让人知道 */
function decoNote(r) {
  if (!r.deco || !r.deco.length) return '';
  return '  （另有 ' + r.deco.length + ' 处装饰层出血：' +
    r.deco.slice(0, 2).map(c => c.cls).join('、') + '，属正常）';
}

(async function main() {
  const browser = await findBrowser();
  if (!browser) { console.error('找不到 Chrome / Edge，跳过验证'); process.exit(1); }
  console.log('浏览器：' + browser + '\n');

  const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d\d-/.test(d.name))
    .map(d => d.name).sort()
    .filter(n => !ONLY || n.startsWith(ONLY));

  if (!dirs.length) { console.log('没有找到主题文件夹，先跑 node _build/build.js'); process.exit(0); }

  const shotDir = path.join(ROOT, '_build', 'shots');
  if (SHOTS) fs.mkdirSync(shotDir, { recursive: true });

  let fail = 0, total = 0;
  await launch(browser);

  try {
    for (const d of dirs) {
      const page = path.join(ROOT, d, 'index.html');
      const t = await openPage();
      console.log('▶ ' + d);

      for (const vp of VIEWPORTS) {
        await goto(t.cdp, page, vp.w, vp.h);
        const r = await t.cdp.json(LAYOUT_CHECK);
        total++;
        const p = judge(r, vp.name);
        if (p.length) { fail++; console.log('   ✗ [' + vp.name + ' ' + vp.w + '×' + vp.h + '] ' + p.join(' ; ')); }
        else console.log('   ✓ [' + vp.name + ' ' + vp.w + '×' + vp.h + '] 检查 ' + r.checked + ' 个元素，全部在屏内' + decoNote(r));

        if (SHOTS) {
          const s = await t.cdp.send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(shotDir, d.slice(0, 2) + '-' + vp.w + 'x' + vp.h + '.png'), Buffer.from(s.data, 'base64'));
        }
      }

      /* 模拟一次完整抽取，检查揭晓态是否也出屏、是否报错 */
      if (DO_ROLL) {
        await goto(t.cdp, page, 1280, 720);
        await t.cdp.eval(ROLL);
        await sleep(1300);
        await t.cdp.eval(ROLL);
        await sleep(1700);
        const r = await t.cdp.json(LAYOUT_CHECK);
        total++;
        const p = judge(r, '抽取后');
        if (p.length) { fail++; console.log('   ✗ [抽取后 1280×720] ' + p.join(' ; ')); }
        else console.log('   ✓ [抽取后 1280×720] 揭晓态正常，' + r.checked + ' 个元素在屏内' + decoNote(r));

        if (SHOTS) {
          const s = await t.cdp.send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(shotDir, d.slice(0, 2) + '-reveal.png'), Buffer.from(s.data, 'base64'));
        }
      }

      await t.close();
    }
  } finally {
    cleanup();
  }

  console.log('\n────────────────────────────────');
  console.log('共检查 ' + total + ' 项，失败 ' + fail + ' 项');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('验证脚本出错：', e); cleanup(); process.exit(2); });
