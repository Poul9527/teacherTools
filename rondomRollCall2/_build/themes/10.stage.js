/* ── 弹幕气泡爆炸 · 舞台脚本 ─────────────────────────────────────── */

var bbField = TC.$('#bb-field');
var bbBox = TC.$('#bb-bubbles');
var bbCross = TC.$('#bb-cross');
var bbReveal = TC.$('#bb-reveal');
var bbList = TC.$('#bb-list');

var bbBg = TC.$('#bb-bg'), bbBgCtx = bbBg ? bbBg.getContext('2d') : null;
var bbBubs = [], bbRaf = null, bbBgRaf = null, bbT = 0;
var bbD = 60, bbCols = 1, bbCW = 60, bbCH = 60, bbGap = 8;
var bbRollTimer = null, bbT0 = 0, bbLockIdx = -1;

var BB_COLORS = [
  [236, 72, 153], [168, 85, 247], [56, 189, 248], [52, 211, 153],
  [250, 204, 21], [249, 115, 22], [129, 140, 248], [244, 114, 182],
  [45, 212, 191], [232, 121, 249]
];

function bbRGBA(c, a) {
  return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
}

/* ---------- 背景：梦幻光斑 ---------- */
var bbBokeh = [];

function bbBgResize() {
  if (!bbBg || !bbBgCtx) return;
  var w = bbBg.parentElement.clientWidth, h = bbBg.parentElement.clientHeight;
  if (!w || !h) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  bbBg.width = Math.round(w * dpr);
  bbBg.height = Math.round(h * dpr);
  bbBgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  bbBokeh = [];
  var n = Math.max(14, Math.round(w * h / 34000));
  for (var i = 0; i < n; i++) {
    var c = BB_COLORS[i % BB_COLORS.length];
    bbBokeh.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 24 + Math.random() * 96,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.10 + Math.random() * 0.36),
      a: 0.05 + Math.random() * 0.12,
      c: c
    });
  }
}

