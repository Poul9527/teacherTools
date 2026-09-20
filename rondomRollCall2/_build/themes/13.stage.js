/* ── 时空传送阵法 · 舞台脚本 ───────────────────────────────────────── */

var tpRoot = TC.$('#tp-root');
var tpRing = TC.$('#tp-ring');
var tpNames = TC.$('#tp-names');
var tpHud = TC.$('#tp-hud');
var tpCtx = tpRing ? tpRing.getContext('2d') : null;

var tpW = 0, tpH = 0;
var tpRaf = null, tpT = 0;
var tpSpin = 0;
var tpHeat = 0.06, tpHeatTo = 0.06;
var tpParts = [];
var tpRolling = false;
var tpTimer = null;
var tpHeatTimer = null;
var tpCells = [];
var tpMaxLen = 3;

/* 光柱落点（视口坐标），揭晓时从这里撒粒子 */
var TP_BASE = { x: 0, y: 0 };
function tpBaseAt(x, y) { TP_BASE.x = x; TP_BASE.y = y; }

/* ---------- 阵法画布 ---------- */
function tpSeed() {
  tpParts = [];
  for (var i = 0; i < 52; i++) {
    tpParts.push({
      a: Math.random() * 6.2832,
      r: 0.35 + Math.random() * 0.68,
      sp: 0.0016 + Math.random() * 0.0042,
      s: 0.6 + Math.random() * 1.6,
      ph: Math.random() * 6.28
    });
  }
}

function tpResize() {
  if (!tpRing || !tpCtx) return;
  var w = tpRing.parentElement.clientWidth, h = tpRing.parentElement.clientHeight;
  if (w <= 0 || h <= 0) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  tpRing.width = Math.floor(w * dpr);
  tpRing.height = Math.floor(h * dpr);
  tpCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tpW = w; tpH = h;
  tpSeed();
}

/* 尺寸变了就重建位图，避免画布被拉伸到错位 */
function tpResizeIfNeeded() {
  if (!tpRing) return;
  var w = tpRing.clientWidth, h = tpRing.clientHeight;
  if (w !== tpW || h !== tpH) tpResize();
}

