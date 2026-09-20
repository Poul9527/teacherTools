/* ── 幸运大转盘 · 舞台脚本 ─────────────────────────────────────────── */

var wheelStage = TC.$('#wheel-stage');
var wheelBox = TC.$('#wheel-box');
var wheelCv = TC.$('#wheel-cv');
var wctx = wheelCv ? wheelCv.getContext('2d') : null;
var wheelHub = TC.$('#wheel-hub');
var wheelRead = TC.$('#wheel-readout');
var wlReveal = TC.$('#wl-reveal');
var wlNames = TC.$('#wl-names');

var wN = 0, wSec = Math.PI * 2, viewS = 0, secColor = [], secName = [];
var wheelRaf = null, bulbStep = 0, lastIdx = -1, readIdx = -2;
var wRollTimer = null, wRollT0 = 0, wRevealTimer = null, wSettleAt = 0;
var WHEEL_MAXSP = 0.42;
var spin = { mode: 'idle', angle: 0, speed: 0, from: 0, to: 0, t0: 0, dur: 0 };

/* ---------- 转盘几何 ---------- */
function wheelFit() {
  if (!wheelStage || !wheelBox) return;
  var w = wheelStage.clientWidth, h = wheelStage.clientHeight;
  if (!w || !h) return;
  /* 舞台是唯一可靠的尺寸来源：按实测舞台宽高算，绝不写死 px */
  var s = Math.max(150, Math.min(h * 0.855, w * 0.62));
  wheelBox.style.width = s + 'px';
  wheelBox.style.height = s + 'px';
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  wheelCv.width = Math.round(s * dpr);
  wheelCv.height = Math.round(s * dpr);
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  viewS = s;
}

function buildWheel() {
  secName = TC.students.map(function (s) { return s.name; });
  wN = secName.length;
  wSec = wN ? (Math.PI * 2 / wN) : (Math.PI * 2);
  secColor = [];
  for (var i = 0; i < wN; i++) secColor.push(i % 2 ? '#ef4444' : '#f59e0b');
  spin.mode = 'idle'; spin.angle = 0; spin.speed = 0; spin.from = 0; spin.to = 0;
  lastIdx = -1; readIdx = -2;
  if (wheelHub) wheelHub.textContent = '点名';
  setReadout(wN ? '准备转动' : '没有名单');
}

/* 指针当前咬住的扇区序号 */
function sectorUnderPointer() {
  if (!wN) return -1;
  var L = (-Math.PI / 2 - spin.angle) % (Math.PI * 2);
  if (L < 0) L += Math.PI * 2;
  var i = Math.floor(L / wSec) % wN;
  return i < 0 ? i + wN : i;
}

function setReadout(txt) {
  if (wheelRead) wheelRead.textContent = txt;
}

