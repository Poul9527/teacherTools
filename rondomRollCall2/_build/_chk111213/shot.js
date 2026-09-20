/* 11/12/13 截图：1280x720 静止态 + 摇人中 + 揭晓态（验完可删） */
const fs = require('fs');
const path = require('path');
const { launch, openPage, findBrowser, goto, sleep, cleanup } = require('../cdp');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = __dirname;
const dirs = ['11-聚光灯黑板剧场点名', '12-盲盒拆拆乐点名', '13-时空传送阵法点名'];

(async () => {
  const exe = await findBrowser();
  if (!exe) { console.log('未找到 Chrome'); return; }
  console.log('浏览器：' + exe);
  await launch(exe);

  for (const d of dirs) {
    const t = await openPage();
    const f = path.join(ROOT, d, 'index.html');
    await goto(t.cdp, f, 1280, 720);

    /* 静止态 */
    await t.cdp.send('Runtime.evaluate', { expression: 'document.querySelectorAll(".tc-toast-wrap")[0] && (document.querySelectorAll(".tc-toast-wrap")[0].innerHTML="");1' });
    let s = await t.cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, d.slice(0, 2) + '-idle.png'), Buffer.from(s.data, 'base64'));

    /* 摇人中 */
    await t.cdp.eval('TC.toggleRoll(); 1');
    await sleep(700);
    s = await t.cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, d.slice(0, 2) + '-rolling.png'), Buffer.from(s.data, 'base64'));

    /* 揭晓态（3 人，覆盖多人排版） */
    await t.cdp.eval('document.getElementById("sel-count").value="3"; 1');
    await t.cdp.eval('TC.toggleRoll(); 1');
    await sleep(1500);
    s = await t.cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, d.slice(0, 2) + '-reveal.png'), Buffer.from(s.data, 'base64'));

    const err = await t.cdp.eval('window.__tcError || "none"');
    const grid = await t.cdp.eval('(function(){var g=document.querySelector("#sp-chalk,#bb-cards,#tp-names");return g?(g.dataset.cols+"|"+g.dataset.cw+"|"+g.dataset.ch):"none";})()');
    console.log(d + '  网格 ' + grid + '  JS错误: ' + err);
    await t.close();
  }
  cleanup();
  process.exit(0);
})();