function tpDraw() {
  if (!tpCtx || tpW <= 0) return;
  var cx = tpW / 2, cy = tpH / 2;
  var R = Math.min(tpW, tpH) / 2;
  if (R <= 6) return;
  var heat = tpHeat;
  tpCtx.clearRect(0, 0, tpW, tpH);
  tpCtx.save();
  tpCtx.translate(cx, cy);

  /* 中心柔光 */
  var g0 = tpCtx.createRadialGradient(0, 0, R * 0.02, 0, 0, R * 1.02);
  g0.addColorStop(0, 'rgba(125,211,252,' + (0.10 + heat * 0.30).toFixed(3) + ')');
  g0.addColorStop(0.55, 'rgba(56,189,248,' + (0.045 + heat * 0.14).toFixed(3) + ')');
  g0.addColorStop(1, 'rgba(56,189,248,0)');
  tpCtx.fillStyle = g0;
  tpCtx.beginPath(); tpCtx.arc(0, 0, R, 0, 6.284); tpCtx.fill();

  /* 外圈符文环（自转） */
  tpCtx.save();
  tpCtx.rotate(tpSpin);
  tpCtx.strokeStyle = 'rgba(125,211,252,' + (0.38 + heat * 0.55).toFixed(3) + ')';
  tpCtx.lineWidth = Math.max(1, R * 0.009);
  tpCtx.shadowBlur = 14; tpCtx.shadowColor = 'rgba(56,189,248,.9)';
  tpCtx.beginPath(); tpCtx.arc(0, 0, R * 0.955, 0, 6.284); tpCtx.stroke();
  tpCtx.beginPath(); tpCtx.arc(0, 0, R * 0.885, 0, 6.284); tpCtx.stroke();
  for (var i = 0; i < 48; i++) {
    var a = (i / 48) * 6.2832;
    var isLong = (i % 4 === 0);
    var r1 = R * 0.955 - (isLong ? R * 0.072 : R * 0.038);
    tpCtx.globalAlpha = isLong ? 0.95 : 0.48;
    tpCtx.beginPath();
    tpCtx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    tpCtx.lineTo(Math.cos(a) * R * 0.955, Math.sin(a) * R * 0.955);
    tpCtx.stroke();
  }
  tpCtx.globalAlpha = 1;
  tpCtx.restore();

  /* 内圈符文环（反向自转） */
  tpCtx.save();
  tpCtx.rotate(-tpSpin * 0.78);
  tpCtx.strokeStyle = 'rgba(129,140,248,' + (0.34 + heat * 0.5).toFixed(3) + ')';
  tpCtx.lineWidth = Math.max(1, R * 0.007);
  tpCtx.beginPath(); tpCtx.arc(0, 0, R * 0.70, 0, 6.284); tpCtx.stroke();
  for (var j = 0; j < 36; j++) {
    tpCtx.save();
    tpCtx.rotate((j / 36) * 6.2832);
    tpCtx.translate(R * 0.70, 0);
    tpCtx.rotate(1.5708);
    tpCtx.globalAlpha = 0.62;
    tpCtx.beginPath();
    tpCtx.moveTo(-R * 0.020, 0); tpCtx.lineTo(R * 0.020, 0);
    tpCtx.stroke();
    tpCtx.restore();
  }
  tpCtx.globalAlpha = 1;
  tpCtx.restore();

  /* 六芒星 */
  tpCtx.save();
  tpCtx.strokeStyle = 'rgba(186,230,253,' + (0.42 + heat * 0.55).toFixed(3) + ')';
  tpCtx.lineWidth = Math.max(1, R * 0.011);
  tpCtx.shadowBlur = 20; tpCtx.shadowColor = 'rgba(56,189,248,1)';
  var hr = R * 0.66, hrot = tpSpin * 0.45;
  for (var t = 0; t < 2; t++) {
    tpCtx.beginPath();
    for (var k = 0; k < 3; k++) {
      var ang = (k / 3) * 6.2832 + (t ? Math.PI / 3 : 0) + hrot;
      var px = Math.cos(ang) * hr, py = Math.sin(ang) * hr;
      if (k === 0) tpCtx.moveTo(px, py); else tpCtx.lineTo(px, py);
    }
    tpCtx.closePath();
    tpCtx.stroke();
  }
  tpCtx.beginPath(); tpCtx.arc(0, 0, R * 0.20, 0, 6.284); tpCtx.stroke();
  tpCtx.beginPath(); tpCtx.arc(0, 0, R * 0.075, 0, 6.284); tpCtx.stroke();
  tpCtx.restore();

  /* 能量粒子：静止时向上升腾，摇人时朝圆心汇聚 */
  for (var p = 0; p < tpParts.length; p++) {
    var pt = tpParts[p];
    var target = tpRolling ? 0.035 : 1.03;
    pt.r += (target - pt.r) * (tpRolling ? 0.022 : 0.011);
    pt.a += pt.sp * (tpRolling ? 3.4 : 1);
    pt.ph += 0.035;
    if (pt.r < 0.045) { pt.r = 1.03; pt.a = Math.random() * 6.2832; }
    var lift = tpRolling ? (1 - pt.r) * R * 0.22 : 0;
    var pxx = Math.cos(pt.a) * pt.r * R;
    var pyy = Math.sin(pt.a) * pt.r * R * 0.985 - lift;
    var al = (0.22 + Math.abs(Math.sin(pt.ph)) * 0.55) * (tpRolling ? 1 : 0.68);
    tpCtx.globalAlpha = al > 0.95 ? 0.95 : al;
    tpCtx.fillStyle = tpRolling ? '#e0f2fe' : '#7dd3fc';
    tpCtx.shadowBlur = 10; tpCtx.shadowColor = '#38bdf8';
    tpCtx.beginPath();
    tpCtx.arc(pxx, pyy, pt.s * (tpRolling ? 1.25 : 1), 0, 6.284);
    tpCtx.fill();
  }
  tpCtx.globalAlpha = 1;
  tpCtx.shadowBlur = 0;
  tpCtx.restore();
}

function tpLoop() {
  tpT++;
  tpResizeIfNeeded();
  tpSpin += tpRolling ? -0.026 : 0.0022;
  tpHeat += (tpHeatTo - tpHeat) * 0.045;
  tpDraw();
  tpRaf = requestAnimationFrame(tpLoop);
}