/* ---------- 绘制 ---------- */
function drawWheel() {
  if (!wctx || !viewS) return;
  var W = viewS;
  var cx = W / 2, cy = W / 2;
  var R = W / 2 * 0.845;
  var secR = R * 0.925;
  var bulbR = R * 1.105;
  var bulbDot = Math.max(2.2, R * 0.031);
  var rolling = (spin.mode === 'rolling' || spin.mode === 'stopping');

  wctx.clearRect(0, 0, W, W);

  /* 外圈暖色光晕 */
  var halo = wctx.createRadialGradient(cx, cy, secR * 0.6, cx, cy, R * 1.22);
  halo.addColorStop(0, 'rgba(245,158,11,.28)');
  halo.addColorStop(0.7, 'rgba(239,68,68,.14)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  wctx.fillStyle = halo;
  wctx.fillRect(0, 0, W, W);

  /* 跑马灯灯泡（不随转盘旋转） */
  var NB = 28, k = Math.floor(bulbStep);
  for (var b = 0; b < NB; b++) {
    var ba = b / NB * Math.PI * 2 - Math.PI / 2;
    var bx = cx + Math.cos(ba) * bulbR;
    var by = cy + Math.sin(ba) * bulbR;
    var on = ((b + k) % 2) === 0;
    var a = rolling ? (on ? 1 : 0.16) : (on ? 0.78 : 0.34);
    var bg = wctx.createRadialGradient(bx - bulbDot * 0.3, by - bulbDot * 0.3, 0, bx, by, bulbDot);
    bg.addColorStop(0, 'rgba(255,255,255,' + (a * 0.98).toFixed(2) + ')');
    bg.addColorStop(0.55, 'rgba(253,224,71,' + (a * 0.92).toFixed(2) + ')');
    bg.addColorStop(1, 'rgba(180,83,9,' + (a * 0.35).toFixed(2) + ')');
    wctx.beginPath(); wctx.arc(bx, by, bulbDot, 0, 6.284);
    wctx.fillStyle = bg;
    wctx.shadowBlur = a * 16; wctx.shadowColor = 'rgba(253,224,71,' + a.toFixed(2) + ')';
    wctx.fill();
    wctx.shadowBlur = 0;
  }

  wctx.save();
  wctx.translate(cx, cy);

  /* 金色轮辋 */
  wctx.beginPath(); wctx.arc(0, 0, R, 0, 6.284);
  wctx.fillStyle = '#7c2d12'; wctx.fill();
  wctx.beginPath(); wctx.arc(0, 0, R * 0.975, 0, 6.284);
  wctx.fillStyle = '#fbbf24'; wctx.fill();
  wctx.beginPath(); wctx.arc(0, 0, R * 0.945, 0, 6.284);
  wctx.fillStyle = '#b45309'; wctx.fill();

  /* 扇形 */
  wctx.save();
  wctx.rotate(spin.angle);
  if (wN) {
    for (var i = 0; i < wN; i++) {
      var a0 = i * wSec, a1 = a0 + wSec;
      wctx.beginPath();
      wctx.moveTo(0, 0);
      wctx.arc(0, 0, secR, a0, a1);
      wctx.closePath();
      wctx.fillStyle = secColor[i];
      wctx.fill();
      if (wN <= 26) {
        wctx.strokeStyle = 'rgba(255,255,255,.30)';
        wctx.lineWidth = Math.max(0.6, secR * 0.005);
        wctx.beginPath();
        wctx.moveTo(0, 0);
        wctx.lineTo(Math.cos(a0) * secR, Math.sin(a0) * secR);
        wctx.stroke();
      }
    }
  } else {
    wctx.beginPath(); wctx.arc(0, 0, secR, 0, 6.284);
    wctx.fillStyle = '#78350f'; wctx.fill();
  }
  wctx.restore();

  /* 中央暗角 + 边沿高光，做出凹面立体感 */
  var sh = wctx.createRadialGradient(0, 0, 0, 0, 0, secR);
  sh.addColorStop(0, 'rgba(20,6,0,.62)');
  sh.addColorStop(0.42, 'rgba(20,6,0,.10)');
  sh.addColorStop(0.82, 'rgba(255,255,255,.05)');
  sh.addColorStop(1, 'rgba(255,255,255,.22)');
  wctx.beginPath(); wctx.arc(0, 0, secR, 0, 6.284);
  wctx.fillStyle = sh; wctx.fill();

  /* 扇区文字：学生数 <= 20 才写，保证不糊成一片 */
  if (wN && wN <= 20) {
    wctx.save();
    wctx.rotate(spin.angle);
    wctx.textBaseline = 'middle';
    for (var j = 0; j < wN; j++) {
      var txt = secName[j];
      if (!txt) continue;
      if (txt.length > 6) txt = txt.slice(0, 6);
      var fs = Math.min(22, secR * wSec * 0.55,
        (secR * 0.58) / Math.max(2, txt.length));
      fs = Math.max(9, fs);
      wctx.save();
      wctx.rotate((j + 0.5) * wSec);
      var m = ((j + 0.5) * wSec) % 6.284;
      if (m < 0) m += 6.284;
      wctx.font = '900 ' + fs.toFixed(1) + 'px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
      wctx.fillStyle = '#2a1004';
      wctx.shadowBlur = 4; wctx.shadowColor = 'rgba(255,255,255,.45)';
      if (m > 1.5708 && m < 4.7124) {
        wctx.rotate(Math.PI);
        wctx.textAlign = 'left';
        wctx.fillText(txt, -secR * 0.90, 0);
      } else {
        wctx.textAlign = 'right';
        wctx.fillText(txt, secR * 0.90, 0);
      }
      wctx.restore();
    }
    wctx.restore();
  }

  wctx.restore();
}

function wheelLoop() {
  var now = Date.now();
  if (spin.mode === 'rolling') {
    spin.speed += (WHEEL_MAXSP - spin.speed) * 0.022;
    spin.angle += spin.speed;
  } else if (spin.mode === 'stopping') {
    var t = Math.min(1, (now - spin.t0) / spin.dur);
    spin.angle = spin.from + (spin.to - spin.from) * (1 - Math.pow(1 - t, 4));
    if (t >= 1) {
      spin.mode = 'idle';
      spin.angle = spin.to % (Math.PI * 2);
      spin.speed = 0;
      onWheelLocked();
    }
  }
  bulbStep += (spin.mode === 'idle' ? 0.045 : 0.17);

  /* 指针读数：只在扇区变化时写 DOM，避免每帧抖动 */
  if (spin.mode !== 'idle' && wN) {
    var id = sectorUnderPointer();
    if (id !== readIdx) {
      readIdx = id;
      setReadout(secName[id] || '');
    }
  }
  drawWheel();
  wheelRaf = requestAnimationFrame(wheelLoop);
}

/* 指针咬死扇区的一刻：局部火花 + 冲击环（全屏礼花由内核统一负责） */
function onWheelLocked() {
  if (wheelHub) wheelHub.textContent = 'GO';
  var r = wheelCv.getBoundingClientRect();
  var px = r.left + r.width / 2;
  var py = r.top + r.height * 0.03;
  TC.FX.sparks(px, py, 30, '#fde047');        /* 指针处迸火花 */
  TC.FX.ring(px, py, '#f59e0b', 0, 3);
  /* 彩带从转盘中心炸开：FX 的粒子是「向上抛 + 重力」，贴顶发射会飞出屏幕 */
  TC.FX.emojiBurst(r.left + r.width / 2, r.top + r.height * 0.5,
    ['🎉', '🎊', '✨', '🪙'], 12);
  var i = sectorUnderPointer();
  readIdx = i;
  setReadout(secName[i] || '');
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  wheelFit();
  buildWheel();
  if (!wheelRaf) wheelLoop();
  window.addEventListener('resize', wheelFit);
}

function stageLayout() {
  wheelFit();
  drawWheel();
}

function stageStartRoll() {
  if (wRevealTimer) { clearTimeout(wRevealTimer); wRevealTimer = null; }
  if (wlReveal) wlReveal.classList.remove('active');
  if (wheelHub) wheelHub.textContent = '转';
  spin.from = spin.angle;
  spin.speed = 0.09;
  spin.mode = 'rolling';
  readIdx = -2;
  if (wRollTimer) clearInterval(wRollTimer);
  wRollT0 = Date.now();
  var tick = 0;
  wRollTimer = setInterval(function () {
    var pr = Math.min(1, (Date.now() - wRollT0) / 2600);
    TC.Music.sfxRoll(pr);                       /* 摇人脉冲，每拍必响 */
    if (tick % 3 === 0 && !TC.Music.isMuted()) {
      var c = TC.Music.init();
      if (c) {
        /* 指针拨动声：短促方波，随速度升调 */
        TC.Music.tone(TC.Music.midi(76 + (tick % 7)), c.currentTime, 0.035, 0.030,
          'square', null, { cut: 6200 });
      }
    }
    tick++;
  }, 56);
}

function stageStopRoll(winners) {
  if (wRollTimer) { clearInterval(wRollTimer); wRollTimer = null; }
  if (!winners || !winners.length || !wN) return;

  /* 只对准第 1 位中选者，其余交给揭晓浮层 */
  var wi = 0;
  for (var i = 0; i < wN; i++) {
    if (TC.students[i].id === winners[0].id && TC.students[i].name === winners[0].name) { wi = i; break; }
  }
  /* 求角度：让第 wi 扇区中心正对顶部指针（-PI/2），并至少再转两圈 */
  var aim = -Math.PI / 2 - (wi + 0.5) * wSec;
  var turns = Math.ceil((spin.angle + Math.PI * 4 - aim) / (Math.PI * 2));
  spin.from = spin.angle;
  spin.to = aim + turns * Math.PI * 2;
  spin.t0 = Date.now();
  spin.dur = 1700;
  spin.mode = 'stopping';
  wSettleAt = spin.t0 + spin.dur + 90;

  /* 减速摩擦火花，沿轮辋洒一圈 */
  var r = wheelCv.getBoundingClientRect();
  for (var k = 0; k < 3; k++) {
    (function (kk) {
      setTimeout(function () {
        var an = -Math.PI / 2 + (kk - 1) * 0.9;
        TC.FX.sparks(r.left + r.width / 2 + Math.cos(an) * r.width * 0.42,
          r.top + r.height / 2 + Math.sin(an) * r.height * 0.42, 8, '#fbbf24');
      }, 240 + kk * 380);
    })(k);
  }
}

function revealWinners(winners) {
  if (wRevealTimer) clearTimeout(wRevealTimer);
  /* 等转盘停稳再弹浮层，让「指针咬住扇区」这一下有完整的呼吸 */
  var wait = Math.max(0, wSettleAt - Date.now());
  wRevealTimer = setTimeout(function () { showWheelReveal(winners); }, wait);
}

function showWheelReveal(winners) {
  if (!wlReveal) return;
  if (wlNames) wlNames.innerHTML = '';
  wlReveal.classList.add('active');            /* 先显示，autoFitGrid 才量得到尺寸 */

  for (var i = 0; i < winners.length; i++) {
    var d = document.createElement('div');
    d.className = 'wl-one';
    d.style.animationDelay = (i * 0.1) + 's';
    d.innerHTML = '<div class="wid id-tag"></div><div class="wnm"></div>';
    d.querySelector('.wid').textContent = 'No.' + winners[i].id;
    d.querySelector('.wnm').textContent = winners[i].name;
    wlNames.appendChild(d);
  }
  /* 1~6 个中奖卡片也必须完整落在浮层里，不滚动、不裁切 */
  var r = TC.autoFitGrid(wlNames, winners.length, {
    gap: 12, ratio: 0.62, minW: 130, maxW: 460, pad: 6
  });
  if (r) {
    var fs = Math.max(20, Math.min(Math.round(r.cw * 0.30), 88));
    var kids = wlNames.children;
    for (var j = 0; j < kids.length; j++) {
      kids[j].querySelector('.wnm').style.fontSize = fs + 'px';
      kids[j].querySelector('.wid').style.fontSize = Math.max(10, Math.round(fs * 0.24)) + 'px';
    }
  }
}

function stageClearReveal() {
  if (wRevealTimer) { clearTimeout(wRevealTimer); wRevealTimer = null; }
  if (wlReveal) wlReveal.classList.remove('active');
}

function onResetHook() {
  if (wRollTimer) { clearInterval(wRollTimer); wRollTimer = null; }
  if (wRevealTimer) { clearTimeout(wRevealTimer); wRevealTimer = null; }
  if (wlReveal) wlReveal.classList.remove('active');
  buildWheel();
  drawWheel();
}

function themedPillStyle(el) {
  el.style.background = 'rgba(245,158,11,.18)';
  el.style.border = '1px solid rgba(239,68,68,.62)';
  el.style.color = '#fde68a';
}
