const path = require('path');
const { launch, openPage, findBrowser, goto, cleanup } = require('../cdp');
const ROOT = path.resolve(__dirname, '..', '..');

const EXPR = [
  '(function(){',
  '  var out = [];',
  '  var pts = [[95,90],[95,105],[640,100],[70,78]];',
  '  pts.forEach(function(p){',
  '    var els = document.elementsFromPoint(p[0], p[1]);',
  '    out.push(p.join(",") + " -> " + els.slice(0,4).map(function(e){',
  '      var r = e.getBoundingClientRect();',
  '      return (e.id || e.className || e.tagName) + "[" + Math.round(r.left) + "," + Math.round(r.top) + "," + Math.round(r.width) + "x" + Math.round(r.height) + "]";',
  '    }).join(" | "));',
  '  });',
  '  function rect(sel){',
  '    var e = document.querySelector(sel);',
  '    if (!e) return sel + " 无";',
  '    var r = e.getBoundingClientRect();',
  '    return sel + " " + [r.left,r.top,r.width,r.height].map(Math.round).join(",");',
  '  }',
  '  out.push(rect(".tc-stage"));',
  '  out.push(rect(".sp-root"));',
  '  out.push(rect("#sp-dust"));',
  '  var cv = document.querySelector("#sp-dust");',
  '  out.push("canvas bitmap " + cv.width + "x" + cv.height + " css " + cv.clientWidth + "x" + cv.clientHeight);',
  '  return JSON.stringify(out);',
  '})()'
].join('\n');

(async () => {
  await launch(await findBrowser());
  const t = await openPage();
  await goto(t.cdp, path.join(ROOT, '11-聚光灯黑板剧场点名', 'index.html'), 1280, 720);
  const r = await t.cdp.eval(EXPR);
  JSON.parse(r).forEach(function (l) { console.log(l); });
  await t.close();
  cleanup();
  process.exit(0);
})();
