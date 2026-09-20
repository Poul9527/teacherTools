/* ── 霓虹极速点名 · 舞台脚本 ───────────────────────────────────────── */

var nxCv = TC.$('#nx-tunnel');
var nxCtx = nxCv ? nxCv.getContext('2d') : null;
var nxCore = TC.$('#nx-core');
var nxNm = TC.$('#nx-nm');
var nxSid = TC.$('#nx-sid');
var nxBar = TC.$('#nx-bar-fill');
var nxPool = TC.$('#nx-pool');
var nxPoolNum = TC.$('#nx-pool-num');
var nxReveal = TC.$('#nx-reveal');
var nxBox = TC.$('#nx-rv-box');

var nxChips = [], nxHot = -1;
var NX_MAX_CHIP = 62;
var nxTimer = null, nxSpeedTimer = null, nxLockTimer = null;
var nxLocking = false, nxOpenAfterLock = false, nxT0 = 0;

/* ---------- 背景：霓虹网格隧道 ---------- */
var nxRaf = null, nxT = 0, nxSpd = 1, nxTar = 1;
var nxW = 0, nxH = 0, nxDpr = 1;

function nxResize() {
  if (!nxCv || !nxCtx) return;
  var host = nxCv.parentElement;
  var w = host ? host.clientWidth : 0, h = host ? host.clientHeight : 0;
  if (w <= 0 || h <= 0) return;
  nxDpr = Math.min(window.devicePixelRatio || 1, 2);
  nxCv.width = Math.round(w * nxDpr);
  nxCv.height = Math.round(h * nxDpr);
  nxCtx.setTransform(nxDpr, 0, 0, nxDpr, 0, 0);
  nxW = w; nxH = h;
}

function nxAlpha(z, far) {
  var near = Math.min(1, Math.max(0, (z - 0.50) / 0.80));
  var back = Math.max(0, 1 - Math.pow(z / far, 1.5));
  return near * back;
}