/* ---------- 光柱中的名字网格 ---------- */
function tpMeasureMaxLen() {
  var list = TC.students, max = 1;
  for (var i = 0; i < list.length; i++) {
    var L = (list[i].name || '').length;
    if (L > max) max = L;
  }
  tpMaxLen = Math.max(2, Math.min(6, max));
}

function tpBuild(n) {
  if (!tpNames) return;
  tpNames.innerHTML = '';
  tpCells = [];
  for (var i = 0; i < n; i++) {
    var el = document.createElement('div');
    el.className = 'tp-cw roll';
    el.innerHTML = '<span class="nm"></span><span class="id3 id-tag"></span>';
    tpNames.appendChild(el);
    tpCells.push(el);
  }
  tpLayout();
}

/* 先交给 autoFitGrid 算尺寸，再把列数收敛成能整除的均衡排布（行数只减不增，绝不会溢出） */
function tpFit(n) {
  var r = TC.autoFitGrid(tpNames, n, {
    gap: Math.max(5, Math.min(14, tpNames.clientWidth / 90)),
    ratio: 0.55, minW: 56, maxW: 460, maxH: 190, pad: 4
  });
  if (!r || !n) return r;
  var rows = Math.ceil(n / r.cols);
  var lo = Math.ceil(n / rows);
  var best = r.cols;
  for (var c = r.cols; c >= lo; c--) {
    if (n % c === 0) { best = c; break; }
  }
  if (best !== r.cols) {
    tpNames.style.gridTemplateColumns = 'repeat(' + best + ', ' + r.cw.toFixed(2) + 'px)';
    tpNames.dataset.cols = best;
    r = { cols: best, cw: r.cw, ch: r.ch };
  }
  return r;
}

/* 中文一字约 1em，只靠公式估算必然溢出，这里按真实渲染宽度收缩字号 */
function tpFitText(el, maxFs, boxW, boxH) {
  var fs = Math.max(12, maxFs);
  el.style.fontSize = Math.round(fs) + 'px';
  var guard = 0;
  while (guard++ < 18 && fs > 12 &&
    (el.getBoundingClientRect().width > boxW - 4 || el.getBoundingClientRect().height > boxH)) {
    fs = Math.max(12, fs - Math.max(1, Math.round(fs * 0.07)));
    el.style.fontSize = Math.round(fs) + 'px';
  }
  return Math.round(fs);
}

