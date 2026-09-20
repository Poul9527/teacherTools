/* ── 赛车竞速冲刺点名 · 舞台脚本 ───────────────────────────────────── */

var rcTrack = TC.$('#rc-track');
var rcFinish = TC.$('#rc-finish');
var rcFlag = TC.$('#rc-flag');
var rcReveal = TC.$('#rc-reveal');
var rcBox = TC.$('#rc-rv-box');

var rcLanes = [];
var rcRaf = null, rcSpinTimer = null, rcSpeedTimer = null;
var rcTimers = [], rcSafety = null;
var rcPending = false, rcCrossed = 0, rcT0 = 0;

var RC_MEDALS = ['🥇', '🥈', '🥉', '4', '5', '6'];
var RC_STEPS = [46, 34, 26, 22, 20, 18];

/* ---------- 工具 ---------- */
function rcNameFs(len) {
  var vh = window.innerHeight || 720, vw = window.innerWidth || 1280;
  var base = Math.max(14, Math.min(vh * 0.038, vw * 0.030, 40));
  if (len > 3) base = base * 3 / len;
  return Math.round(Math.max(11, base));
}

function rcSetName(L, s) {
  if (!L || !s) return;
  if (L.bnm) {
    L.bnm.textContent = s.name;
    L.bnm.style.fontSize = rcNameFs((s.name || '').length) + 'px';
  }
  if (L.bid) L.bid.textContent = 'NO.' + s.id;
}

function rcPool() {
  var arr = TC.students || [];
  if (TC.isNoRepeat() && TC.remain && TC.remain.length) return TC.remain;
  return arr;
}

function rcClearTimers() {
  for (var i = 0; i < rcTimers.length; i++) clearTimeout(rcTimers[i]);
  rcTimers = [];
  if (rcSafety) { clearTimeout(rcSafety); rcSafety = null; }
}

/* ---------- 建车道状态 ---------- */
function rcInit() {
  var els = TC.$$('.rc-lane');
  rcLanes = [];
  for (var i = 0; i < els.length; i++) {
    var el = els[i];
    var L = {
      el: el,
      runner: el.querySelector('.rc-runner'),
      bid: el.querySelector('.rc-bid'),
      bnm: el.querySelector('.rc-bnm'),
      mode: 'idle', spin: false,
      x: 0, shown: -99999, ph: Math.random() * 6.2832,
      maxX: 0, base: 0, amp: 0,
      from: 0, to: 0, t0: 0, dur: 780
    };
    rcLanes.push(L);
    var arr = TC.students || [];
    if (arr.length) rcSetName(L, arr[Math.floor(Math.random() * arr.length)]);
  }
  rcLayout();
  rcPaint(true);
}

/* ---------- 排布：所有尺寸来自赛道实测宽度，绝不写死 ---------- */
function rcLayout() {
  if (!rcTrack || !rcLanes.length) return;
  var tw = rcTrack.clientWidth;
  for (var i = 0; i < rcLanes.length; i++) {
    var L = rcLanes[i];
    var rw = L.runner ? L.runner.offsetWidth : 0;
    if (!rw) rw = tw * 0.30;
    L.maxX = Math.max(0, tw - rw - tw * 0.055);
    L.base = L.maxX * 0.40;
    L.amp = Math.max(6, L.maxX * 0.12);
    if (L.mode === 'idle' || L.mode === 'roll') L.x = L.base;
    else if (L.mode === 'done') L.x = L.maxX;
    else if (L.mode === 'surge') L.to = L.maxX;
  }
  rcPaint(true);
}

function rcPaint(force) {
  for (var i = 0; i < rcLanes.length; i++) {
    var L = rcLanes[i];
    if (!L.runner) continue;
    if (!force && Math.abs(L.x - L.shown) < 0.4) continue;
    L.shown = L.x;
    L.runner.style.transform = 'translateX(' + L.x.toFixed(1) + 'px) translateY(-50%)';
  }
}