function nxLoop() {
  nxRaf = requestAnimationFrame(nxLoop);
  if (!nxCtx || nxW <= 0 || nxH <= 0) return;

  nxSpd += (nxTar - nxSpd) * 0.055;
  nxT += nxSpd * 0.021;

  var w = nxW, h = nxH, ctx = nxCtx;
  var vx = w * 0.5, vy = h * 0.44;
  ctx.clearRect(0, 0, w, h);

  /* 隧道尽头的霓虹光晕 */
  var glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, Math.max(w, h) * 0.68);
  glow.addColorStop(0, 'rgba(56,189,248,.22)');
  glow.addColorStop(0.42, 'rgba(99,102,241,.11)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  /* 透视网格环 */
  var N = 15, K = 1.32, far = N + 1.5, phase = nxT % 1;
  var pts = [];
  for (var i = 0; i <= N; i++) {
    var z = i + 0.14 + phase;
    var s = K / z;
    pts.push({ x: vx - w * 0.5 * s, y: vy - h * 0.5 * s, w: w * s, h: h * s, z: z });
  }
  ctx.lineJoin = 'miter';
  for (var k = 0; k <= N; k++) {
    var p = pts[k];
    if (p.z < 0.44) continue;
    var a = nxAlpha(p.z, far);
    if (a <= 0.012) continue;
    var col = (k % 2 === 0) ? '56,189,248' : '129,140,248';
    ctx.lineWidth = Math.max(0.6, 2.6 / p.z);
    ctx.strokeStyle = 'rgba(' + col + ',' + (a * 0.85).toFixed(3) + ')';
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    var q = pts[k + 1];
    if (q && q.z > 0.44) {
      ctx.strokeStyle = 'rgba(' + col + ',' + (a * 0.42).toFixed(3) + ')';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.moveTo(p.x + p.w, p.y); ctx.lineTo(q.x + q.w, q.y);
      ctx.moveTo(p.x, p.y + p.h); ctx.lineTo(q.x, q.y + q.h);
      ctx.moveTo(p.x + p.w, p.y + p.h); ctx.lineTo(q.x + q.w, q.y + q.h);
      ctx.stroke();
    }
  }

  /* 掠过的光带 */
  for (var b = 0; b < 4; b++) {
    var pb = ((nxT * 0.34 + b * 0.26) % 1);
    var zb = 0.6 + pb * 8.6;
    var sb = K / zb;
    var yy = vy + h * 0.5 * sb * ((b % 2 === 0) ? 0.62 : -0.62);
    var ab = Math.sin(pb * Math.PI) * 0.55;
    if (ab <= 0.03) continue;
    var x0 = vx - w * 0.5 * sb * 0.95, x1 = vx + w * 0.5 * sb * 0.95;
    var lg = ctx.createLinearGradient(x0, 0, x1, 0);
    lg.addColorStop(0, 'rgba(56,189,248,0)');
    lg.addColorStop(0.5, 'rgba(186,230,253,' + ab.toFixed(3) + ')');
    lg.addColorStop(1, 'rgba(56,189,248,0)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = Math.max(1, 7 / zb);
    ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
  }
}

/* ---------- 名字显示器 ---------- */
function nxNameSize(txt) {
  var vh = window.innerHeight || 720;
  var w = (nxCv && nxCv.parentElement) ? nxCv.parentElement.clientWidth : 1200;
  var byH = Math.max(40, Math.min(vh * 0.13, 140));
  var len = (txt || '').length || 1;
  var byW = Math.min(w * 0.86, 1120) / (len * 1.08);
  return Math.round(Math.max(22, Math.min(byH, byW)));
}

function nxShow(s) {
  if (!nxNm || !s) return;
  nxNm.textContent = s.name;
  if (nxSid) nxSid.textContent = 'NO.' + s.id;
  nxNm.style.fontSize = nxNameSize(s.name) + 'px';
}

function nxPoolNow() {
  var arr = TC.students || [];
  if (TC.isNoRepeat() && TC.remain && TC.remain.length) return TC.remain;
  return arr;
}

/* ---------- 底部候场池 ---------- */
function nxBuildPool() {
  if (!nxPool) return;
  nxPool.innerHTML = '';
  nxChips = [];
  nxHot = -1;
  var list = TC.students || [];
  var cap = Math.min(list.length, NX_MAX_CHIP);
  for (var i = 0; i < cap; i++) {
    var el = document.createElement('div');
    el.className = 'nx-chip';
    el.textContent = list[i].name;
    el.title = list[i].id + ' ' + list[i].name;
    nxPool.appendChild(el);
    nxChips.push({ el: el, s: list[i] });
  }
  if (list.length > cap) {
    var more = document.createElement('div');
    more.className = 'nx-chip dim';
    more.textContent = '…' + (list.length - cap);
    nxPool.appendChild(more);
    nxChips.push({ el: more, s: null });
  }
  nxLayoutPool();
  nxSyncPool();
}

function nxLayoutPool() {
  if (!nxPool || !nxChips.length) return;
  /* ratio 取 0.80：让 autoFitGrid 优先选「少行」，两行即可完整容纳 62 人 */
  var r = TC.autoFitGrid(nxPool, nxChips.length, {
    gap: 3, ratio: 0.80, minW: 34, maxW: 130
  });
  if (!r) return;
  var fs = Math.max(8, Math.min(15, Math.round(r.cw / 3.1)));
  for (var i = 0; i < nxChips.length; i++) nxChips[i].el.style.fontSize = fs + 'px';
}

function nxSyncPool() {
  if (nxPoolNum) nxPoolNum.textContent = (TC.remain && TC.remain.length) || 0;
  var noRep = TC.isNoRepeat(), remain = TC.remain || [];
  for (var i = 0; i < nxChips.length; i++) {
    var c = nxChips[i];
    if (!c.s) continue;
    var gone = noRep && remain.length > 0 && remain.indexOf(c.s) === -1;
    c.el.classList.toggle('dim', gone && !c.el.classList.contains('won'));
  }
}

function nxFlashPool() {
  if (!nxChips.length) return;
  if (nxHot >= 0 && nxChips[nxHot]) nxChips[nxHot].el.classList.remove('hot');
  nxHot = Math.floor(Math.random() * nxChips.length);
  if (nxChips[nxHot]) nxChips[nxHot].el.classList.add('hot');
}

function nxClearHot() {
  if (nxHot >= 0 && nxChips[nxHot]) nxChips[nxHot].el.classList.remove('hot');
  nxHot = -1;
}

function nxMarkWinners(winners) {
  for (var i = 0; i < nxChips.length; i++) {
    if (!nxChips[i].s) continue;
    for (var j = 0; j < winners.length; j++) {
      if (nxChips[i].s.id === winners[j].id && nxChips[i].s.name === winners[j].name) {
        nxChips[i].el.classList.add('won');
        nxChips[i].el.classList.remove('dim');
      }
    }
  }
}

/* ---------- 摇人 ---------- */
function nxTick() {
  var arr = nxPoolNow();
  if (!arr.length) return;
  nxShow(TC.pick(arr));
  var el = Date.now() - nxT0;
  TC.Music.sfxRoll(Math.min(1, el / 2400));
  if (nxBar) nxBar.style.width = (((el % 1500) / 15).toFixed(1)) + '%';
  nxFlashPool();
}

function nxCancelLock() {
  if (nxLockTimer) { clearTimeout(nxLockTimer); nxLockTimer = null; }
  nxLocking = false;
  nxOpenAfterLock = false;
}

function nxLock(w) {
  nxLocking = false;
  if (nxCore) nxCore.classList.add('locked');
  if (nxBar) nxBar.style.width = '100%';
  if (w) {
    nxShow(w);
    if (nxCore) {
      var r = nxCore.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      TC.FX.sparks(cx, cy, 46, '#38bdf8');
      TC.FX.sparks(cx, cy, 28, '#c7d2fe');
      TC.FX.ring(cx, cy, '#38bdf8', 0, 3);
      TC.FX.ring(cx, cy, '#818cf8', 0, 2);
      TC.FX.flash('#38bdf8', 0.14);
      TC.FX.shake(1);
    }
  }
  if (nxOpenAfterLock) { nxOpenAfterLock = false; nxOpenReveal(); }
}

/* ---------- 揭晓 ---------- */
function nxOpenReveal() {
  if (!nxReveal) return;
  nxReveal.classList.add('active');
  nxLayoutReveal();
}

function nxLayoutReveal() {
  if (!nxBox) return;
  var cards = nxBox.children;
  if (!cards.length) return;
  var r = TC.autoFitGrid(nxBox, cards.length, {
    gap: 12, ratio: 0.60, minW: 150, maxW: 460, maxH: 300
  });
  if (!r) return;
  for (var i = 0; i < cards.length; i++) {
    var nm = cards[i].querySelector('.nc-nm');
    var id = cards[i].querySelector('.nc-id');
    if (!nm) continue;
    var len = (nm.textContent || '').length || 1;
    var fs = Math.max(15, Math.min(r.cw * 0.40, (r.cw * 0.90) / len));
    nm.style.fontSize = fs + 'px';
    if (id) id.style.fontSize = Math.max(9, Math.round(fs * 0.28)) + 'px';
  }
}

function nxRest() {
  if (nxNm) {
    nxNm.textContent = '准备就绪';
    nxNm.style.fontSize = nxNameSize('准备就绪') + 'px';
  }
  if (nxSid) nxSid.textContent = 'NO.--';
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  nxResize();
  nxBuildPool();
  nxRest();
  if (!nxRaf) nxRaf = requestAnimationFrame(nxLoop);
  window.addEventListener('resize', nxResize);
}

function stageLayout() {
  nxResize();
  nxLayoutPool();
  if (nxReveal && nxReveal.classList.contains('active')) nxLayoutReveal();
}

function stageStartRoll() {
  nxCancelLock();
  nxClearHot();
  if (nxReveal) nxReveal.classList.remove('active');
  if (nxCore) nxCore.classList.remove('locked');
  nxTar = 3.4;
  nxT0 = Date.now();
  nxSyncPool();
  if (nxBar) nxBar.style.width = '0%';
  if (!nxTimer) nxTimer = setInterval(nxTick, 45);
  if (!nxSpeedTimer) {
    nxSpeedTimer = setInterval(function () {
      if (TC.rolling) TC.FX.speedLines(320, 'rgba(125,211,252,.75)');
    }, 950);
  }
}

function stageStopRoll(winners) {
  if (nxTimer) { clearInterval(nxTimer); nxTimer = null; }
  if (nxSpeedTimer) { clearInterval(nxSpeedTimer); nxSpeedTimer = null; }
  if (nxLockTimer) { clearTimeout(nxLockTimer); nxLockTimer = null; }
  nxTar = 1.0;
  nxMarkWinners(winners);
  nxSyncPool();

  var target = (winners && winners[0]) ? winners[0] : null;
  nxLocking = true;
  var seq = [45, 58, 74, 92, 112, 140, 175, 220];
  var k = 0;

  function step() {
    nxLockTimer = null;
    if (k >= seq.length) { nxLock(target); return; }
    var near = target && k >= seq.length - 2;
    if (near) nxShow(target);
    else {
      var arr = nxPoolNow();
      if (arr.length) nxShow(TC.pick(arr));
    }
    TC.Music.sfxRoll(0.55 + (k / seq.length) * 0.45);
    if (k === seq.length - 1) TC.Music.sfxFlip();
    if (k === 0) nxClearHot();
    var gap = seq[k];
    k++;
    nxLockTimer = setTimeout(step, gap);
  }
  step();
}

function revealWinners(winners) {
  if (!nxBox || !nxReveal) return;
  nxBox.innerHTML = '';
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'nx-card';
    d.style.animationDelay = (i * 0.08) + 's';
    d.innerHTML = '<div class="nc-id id-tag"></div><div class="nc-nm"></div>';
    d.querySelector('.nc-id').textContent = 'NO.' + w.id;
    d.querySelector('.nc-nm').textContent = w.name;
    nxBox.appendChild(d);
  });
  if (nxLocking) nxOpenAfterLock = true;
  else nxOpenReveal();
}

function stageClearReveal() {
  if (nxReveal) nxReveal.classList.remove('active');
  nxOpenAfterLock = false;
}

function onResetHook() {
  if (nxReveal) nxReveal.classList.remove('active');
  nxCancelLock();
  if (nxTimer) { clearInterval(nxTimer); nxTimer = null; }
  if (nxSpeedTimer) { clearInterval(nxSpeedTimer); nxSpeedTimer = null; }
  nxTar = 1.0;
  nxClearHot();
  if (nxCore) nxCore.classList.remove('locked');
  if (nxBar) nxBar.style.width = '0%';
  nxRest();
  nxBuildPool();
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(56,189,248,.22), rgba(99,102,241,.22))';
  el.style.border = '1px solid rgba(56,189,248,.60)';
  el.style.color = '#e0f2fe';
  el.style.boxShadow = '0 0 14px rgba(56,189,248,.45)';
}
