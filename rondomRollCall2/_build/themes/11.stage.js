/* ── 聚光灯黑板剧场 · 舞台脚本 ─────────────────────────────────────── */

var spRoot = TC.$('#sp-root');
var spChalk = TC.$('#sp-chalk');
var spHead = TC.$('#sp-head');
var beamL = TC.$('#sp-beam-l');
var beamR = TC.$('#sp-beam-r');

var spCells = [];
var spRollTimer = null;
var spFocus = false;
var spT = 0;
var spRaf = null;
var spMaxLen = 3;

/* ---------- 背景：粉笔灰光尘 ---------- */
var spDust = TC.$('#sp-dust'), dctx = spDust ? spDust.getContext('2d') : null;
var spMotes = [];
var spW = 0, spH = 0;

function spResize() {
  if (!spDust || !dctx) return;
  var w = spDust.parentElement.clientWidth, h = spDust.parentElement.clientHeight;
  if (w <= 0 || h <= 0) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  spDust.width = Math.floor(w * dpr);
  spDust.height = Math.floor(h * dpr);
  dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  spW = w; spH = h;
  var n = Math.round(w * h / 24000);
  spMotes = [];
  for (var i = 0; i < n; i++) {
    spMotes.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.5 + Math.random() * 1.7,
      vx: (Math.random() - 0.5) * 0.20,
      vy: -0.04 - Math.random() * 0.24,
      ph: Math.random() * 6.28,
      sp: 0.006 + Math.random() * 0.022
    });
  }
}

function spDustLoop() {
  if (!spDust || !dctx) return;
  var w = spDust.clientWidth, h = spDust.clientHeight;
  if (w <= 0 || h <= 0) return;
  /* 尺寸变了就重建位图，避免画布被拉伸到错位 */
  if (w !== spW || h !== spH) spResize();
  dctx.clearRect(0, 0, w, h);
  var hot = spRoot && spRoot.classList.contains('rolling');
  var boost = hot ? 1.9 : 1;
  for (var i = 0; i < spMotes.length; i++) {
    var m = spMotes[i];
    m.ph += m.sp;
    m.x += m.vx + Math.sin(m.ph) * 0.16;
    m.y += m.vy;
    if (m.y < -12) { m.y = h + 10; m.x = Math.random() * w; }
    if (m.x < -12) m.x = w + 10;
    if (m.x > w + 12) m.x = -10;
    var a = (0.10 + Math.abs(Math.sin(m.ph)) * 0.34) * boost;
    if (a > 0.92) a = 0.92;
    dctx.fillStyle = 'rgba(253,246,220,' + a.toFixed(2) + ')';
    dctx.beginPath();
    dctx.arc(m.x, m.y, m.r * (hot ? 1.25 : 1), 0, 6.284);
    dctx.fill();
  }
}

/* ---------- 追光灯光锥 ---------- */
function spBeamLoop() {
  if (!beamL || !beamR || !spRoot) return;
  var w = spRoot.clientWidth || 1;
  if (spRoot.classList.contains('rolling')) {
    var k = spT * 0.058;
    var amp = w * 0.165;
    var d = Math.sin(k) * amp;
    var rot = Math.cos(k) * 5.5;
    beamL.style.transform = 'translateX(' + d.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
    beamR.style.transform = 'translateX(' + (-d).toFixed(1) + 'px) rotate(' + (-rot).toFixed(2) + 'deg)';
  } else if (!spFocus) {
    var d2 = Math.sin(spT * 0.0075) * w * 0.028;
    beamL.style.transform = 'translateX(' + d2.toFixed(1) + 'px)';
    beamR.style.transform = 'translateX(' + (-d2).toFixed(1) + 'px)';
  }
}

function spConverge() {
  if (!beamL || !beamR || !spRoot) return;
  var w = spRoot.clientWidth || 1;
  spFocus = true;
  var dx = w * 0.28;
  beamL.style.transform = 'translateX(' + dx.toFixed(1) + 'px) scaleX(.52)';
  beamR.style.transform = 'translateX(' + (-dx).toFixed(1) + 'px) scaleX(.52)';
}