/* ---------- 竞速循环 ---------- */
function rcLoop() {
  rcRaf = requestAnimationFrame(rcLoop);
  var now = Date.now();
  for (var i = 0; i < rcLanes.length; i++) {
    var L = rcLanes[i];
    if (L.mode === 'roll') {
      L.ph += 0.052 + i * 0.011;
      L.x = L.base + Math.sin(L.ph) * L.amp;
    } else if (L.mode === 'surge') {
      var t = Math.min(1, (now - L.t0) / L.dur);
      var e = 1 - Math.pow(1 - t, 3);
      L.x = L.from + (L.to - L.from) * e;
      if (t >= 1) { L.mode = 'done'; L.x = L.to; rcCross(i); }
    }
  }
  rcPaint(false);
}

/* ---------- 名字高速切换 ---------- */
function rcSpinTick() {
  var arr = rcPool();
  if (!arr.length) return;
  var any = false;
  for (var i = 0; i < rcLanes.length; i++) {
    var L = rcLanes[i];
    if (!L.spin) continue;
    any = true;
    if (Math.random() < 0.84) rcSetName(L, TC.pick(arr));
  }
  if (any) TC.Music.sfxRoll(Math.min(1, (Date.now() - rcT0) / 2400));
}

/* ---------- 冲线 ---------- */
function rcCross(i) {
  var L = rcLanes[i];
  if (L) { L.spin = false; if (L.runner) L.runner.classList.remove('on'); }
  var first = (i === 0);
  if (rcFinish && TC.FX) {
    var r = rcFinish.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    TC.FX.sparks(cx, cy, first ? 54 : 26, first ? '#fde047' : '#fdba74');
    TC.FX.ring(cx, cy, first ? '#fbbf24' : '#f97316', 0, first ? 3 : 2);
    if (first) {
      TC.FX.speedLines(480, 'rgba(253,186,116,.85)');
      TC.FX.confetti(cx, cy, 80, ['#f97316', '#ef4444', '#fde047', '#ffffff']);
      TC.FX.flash('#f97316', 0.20);
      TC.FX.shake(1);
      rcFinish.classList.add('hit');
      setTimeout(function () { if (rcFinish) rcFinish.classList.remove('hit'); }, 480);
    }
  }
  rcCrossed++;
  if (rcPending && rcCrossed >= rcLanes.length) rcOpenReveal();
}

/* ---------- 揭晓：领奖台 ---------- */
function rcOpenReveal() {
  if (!rcReveal) return;
  rcPending = false;
  if (rcSafety) { clearTimeout(rcSafety); rcSafety = null; }
  rcReveal.classList.add('active');
  rcLayoutReveal();
}

