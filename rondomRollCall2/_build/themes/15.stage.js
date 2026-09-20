/* ── 全息魔方矩阵 · 舞台脚本 ───────────────────────────────────────── */

var mxScene = TC.$('#mx-scene');
var mx3d = TC.$('#mx-3d');
var mxSpin = TC.$('#mx-spin');
var cubeEl = TC.$('#mx-cube');
var mxHud = TC.$('#mx-hud');
var mxNames = TC.$('#mx-names');

var mxFaces = [], mxCells = [];
var mxMode = 'idle';                 /* idle | rolling | settle | hold */
var rx = -16, ry = 22, rz = 0;       /* 当前三轴角度 */
var vx = 0.13, vy = 0.21, vz = 0.03; /* 角速度（度/帧@60fps） */
var settleT = { x: 0, y: 0, z: 0 };
var settleFrom = { x: 0, y: 0, z: 0 };
var settleStart = 0, settleDur = 820;
var mxRaf = null, mxLast = 0, mxSnap = false;
var nameTimer = null, nameT0 = 0, nameFlip = 0;
var pendingWinners = [];

/* ---------- 背景：矩阵代码雨 ---------- */
var mxBg = TC.$('#mx-bg'), mxBgCtx = mxBg.getContext('2d');
var mxCols = [], mxBgRaf = null;

function bgResize() {
  if (!mxBg) return;
  var w = mxBg.parentElement.clientWidth, h = mxBg.parentElement.clientHeight;
  if (!w || !h) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  mxBg.width = Math.floor(w * dpr); mxBg.height = Math.floor(h * dpr);
  mxBgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mxBgCtx.fillStyle = '#03060f';
  mxBgCtx.fillRect(0, 0, w, h);
  var n = Math.max(14, Math.min(48, Math.round(w / 34)));
  mxCols = [];
  for (var i = 0; i < n; i++) {
    mxCols.push({
      x: (i + 0.5) * (w / n) + (Math.random() - 0.5) * 8,
      y: Math.random() * h,
      len: h * (0.12 + Math.random() * 0.30),
      sp: 0.9 + Math.random() * 3.4,
      a: 0.10 + Math.random() * 0.30
    });
  }
}