function spReleaseBeams() {
  spFocus = false;
  if (beamL) beamL.style.transform = '';
  if (beamR) beamR.style.transform = '';
}

function spLoop() {
  spT++;
  spDustLoop();
  spBeamLoop();
  spRaf = requestAnimationFrame(spLoop);
}

/* ---------- 黑板粉笔字网格 ---------- */
function spMeasureMaxLen() {
  var list = TC.students, max = 1;
  for (var i = 0; i < list.length; i++) {
    var L = (list[i].name || '').length;
    if (L > max) max = L;
  }
  spMaxLen = Math.max(2, Math.min(6, max));
}

function spBuildChalk(n) {
  if (!spChalk) return;
  spChalk.innerHTML = '';
  spCells = [];
  for (var i = 0; i < n; i++) {
    var el = document.createElement('div');
    el.className = 'sp-cw';
    el.innerHTML = '<span class="ck"></span><span class="cb"></span><span class="cid id-tag"></span>';
    spChalk.appendChild(el);
    spCells.push(el);
  }
  spLayoutChalk();
}

/* 先交给 autoFitGrid 算尺寸，再把列数收敛成能整除的均衡排布（行数只减不增，绝不会溢出） */
function spFit(n) {
  var r = TC.autoFitGrid(spChalk, n, {
    gap: Math.max(6, Math.min(16, spChalk.clientWidth / 120)),
    ratio: 0.40, minW: 84, maxW: 900, maxH: 250, pad: 4
  });
  if (!r || !n) return r;
  var rows = Math.ceil(n / r.cols);
  var lo = Math.ceil(n / rows);
  var best = r.cols;
  for (var c = r.cols; c >= lo; c--) {
    if (n % c === 0) { best = c; break; }
  }
  if (best !== r.cols) {
    spChalk.style.gridTemplateColumns = 'repeat(' + best + ', ' + r.cw.toFixed(2) + 'px)';
    spChalk.dataset.cols = best;
    r = { cols: best, cw: r.cw, ch: r.ch };
  }
  return r;
}

function spLayoutChalk() {
  if (!spChalk || !spCells.length) return;
  var r = spFit(spCells.length);
  if (r) spApplyFonts(r);
  return r;
}

/* 按格子尺寸与字数自适应字号：绝不写死 px，超出就缩到放得下 */
function spFitCell(cell, maxFs) {
  var t = cell.querySelector('.ck');
  if (!t) return;
  var bw = (cell.clientWidth || 1) - 2;
  var fs = Math.max(11, maxFs);
  t.style.fontSize = fs + 'px';
  var guard = 0;
  while (guard++ < 14 && t.getBoundingClientRect().width > bw && fs > 11) {
    fs = Math.max(11, fs - Math.max(1, Math.round(fs * 0.07)));
    t.style.fontSize = fs + 'px';
  }
}

function spApplyFonts(r) {
  for (var i = 0; i < spCells.length; i++) {
    var cell = spCells[i];
    var len = spMaxLen;
    var t = cell.querySelector('.ck');
    if (t && t.textContent) len = Math.max(1, Math.min(8, t.textContent.length));
    /* 字号同时受行高、格宽与字数约束，保证永远不出格 */
    var byH = r.ch * 0.60;
    var byW = r.cw * 1.72 / len;
    spFitCell(cell, Math.min(byH, byW));
    var cid = cell.querySelector('.cid');
    if (cid) cid.style.fontSize = Math.max(8, Math.round(Math.min(r.ch * 0.17, r.cw * 0.09))) + 'px';
  }
}

function spSetCellName(cell, s) {
  cell.querySelector('.ck').textContent = s.name;
  cell.querySelector('.cid').textContent = 'No.' + s.id;
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  spResize();
  spMeasureMaxLen();
  spBuildChalk(1);
  if (!spRaf) spLoop();
  window.addEventListener('resize', spResize);
}