function rcLayoutReveal() {
  if (!rcBox) return;
  var cards = rcBox.children;
  if (!cards.length) return;
  var r = TC.autoFitGrid(rcBox, cards.length, {
    gap: 12, ratio: 0.78, minW: 140, maxW: 420, maxH: 340
  });
  if (!r) return;
  /* 名字统一按「最高一级台阶」留白回算：冠军名字不会因为台阶最高反而最小 */
  var topStep = Math.min(46, RC_STEPS[0]);
  var room = r.ch * (1 - topStep / 100) - 62;
  var uniFs = Math.max(13, Math.min(r.cw * 0.40, room / 1.15));
  for (var i = 0; i < cards.length; i++) {
    var step = cards[i].querySelector('.rc-step');
    if (step) step.style.height = Math.min(46, RC_STEPS[i] || 18) + '%';
    var nm = cards[i].querySelector('.rc-nm');
    if (!nm) continue;
    var len = (nm.textContent || '').length || 1;
    nm.style.fontSize = Math.round(Math.max(13, Math.min(uniFs, (r.cw * 0.90) / len))) + 'px';
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  rcInit();
  if (!rcRaf) rcRaf = requestAnimationFrame(rcLoop);
}

function stageLayout() {
  rcLayout();
  if (rcReveal && rcReveal.classList.contains('active')) rcLayoutReveal();
}

function stageStartRoll() {
  rcClearTimers();
  if (rcReveal) rcReveal.classList.remove('active');
  if (rcFlag) rcFlag.classList.remove('on');
  rcPending = false;
  rcCrossed = 0;
  rcT0 = Date.now();
  for (var i = 0; i < rcLanes.length; i++) {
    var L = rcLanes[i];
    L.mode = 'roll';
    L.spin = true;
    L.ph = Math.random() * 6.2832;
    if (L.runner) L.runner.classList.add('on');
  }
  if (!rcSpinTimer) rcSpinTimer = setInterval(rcSpinTick, 50);
  if (!rcSpeedTimer) {
    rcSpeedTimer = setInterval(function () {
      if (TC.rolling) TC.FX.speedLines(300, 'rgba(253,186,116,.80)');
    }, 1000);
  }
}

function stageStopRoll(winners) {
  if (rcSpinTimer) { clearInterval(rcSpinTimer); rcSpinTimer = null; }
  if (rcSpeedTimer) { clearInterval(rcSpeedTimer); rcSpeedTimer = null; }
  rcClearTimers();
  rcPending = true;
  rcCrossed = 0;
  if (rcFlag) rcFlag.classList.add('on');

  /* 三辆车依次减速冲线 */
  for (var i = 0; i < rcLanes.length; i++) rcSurge(i, i * 150);
  /* 第 1 车道锁定第 1 位中选者；其余中选者依次在各车道亮牌 */
  for (var k = 0; k < rcLanes.length; k++) {
    if (winners[k]) rcLockName(k, winners[k], 240 + k * 260);
  }

  rcSafety = setTimeout(rcOpenReveal, 2400);
}

function rcSurge(i, delay) {
  var L = rcLanes[i];
  if (!L) return;
  rcTimers.push(setTimeout(function () {
    L.mode = 'surge';
    L.t0 = Date.now();
    L.from = L.x;
    L.to = L.maxX;
    L.dur = 760 + i * 40;
    TC.Music.sfxFlip();
  }, delay));
}

function rcLockName(i, w, delay) {
  var L = rcLanes[i];
  if (!L || !w) return;
  rcTimers.push(setTimeout(function () {
    rcSetName(L, w);
    L.spin = false;
    TC.Music.sfxFlip();
  }, delay));
}

function revealWinners(winners) {
  if (!rcBox || !rcReveal) return;
  rcBox.innerHTML = '';
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'rc-card';
    d.style.animationDelay = (i * 0.09) + 's';
    d.innerHTML =
      '<div class="rc-medal"></div><div class="rc-nm"></div>' +
      '<div class="rc-id id-tag"></div><div class="rc-step"></div>';
    d.querySelector('.rc-medal').textContent = RC_MEDALS[i] || (i + 1);
    d.querySelector('.rc-nm').textContent = w.name;
    d.querySelector('.rc-id').textContent = 'NO.' + w.id;
    d.querySelector('.rc-step').textContent = i + 1;
    rcBox.appendChild(d);
  });
  if (!rcPending) rcOpenReveal();
}

function stageClearReveal() {
  if (rcReveal) rcReveal.classList.remove('active');
  rcPending = false;
  for (var i = 0; i < rcLanes.length; i++) rcLanes[i].spin = false;
}

function onResetHook() {
  rcClearTimers();
  if (rcReveal) rcReveal.classList.remove('active');
  if (rcSpinTimer) { clearInterval(rcSpinTimer); rcSpinTimer = null; }
  if (rcSpeedTimer) { clearInterval(rcSpeedTimer); rcSpeedTimer = null; }
  if (rcFlag) rcFlag.classList.remove('on');
  rcPending = false;
  rcCrossed = 0;
  for (var i = 0; i < rcLanes.length; i++) {
    var L = rcLanes[i];
    L.mode = 'idle';
    L.spin = false;
    L.x = L.base;
    L.shown = -99999;
    if (L.runner) L.runner.classList.remove('on');
    var arr = TC.students || [];
    if (arr.length) rcSetName(L, arr[Math.floor(Math.random() * arr.length)]);
  }
  rcLayout();
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(249,115,22,.26), rgba(239,68,68,.26))';
  el.style.border = '1px solid rgba(249,115,22,.62)';
  el.style.color = '#ffe4c7';
  el.style.boxShadow = '0 0 14px rgba(249,115,22,.45)';
}