function bgLoop() {
  if (!mxBg) return;
  var w = mxBg.clientWidth, h = mxBg.clientHeight;
  /* 拖尾淡出，形成代码雨余晖 */
  mxBgCtx.globalCompositeOperation = 'source-over';
  mxBgCtx.fillStyle = 'rgba(3,6,15,.20)';
  mxBgCtx.fillRect(0, 0, w, h);
  mxBgCtx.globalCompositeOperation = 'lighter';
  for (var i = 0; i < mxCols.length; i++) {
    var c = mxCols[i];
    c.y += c.sp;
    if (c.y - c.len > h) { c.y = -Math.random() * 120; c.len = h * (0.12 + Math.random() * 0.30); }
    var g = mxBgCtx.createLinearGradient(0, c.y - c.len, 0, c.y);
    g.addColorStop(0, 'rgba(34,211,238,0)');
    g.addColorStop(0.72, 'rgba(34,211,238,' + (c.a * 0.55).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(199,210,254,' + c.a.toFixed(2) + ')');
    mxBgCtx.strokeStyle = g;
    mxBgCtx.lineWidth = 1.6;
    mxBgCtx.beginPath();
    mxBgCtx.moveTo(c.x, c.y - c.len);
    mxBgCtx.lineTo(c.x, c.y);
    mxBgCtx.stroke();
  }
  mxBgCtx.globalCompositeOperation = 'source-over';
  mxBgRaf = requestAnimationFrame(bgLoop);
}

/* ---------- 魔方构造 ---------- */
function buildCube() {
  if (!cubeEl) return;
  cubeEl.innerHTML = '';
  mxFaces = []; mxCells = [];
  for (var f = 0; f < 6; f++) {
    var fe = document.createElement('div');
    fe.className = 'cface f' + f;
    for (var i = 0; i < 9; i++) {
      var ce = document.createElement('div');
      ce.className = 'fcell';
      ce.innerHTML = '<span class="fi"></span><span class="fn"></span>';
      var ref = { el: ce, n: ce.querySelector('.fn'), d: ce.querySelector('.fi') };
      mxCells.push(ref);
      fe.appendChild(ce);
    }
    cubeEl.appendChild(fe);
    mxFaces.push(fe);
  }
  fillCells();
}

function fillCells() {
  var list = TC.students || [];
  for (var i = 0; i < mxCells.length; i++) {
    var c = mxCells[i];
    c.el.classList.remove('hot');
    if (!list.length) { c.n.textContent = '--'; c.d.textContent = '00'; continue; }
    var s = list[i % list.length];
    c.n.textContent = s.name;
    c.d.textContent = s.id;
  }
}

/* ---------- 尺寸自适应 ---------- */
function layout() {
  if (!mx3d || !mxScene) return;
  var sr = mxScene.getBoundingClientRect();
  var w = sr.width, h = sr.height;
  if (!w || !h) return;
  /* 基准 min(58vh,46vw)，再按舞台实际可用空间收敛 */
  var size = Math.min(window.innerHeight * 0.58, window.innerWidth * 0.46);
  size = Math.min(size, h * 0.94, w * 0.88);
  size = Math.max(140, size);
  mx3d.style.setProperty('--cube', size.toFixed(1) + 'px');
  mx3d.style.setProperty('--half', (size / 2).toFixed(1) + 'px');
  /* 旋转时立方体对角线最长，按 1.42 倍收缩，保证翻滚中也不出屏 */
  var diag = size * 1.42;
  var fit = Math.min(1, (h * 0.94) / diag, (w * 0.94) / diag);
  mx3d.style.setProperty('--fit', fit.toFixed(3));
  /* 格子字号跟着面尺寸走，绝不写死 */
  var cf = Math.max(8, Math.round(size / 3 * 0.30));
  mxScene.style.setProperty('--cf', cf + 'px');
  mxScene.style.setProperty('--cfi', Math.max(6, Math.round(cf * 0.46)) + 'px');
}

/* ---------- 旋转主循环 ---------- */
function writeTransform() {
  if (cubeEl) {
    cubeEl.style.transform =
      'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
  }
  if (mxSpin) mxSpin.style.transform = 'rotateZ(' + rz.toFixed(2) + 'deg)';
}

function normAngle() {
  if (rx > 3600) rx -= 3600; else if (rx < -3600) rx += 3600;
  if (ry > 3600) ry -= 3600; else if (ry < -3600) ry += 3600;
  if (rz > 3600) rz -= 3600; else if (rz < -3600) rz += 3600;
}

function cubeLoop(ts) {
  if (!mxLast) mxLast = ts;
  var dt = (ts - mxLast) / 16.667;
  mxLast = ts;
  if (!(dt > 0)) dt = 1;
  if (dt > 3) dt = 3;

  var k;
  if (mxMode === 'rolling') {
    k = 1 - Math.pow(0.90, dt);
    vx += (7.2 - vx) * k;
    vy += (9.6 - vy) * k;
    vz += (3.4 - vz) * k;
    rx += vx * dt; ry += vy * dt; rz += vz * dt;
  } else if (mxMode === 'settle') {
    /* 减速缓动：沿原方向多转一点，再稳稳对齐到 90 的倍数（正面朝观众） */
    if (!settleStart) settleStart = ts;
    var p = (ts - settleStart) / settleDur;
    if (p > 1) p = 1;
    var e = 1 - Math.pow(1 - p, 4);
    rx = settleFrom.x + (settleT.x - settleFrom.x) * e;
    ry = settleFrom.y + (settleT.y - settleFrom.y) * e;
    rz = settleFrom.z + (settleT.z - settleFrom.z) * e;
    if (p >= 1) {
      rx = settleT.x; ry = settleT.y; rz = settleT.z;
      normAngle();
      mxMode = 'hold';
      mxSnap = true;
    }
  } else if (mxMode === 'idle') {
    k = 1 - Math.pow(0.94, dt);
    vx += (0.13 - vx) * k;
    vy += (0.21 - vy) * k;
    vz += (0.02 - vz) * k;
    rx += vx * dt; ry += vy * dt; rz += vz * dt;
  } else {
    vx = 0; vy = 0; vz = 0;
  }

  if (mxMode !== 'settle') normAngle();
  writeTransform();
  if (mxSnap) { mxSnap = false; onSettled(); }

  mxRaf = requestAnimationFrame(cubeLoop);
}

function frontFace() {
  var best = null, bestA = -1;
  for (var i = 0; i < mxFaces.length; i++) {
    var r = mxFaces[i].getBoundingClientRect();
    var a = r.width * r.height;
    if (a > bestA) { bestA = a; best = mxFaces[i]; }
  }
  return best;
}

function onSettled() {
  if (cubeEl) cubeEl.classList.add('locked');
  var f = frontFace();
  if (f) f.classList.add('locked');
  highlightFront();
  var c = TC.FX.center();
  TC.FX.ring(c.x, c.y, '#22d3ee', 0, 3);
  TC.FX.speedLines(420, 'rgba(34,211,238,.85)');
  TC.FX.flash('#22d3ee', 0.18);
  var ac = TC.Music.init();
  if (ac) {
    TC.Music.crash(ac.currentTime, 0.85);
    TC.Music.kick(ac.currentTime, 1.1);
  }
  setTimeout(function () {
    if (cubeEl) cubeEl.classList.remove('locked');
    if (f) f.classList.remove('locked');
  }, 620);
}

function highlightFront() {
  if (!pendingWinners.length) return;
  var f = frontFace();
  if (!f) return;
  var fc = f.querySelectorAll('.fcell');
  var order = [4, 1, 3, 5, 7, 0];
  for (var i = 0; i < pendingWinners.length && i < order.length; i++) {
    var cell = fc[order[i]];
    if (!cell) continue;
    cell.classList.add('hot');
    cell.querySelector('.fn').textContent = pendingWinners[i].name;
    cell.querySelector('.fi').textContent = pendingWinners[i].id;
  }
}

/* ---------- 摇人时格子高速刷屏 ---------- */
function startNameRoll() {
  stopNameRoll();
  nameT0 = Date.now();
  nameFlip = 0;
  nameTimer = setInterval(function () {
    var list = TC.students || [];
    if (!list.length) return;
    var half = nameFlip % 2;
    for (var i = 0; i < mxCells.length; i++) {
      if (i % 2 !== half) continue;
      var s = list[Math.floor(Math.random() * list.length)];
      mxCells[i].n.textContent = s.name;
      mxCells[i].d.textContent = s.id;
    }
    nameFlip++;
    TC.Music.sfxRoll(Math.min(1, (Date.now() - nameT0) / 2800));
    /* 机械齿轮转动声：高频方波短音 */
    if (Math.random() < 0.5) {
      var ac = TC.Music.init();
      if (ac) {
        TC.Music.tone(TC.Music.midi(84 + Math.floor(Math.random() * 13)),
          ac.currentTime, 0.035, 0.030, 'square', null, { cut: 7000 });
      }
    }
  }, 78);
}

function stopNameRoll() {
  if (nameTimer) { clearInterval(nameTimer); nameTimer = null; }
}

/* 沿当前旋转方向继续转过一截，落到最近的 90 度倍数上 */
function alignAhead(a, v) {
  var dir = v >= 0 ? 1 : -1;
  var extra = 55 + Math.random() * 55;
  var t = (a + dir * extra) / 90;
  return (dir > 0 ? Math.ceil(t) : Math.floor(t)) * 90;
}

function settleCube() {
  mxMode = 'settle';
  settleFrom.x = rx; settleFrom.y = ry; settleFrom.z = rz;
  settleT.x = alignAhead(rx, vx);
  settleT.y = alignAhead(ry, vy);
  settleT.z = alignAhead(rz, vz);
  settleStart = 0;
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  bgResize();
  buildCube();
  layout();
  writeTransform();
  if (!mxBgRaf) bgLoop();
  if (!mxRaf) mxRaf = requestAnimationFrame(cubeLoop);
  window.addEventListener('resize', bgResize);
}

function stageLayout() {
  bgResize();
  layout();
}

function stageStartRoll() {
  if (mxHud) mxHud.classList.remove('active');
  pendingWinners = [];
  for (var i = 0; i < mxCells.length; i++) mxCells[i].el.classList.remove('hot');
  if (cubeEl) cubeEl.classList.remove('locked');
  for (var f = 0; f < mxFaces.length; f++) mxFaces[f].classList.remove('locked');
  mxSnap = false;
  mxMode = 'rolling';
  startNameRoll();
}

function stageStopRoll(winners) {
  stopNameRoll();
  pendingWinners = winners || [];
  settleCube();
}

function revealWinners(winners) {
  if (!mxHud) return;
  mxNames.innerHTML = '';
  var list = winners || pendingWinners;
  for (var i = 0; i < list.length; i++) {
    var w = list[i];
    var d = document.createElement('div');
    d.className = 'mx-one';
    d.style.animationDelay = (0.80 + i * 0.10).toFixed(2) + 's';
    d.innerHTML = '<div class="mid"></div><div class="mnm"></div>';
    d.querySelector('.mid').textContent = 'ID:' + w.id;
    d.querySelector('.mnm').textContent = w.name;
    mxNames.appendChild(d);
  }
  mxHud.classList.add('active');
}

function stageClearReveal() {
  if (mxHud) mxHud.classList.remove('active');
}

function onResetHook() {
  stopNameRoll();
  if (mxHud) mxHud.classList.remove('active');
  pendingWinners = [];
  mxSnap = false;
  for (var i = 0; i < mxCells.length; i++) mxCells[i].el.classList.remove('hot');
  if (cubeEl) cubeEl.classList.remove('locked');
  fillCells();
  mxMode = 'idle';
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(99,102,241,.30), rgba(34,211,238,.24))';
  el.style.border = '1px solid rgba(34,211,238,.62)';
  el.style.color = '#a5f3fc';
}