function stageLayout() {
  spResize();
  spLayoutChalk();
}

function stageStartRoll() {
  if (!spRoot) return;
  spReleaseBeams();
  spRoot.classList.add('rolling');
  if (spHead) spHead.textContent = '正 在 抽 取';
  spMeasureMaxLen();
  spBuildChalk(TC.getCount());
  var list = TC.students;
  if (!list.length) return;
  var t0 = Date.now();
  var tick = 0;
  spRollTimer = setInterval(function () {
    tick++;
    var pr = Math.min(1, (Date.now() - t0) / 2800);
    /* ★ 摇人定时器里必须每次调用，节奏会随进度加急 */
    TC.Music.sfxRoll(pr);
    for (var i = 0; i < spCells.length; i++) {
      var c = spCells[i];
      c.classList.remove('won');
      c.classList.add('rolling');
      var s = list[Math.floor(Math.random() * list.length)];
      spSetCellName(c, s);
    }
    if (tick % 3 === 0) spLayoutChalk();
  }, 62);
}

function stageStopRoll(winners) {
  if (spRollTimer) { clearInterval(spRollTimer); spRollTimer = null; }
  if (spRoot) spRoot.classList.remove('rolling');
  if (spHead) spHead.textContent = '今 日 登 台';
  /* 两束追光缓缓交汇，聚焦黑板正中 */
  spConverge();
  if (beamL) beamL.classList.add('hot');
  if (beamR) beamR.classList.add('hot');
  setTimeout(function () {
    if (beamL) beamL.classList.remove('hot');
    if (beamR) beamR.classList.remove('hot');
  }, 1600);
  if (spChalk) {
    var r = spChalk.getBoundingClientRect();
    TC.FX.sparks(r.left + r.width / 2, r.top + r.height / 2, 26, '#e2e8f0');
  }
}

function revealWinners(winners) {
  if (!spChalk || !winners || !winners.length) return;
  /* 先按中选者人数重排粉笔字，再写入名字精确适配字号 */
  spBuildChalk(winners.length);
  for (var i = 0; i < spCells.length; i++) {
    spCells[i].classList.remove('rolling');
    spSetCellName(spCells[i], winners[i]);
  }
  spLayoutChalk();
  /* 一笔一划浮现 + 周围撒粉笔灰 */
  for (var k = 0; k < spCells.length; k++) {
    (function (cell, idx) {
      setTimeout(function () {
        cell.classList.add('won');
        var b = cell.getBoundingClientRect();
        var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        TC.FX.sparks(cx, cy, 30, '#e2e8f0');
        TC.FX.sparks(cx, cy, 14, '#fde68a');
        var c = TC.Music.init();
        if (c) {
          /* 粉笔沙沙：短促高频噪声感颗粒 */
          TC.Music.tone(TC.Music.midi(86 + idx), c.currentTime, 0.10, 0.030, 'triangle');
          TC.Music.whoosh(c.currentTime, 0.22, 0.45);
        }
      }, idx * 190);
    })(spCells[k], k);
  }
}

function stageClearReveal() {
  if (spChalk) spChalk.innerHTML = '';
  spCells = [];
  if (spHead) spHead.textContent = '今 日 登 台';
  if (spRoot) spRoot.classList.remove('rolling');
  spReleaseBeams();
  spBuildChalk(1);
}

function onResetHook() {
  if (spRollTimer) { clearInterval(spRollTimer); spRollTimer = null; }
  if (spRoot) spRoot.classList.remove('rolling');
  spReleaseBeams();
  if (spHead) spHead.textContent = '今 日 登 台';
  if (spChalk) spChalk.innerHTML = '';
  spCells = [];
  spMeasureMaxLen();
  spBuildChalk(1);
}

function themedPillStyle(el) {
  el.style.background = 'rgba(20,184,166,.16)';
  el.style.border = '1px solid rgba(245,158,11,.55)';
  el.style.color = '#a7f3d0';
}
