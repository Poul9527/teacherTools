const fs = require('fs');
const path = require('path');
const { launch, openPage, findBrowser, goto, cleanup } = require('../cdp');
const ROOT = path.resolve(__dirname, '..', '..');

(async () => {
  await launch(await findBrowser());
  const t = await openPage();
  await goto(t.cdp, path.join(ROOT, '11-聚光灯黑板剧场点名', 'index.html'), 1280, 720);
  /* 把装饰层逐个关掉，看那条竖线到底属于谁 */
  const variants = [
    ['all', '1'],
    ['no-dust', 'document.querySelector("#sp-dust").style.display="none";1'],
    ['no-beams', 'document.querySelectorAll(".sp-beam").forEach(function(e){e.style.display="none";});1'],
    ['both-off', 'document.querySelector("#sp-dust").style.display="none";document.querySelectorAll(".sp-beam").forEach(function(e){e.style.display="none";});1']
  ];
  for (const [name, js] of variants) {
    await t.cdp.eval(js);
    await new Promise(r => setTimeout(r, 250));
    const s = await t.cdp.send('Page.captureScreenshot', {
      format: 'png', clip: { x: 55, y: 68, width: 200, height: 90, scale: 4 }
    });
    fs.writeFileSync(path.join(__dirname, 'zoom-' + name + '.png'), Buffer.from(s.data, 'base64'));
  }
  await t.close();
  cleanup();
  process.exit(0);
})();