function tpLayout() {
  if (!tpNames || !tpCells.length) return;
  var r = tpFit(tpCells.length);
  if (!r) return;
  for (var i = 0; i < tpCells.length; i++) {
    var c = tpCells[i];
    var nm = c.querySelector('.nm');
    var id3 = c.querySelector('.id3');
    var len = Math.max(1, Math.min(8, (nm.textContent || '').length));
    var fs = tpFitText(nm, Math.min(r.ch * 0.60, r.cw * 0.90 / len), c.clientWidth || r.cw, r.ch * 0.72);
    id3.style.fontSize = Math.max(7, Math.round(fs * 0.28)) + 'px';
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  tpResize();
  tpMeasureMaxLen();
  tpBuild(1);
  if (!tpRaf) tpLoop();
  window.addEventListener('resize', tpResize);
}

function stageLayout() {
  tpResize();
  tpLayout();
}

function stageStartRoll() {
  if (!tpRoot) return;
  tpRolling = true;
  tpHeatTo = 1;
  if (tpHeatTimer) { clearTimeout(tpHeatTimer); tpHeatTimer = null; }
  tpRoot.classList.add('rolling');
  tpRoot.classList.remove('beaming');
  if (tpHud) tpHud.textContent = '阵 法 全 速 运 转 · 能 量 汇 聚 中';
  tpMeasureMaxLen();
  tpBuild(TC.getCount());
  var list = TC.students;
  if (!list.length) return;
  /* 人声层：时空门开启 */
  var c0 = TC.Music.init();
  if (c0) TC.Music.choir(TC.Music.midi(45), c0.currentTime, 3.0, 1.2);
  var t0 = Date.now();
  var tick = 0;
  tpTimer = setInterval(function () {
    if (!TC.rolling) return;
    tick++;
    var pr = Math.min(1, (Date.now() - t0) / 2800);
    /* ★ 摇人定时器里必须每次调用 */
    TC.Music.sfxRoll(pr);
    for (var i = 0; i < tpCells.length; i++) {
      var s = list[Math.floor(Math.random() * list.length)];
      tpCells[i].classList.add('roll');
      tpCells[i].classList.remove('on');
      tpCells[i].querySelector('.nm').textContent = s.name;
      tpCells[i].querySelector('.id3').textContent = 'No.' + s.id;
    }
    if (tick % 3 === 0) tpLayout();
  }, 62);
}

function stageStopRoll(winners) {
  if (tpTimer) { clearInterval(tpTimer); tpTimer = null; }
  if (!tpRoot) return;
  tpRolling = false;
  tpHeatTo = 1.65;
  tpRoot.classList.remove('rolling');
  tpRoot.classList.add('beaming');
  if (tpHud) tpHud.textContent = '传 送 通 道 已 开 启';
  var c = TC.Music.init();
  if (c) TC.Music.choir(TC.Music.midi(45), c.currentTime, 2.4, 1.4);
  /* 光柱落点 */
  var b = tpRing ? tpRing.getBoundingClientRect() : null;
  var cx = b ? b.left + b.width / 2 : window.innerWidth / 2;
  var cy = b ? b.top + b.height / 2 : window.innerHeight / 2;
  TC.FX.sparks(cx, cy, 54, '#bae6fd');
  TC.FX.sparks(cx, cy, 26, '#818cf8');
  TC.FX.ring(cx, cy, '#38bdf8', 0, 3);
  tpBaseAt(cx, cy);
  if (tpHeatTimer) clearTimeout(tpHeatTimer);
  tpHeatTimer = setTimeout(function () { tpHeatTo = 0.14; }, 1700);
}

function revealWinners(winners) {
  if (!tpNames || !winners || !winners.length) return;
  tpBuild(winners.length);
  for (var i = 0; i < tpCells.length; i++) {
    var w = winners[i];
    tpCells[i].classList.remove('roll');
    tpCells[i].querySelector('.nm').textContent = w.name;
    tpCells[i].querySelector('.id3').textContent = 'No.' + w.id;
  }
  tpLayout();
  for (var k = 0; k < tpCells.length; k++) {
    (function (cell, idx) {
      setTimeout(function () {
        cell.classList.add('on');
        var bb = cell.getBoundingClientRect();
        var cx = bb.left + bb.width / 2, cy = bb.top + bb.height / 2;
        TC.FX.sparks(cx, cy, 26, '#e0f2fe');
        TC.FX.ring(cx, cy, '#818cf8', 0, 2);
      }, idx * 150);
    })(tpCells[k], k);
  }
  /* 光柱收束成粒子散开 */
  setTimeout(function () {
    TC.FX.sparks(TP_BASE.x, TP_BASE.y, 70, '#bae6fd');
    TC.FX.sparks(TP_BASE.x, TP_BASE.y, 34, '#ffffff');
    TC.FX.ring(TP_BASE.x, TP_BASE.y, '#38bdf8', 0, 3);
  }, Math.max(120, tpCells.length * 150));
}

function stageClearReveal() {
  if (tpTimer) { clearInterval(tpTimer); tpTimer = null; }
  tpRolling = false;
  tpHeatTo = 0.10;
  if (tpRoot) tpRoot.classList.remove('rolling', 'beaming');
  if (tpHud) tpHud.textContent = '阵 法 待 启 · 按 空 格 启 动 传 送';
  if (tpNames) tpNames.innerHTML = '';
  tpCells = [];
  tpBuild(1);
}

function onResetHook() {
  if (tpHeatTimer) { clearTimeout(tpHeatTimer); tpHeatTimer = null; }
  stageClearReveal();
  tpMeasureMaxLen();
}

function themedPillStyle(el) {
  el.style.background = 'rgba(56,189,248,.18)';
  el.style.border = '1px solid rgba(129,140,248,.6)';
  el.style.color = '#bae6fd';
}