function bbBgDraw() {
  if (!bbBgCtx) return;
  var w = bbBg.clientWidth, h = bbBg.clientHeight;
  if (!w || !h) return;
  var c = bbBgCtx;
  c.clearRect(0, 0, w, h);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (var i = 0; i < bbBokeh.length; i++) {
    var b = bbBokeh[i];
    b.x += b.vx; b.y += b.vy;
    if (b.y < -b.r) { b.y = h + b.r; b.x = Math.random() * w; }
    if (b.x < -b.r) b.x = w + b.r;
    if (b.x > w + b.r) b.x = -b.r;
    var g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, bbRGBA(b.c, b.a));
    g.addColorStop(0.55, bbRGBA(b.c, b.a * 0.35));
    g.addColorStop(1, bbRGBA(b.c, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(b.x, b.y, b.r, 0, 6.2832);
    c.fill();
  }
  c.restore();
}

/* ---------- 建立泡泡 ---------- */
function bbBuild() {
  if (!bbBox) return;
  bbBox.innerHTML = '';
  bbBubs = [];
  var list = TC.students;
  list.forEach(function (s, i) {
    var col = BB_COLORS[i % BB_COLORS.length];
    var el = document.createElement('div');
    el.className = 'bb-ball';
    el.innerHTML =
      '<div class="bb-float">' +
      '<div class="bb-skin"></div>' +
      '<span class="bb-hi"></span><span class="bb-hi2"></span>' +
      '<div class="bb-txt"><span class="bb-id id-tag"></span><span class="bb-nm"></span></div>' +
      '</div>' +
      '<div class="bb-halo"></div>';
    var skin = el.querySelector('.bb-skin');
    skin.style.background = 'radial-gradient(circle at 32% 26%, rgba(255,255,255,.95) 0%, ' +
      bbRGBA(col, 0.60) + ' 34%, ' + bbRGBA(col, 0.20) + ' 72%, ' + bbRGBA(col, 0.38) + ' 100%)';
    skin.style.border = '1.5px solid ' + bbRGBA(col, 0.85);
    skin.style.boxShadow = 'inset -8px -10px 24px ' + bbRGBA(col, 0.42) + ', 0 0 22px ' + bbRGBA(col, 0.55);
    el.querySelector('.bb-id').textContent = s.id;
    el.querySelector('.bb-nm').textContent = s.name;
    el.title = s.id + ' ' + s.name;
    bbBox.appendChild(el);
    bbBubs.push({
      el: el, fl: el.querySelector('.bb-float'), halo: el.querySelector('.bb-halo'),
      s: s, cx: 0, cy: 0, ampX: 4, ampY: 4,
      ph: Math.random() * 6.28, sp: 0.62 + Math.random() * 0.95,
      lock: false, burst: false, bt: 0, gone: false
    });
  });
  bbLayout();
  bbSyncPicked();
}

/* ---------- 排布：autoFitGrid 给出格子几何，按行居中摆放 ---------- */
function bbLayout() {
  if (!bbBox || !bbBubs.length) return;
  var W = bbBox.clientWidth, H = bbBox.clientHeight;
  if (!W || !H) return;
  var n = bbBubs.length;
  var r = TC.autoFitGrid(bbBox, n, { gap: bbGap, ratio: 0.85, minW: 56, maxW: 150, pad: 1 });
  if (!r) return;
  var cols = r.cols, cw = r.cw, ch = r.ch;
  bbCols = cols; bbCW = cw; bbCH = ch;
  var rows = Math.ceil(n / cols);
  var totalH = rows * ch + (rows - 1) * bbGap;
  var D = Math.max(22, Math.min(cw, ch) * 0.82);
  bbD = D;

  var maxLen = 2;
  for (var q = 0; q < n; q++) {
    if (bbBubs[q].s.name.length > maxLen) maxLen = bbBubs[q].s.name.length;
  }
  var nmF = Math.max(9, Math.min(Math.round(D * 0.34), Math.floor(D * 0.80 / Math.max(2, maxLen))));
  var idF = Math.max(8, Math.round(nmF * 0.5));

  for (var i = 0; i < n; i++) {
    var row = Math.floor(i / cols), col = i % cols;
    var cnt = Math.min(cols, n - row * cols);
    var rowW = cnt * cw + (cnt - 1) * bbGap;
    var sx = (W - rowW) / 2 + col * (cw + bbGap) + cw / 2;
    var sy = (H - totalH) / 2 + row * (ch + bbGap) + ch / 2;
    var b = bbBubs[i];
    b.cx = sx; b.cy = sy;
    b.ampX = Math.max(2, (cw - D) / 2 * 0.82);
    b.ampY = Math.max(2, (ch - D) / 2 * 0.82);
    b.el.style.width = D + 'px';
    b.el.style.height = D + 'px';
    b.el.style.left = sx + 'px';
    b.el.style.top = sy + 'px';
    b.el.style.marginLeft = (-D / 2) + 'px';
    b.el.style.marginTop = (-D / 2) + 'px';
    var nm = b.el.querySelector('.bb-nm');
    var id = b.el.querySelector('.bb-id');
    if (nm) nm.style.fontSize = nmF + 'px';
    if (id) id.style.fontSize = idF + 'px';
  }
}

/* ---------- 漂浮 / 爆破动画 ---------- */
function bbLoop() {
  bbT++;
  bbBgDraw();
  var t = bbT;
  for (var i = 0; i < bbBubs.length; i++) {
    var b = bbBubs[i];
    if (b.gone) continue;
    var sc = 1, op = 1, rot = 0;
    if (b.burst) {
      b.bt += 0.048;
      if (b.bt >= 1) {
        b.gone = true;
        b.el.style.display = 'none';
        continue;
      }
      sc = 1 + b.bt * 1.6;
      op = Math.max(0, 1 - b.bt * 1.4);
    } else if (b.lock) {
      sc = 1.15 + Math.sin(t * 0.85) * 0.055;
      rot = Math.sin(t * 0.62 + b.ph) * 4;
    }
    var dx = 0, dy = 0;
    if (!b.burst) {
      dx = Math.sin(t * 0.011 * b.sp + b.ph) * b.ampX;
      dy = Math.cos(t * 0.0085 * b.sp + b.ph * 1.7) * b.ampY;
    }
    b.fl.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px) scale(' +
      sc.toFixed(3) + ') rotate(' + rot.toFixed(2) + 'deg)';
    b.fl.style.opacity = op.toFixed(3);
  }
  bbRaf = requestAnimationFrame(bbLoop);
}

function bbSyncPicked() {
  var noRep = TC.isNoRepeat();
  for (var i = 0; i < bbBubs.length; i++) {
    var b = bbBubs[i];
    if (b.gone || b.burst) continue;
    var gone = noRep && TC.remain.length > 0 && TC.remain.indexOf(b.s) === -1;
    b.el.classList.toggle('dim', gone);
  }
}

/* ---------- 准星 ---------- */
function bbAimAt(i) {
  var b = bbBubs[i];
  if (!b || !bbCross) return;
  bbCross.classList.add('on');
  bbCross.style.transform = 'translate(' + b.cx.toFixed(1) + 'px,' + b.cy.toFixed(1) + 'px) scale(' +
    (bbD / 72).toFixed(3) + ')';
}

function bbUnlock() {
  if (bbLockIdx >= 0 && bbBubs[bbLockIdx]) bbBubs[bbLockIdx].el.classList.remove('lock');
  bbLockIdx = -1;
}

/* ---------- 摇人 ---------- */
function bbRollTick() {
  var alive = [];
  for (var i = 0; i < bbBubs.length; i++) {
    if (!bbBubs[i].gone && !bbBubs[i].burst) alive.push(i);
  }
  if (!alive.length) return;
  if (bbLockIdx >= 0 && bbBubs[bbLockIdx]) bbBubs[bbLockIdx].el.classList.remove('lock');
  bbLockIdx = alive[Math.floor(Math.random() * alive.length)];
  bbBubs[bbLockIdx].el.classList.add('lock');
  bbAimAt(bbLockIdx);
  TC.Music.sfxRoll(Math.min(1, (Date.now() - bbT0) / 3200));
  if (Math.random() < 0.30) {
    var el = bbBubs[bbLockIdx].el;
    var r = el.getBoundingClientRect();
    TC.FX.sparks(r.left + r.width / 2, r.top + r.height / 2, 4, '#f9a8d4');
  }
}

/* ---------- 揭晓清单 ---------- */
function bbFitList(n, winners) {
  if (!bbList || !n) return;
  var W = bbList.clientWidth;
  if (!W) return;
  var gap = 8;
  var ideal = (W - gap * (n - 1)) / n;
  var r = TC.autoFitGrid(bbList, n, { gap: gap, ratio: 1.18, minW: 84, maxW: Math.max(90, ideal), pad: 1 });
  if (!r) return;
  var maxLen = 2;
  for (var i = 0; i < winners.length; i++) {
    if (winners[i].name.length > maxLen) maxLen = winners[i].name.length;
  }
  var unit = Math.min(r.cw, r.ch);
  var nmF = Math.min(unit * 0.40, (r.cw * 0.82) / Math.max(2, maxLen));
  nmF = Math.max(12, Math.min(72, Math.round(nmF)));
  var idF = Math.max(9, Math.round(nmF * 0.34));
  var items = bbList.children;
  for (var k = 0; k < items.length; k++) {
    var nm = items[k].querySelector('.bb-nm');
    var id = items[k].querySelector('.bb-id');
    if (nm) nm.style.fontSize = nmF + 'px';
    if (id) id.style.fontSize = idF + 'px';
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  bbBgResize();
  bbBuild();
  if (!bbRaf) bbLoop();
  window.addEventListener('resize', bbBgResize);
}

function stageLayout() {
  bbBgResize();
  bbLayout();
  if (bbList && bbReveal && bbReveal.classList.contains('active')) {
    var ws = bbList._winners || [];
    if (ws.length) bbFitList(ws.length, ws);
  }
}

function stageStartRoll() {
  if (bbReveal) bbReveal.classList.remove('active');
  bbUnlock();
  for (var i = 0; i < bbBubs.length; i++) {
    var b = bbBubs[i];
    if (b.gone) { b.gone = false; b.burst = false; b.bt = 0; b.el.style.display = ''; b.el.classList.remove('dim'); }
    b.el.classList.remove('lock');
  }
  bbT0 = Date.now();
  clearInterval(bbRollTimer);
  bbRollTimer = setInterval(bbRollTick, 70);
}

function stageStopRoll(winners) {
  clearInterval(bbRollTimer); bbRollTimer = null;
  if (bbCross) bbCross.classList.remove('on');
  bbUnlock();

  var idx = [];
  winners.forEach(function (w) {
    for (var i = 0; i < bbBubs.length; i++) {
      if (bbBubs[i].s.id === w.id && bbBubs[i].s.name === w.name) { idx.push(i); return; }
    }
  });

  idx.forEach(function (bi, k) {
    setTimeout(function () {
      var b = bbBubs[bi];
      if (!b) return;
      b.burst = true;
      b.bt = 0;
      b.el.classList.remove('lock', 'dim');
      if (b.halo) {
        b.halo.classList.remove('on');
        void b.halo.offsetWidth;
        b.halo.classList.add('on');
      }
      var r = b.el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      TC.FX.sparks(cx, cy, 40, '#f9a8d4');
      TC.FX.sparks(cx, cy, 18, '#ffffff');
      TC.FX.stars(cx, cy, 14, '#e9d5ff');
      TC.FX.ring(cx, cy, '#ec4899', 0, 2);
      TC.FX.emojiBurst(cx, cy, ['🫧', '✨', '💥', '💗', '⭐'], 12);
      var ac = TC.Music.init();
      if (ac) {
        TC.Music.whoosh(ac.currentTime, 0.22, 0.9);
        TC.Music.bell(TC.Music.midi(88 + k * 2), ac.currentTime, 1.0, 0.055);
      }
      bbSyncPicked();
    }, k * 160);
  });
}

function revealWinners(winners) {
  if (!bbReveal || !bbList || !winners || !winners.length) return;
  bbList.innerHTML = '';
  bbList._winners = winners;
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'bb-item';
    d.style.animationDelay = (i * 0.09) + 's';
    d.innerHTML = '<span class="bb-id id-tag"></span><b class="bb-nm"></b>';
    d.querySelector('.bb-id').textContent = w.id;
    d.querySelector('.bb-nm').textContent = w.name;
    bbList.appendChild(d);
  });
  bbReveal.classList.add('active');
  bbFitList(winners.length, winners);
}

function stageClearReveal() {
  if (bbReveal) bbReveal.classList.remove('active');
}

function onResetHook() {
  clearInterval(bbRollTimer); bbRollTimer = null;
  if (bbReveal) bbReveal.classList.remove('active');
  if (bbCross) bbCross.classList.remove('on');
  if (bbList) { bbList.innerHTML = ''; bbList._winners = []; }
  bbBuild();
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(236,72,153,.28), rgba(168,85,247,.20))';
  el.style.border = '1px solid rgba(236,72,153,.62)';
  el.style.color = '#fbcfe8';
}
