/* ── 老虎机摇号 · 舞台脚本 ─────────────────────────────────────────── */

var slStage = TC.$('#sl-stage');
var cabWrap = TC.$('#cab-wrap');
var cab = TC.$('#cab');
var bulbsBox = TC.$('#bulbs');
var reelsBox = TC.$('#reels');
var leverEl = TC.$('#lever');
var cabMsg = TC.$('#cab-msg');
var slReveal = TC.$('#sl-reveal');
var slNames = TC.$('#sl-names');

var SL_VISIBLE = 3;                 /* 每个滚轮同时露出 3 个名字 */
var SL_REELS = 3;
var slReels = [], slItems = [], slIh = 60, slLoopH = 600;
var slRaf = null, slRollTimer = null, slRollT0 = 0;
var slRevealTimer = null, slSettleAt = 0, slLockTimers = [];

/* ---------- 摆位：尺寸全部由实测舞台算出来 ---------- */
function slotFit() {
  if (!slStage || !cabWrap) return;
  var w = slStage.clientWidth, h = slStage.clientHeight;
  if (!w || !h) return;
  var AR = 1.34;                       /* 机柜 宽/高 */
  var W = Math.min(w * 0.96, h * AR * 0.94);
  var H = W / AR;
  if (H > h * 0.94) { H = h * 0.94; W = H * AR; }
  cabWrap.style.width = Math.round(W) + 'px';
  cabWrap.style.height = Math.round(H) + 'px';
  measureReels();
}
function measureReels() {
  if (!slReels.length) return;
  var h = slReels[0].el.clientHeight;
  if (!h) return;
  slIh = Math.max(14, h / SL_VISIBLE);
  slLoopH = slIh * slItems.length;
  reelsBox.style.setProperty('--ih', slIh.toFixed(1) + 'px');
  for (var i = 0; i < slReels.length; i++) applyReel(slReels[i]);
}

function applyReel(r) {
  if (!slLoopH) return;
  var y = r.y % slLoopH;
  if (y < 0) y += slLoopH;
  r.strip.style.transform = 'translateY(' + (-y).toFixed(1) + 'px)';
}

/* ---------- 建滚轮 ---------- */
function buildReels() {
  if (!reelsBox) return;
  var src = TC.remain.length ? TC.remain : TC.students;
  var base = [];
  for (var q = 0; q < src.length; q++) base.push({ id: src[q].id, name: src[q].name });
  if (!base.length) base.push({ id: '--', name: '虚位以待' });
  var guard = 0;
  while (base.length < 8 && guard < 8) { base = base.concat(base.slice(0)); guard++; }
  slItems = base;

  reelsBox.innerHTML = '';
  slReels = [];
  for (var r = 0; r < SL_REELS; r++) {
    var el = document.createElement('div');
    el.className = 'reel';
    var strip = document.createElement('div');
    strip.className = 'reel-strip';
    /* 铺两遍，滚动时首尾无缝衔接 */
    for (var c = 0; c < 2; c++) {
      for (var i = 0; i < slItems.length; i++) {
        var it = document.createElement('div');
        it.className = 'reel-item';
        it.textContent = slItems[i].name;
        strip.appendChild(it);
      }
    }
    el.appendChild(strip);
    reelsBox.appendChild(el);
    var rr = {
      el: el, strip: strip, y: Math.random() * 400,
      speed: 0, mode: 'idle', from: 0, to: 0, t0: 0, dur: 0
    };
    slReels.push(rr);
    applyReel(rr);
  }
  measureReels();
}

/* ---------- 跑马灯灯泡 ---------- */
function buildBulbs() {
  if (!bulbsBox) return;
  bulbsBox.innerHTML = '';
  var N = 13;
  for (var i = 0; i < N; i++) {
    var p = 3 + (94 * i / (N - 1));
    var t1 = document.createElement('span');
    t1.className = 'bulb';
    t1.style.left = p.toFixed(2) + '%';
    t1.style.top = '1.4%';
    t1.style.animationDelay = (i * 0.11).toFixed(2) + 's';
    bulbsBox.appendChild(t1);
    var t2 = document.createElement('span');
    t2.className = 'bulb';
    t2.style.left = p.toFixed(2) + '%';
    t2.style.top = '98.6%';
    t2.style.animationDelay = ((N - i) * 0.11).toFixed(2) + 's';
    bulbsBox.appendChild(t2);
  }
}

/* ---------- 主循环 ---------- */
function slotLoop() {
  var now = Date.now();
  for (var i = 0; i < slReels.length; i++) {
    var r = slReels[i];
    if (r.mode === 'rolling') {
      r.speed += (slIh * 0.62 - r.speed) * 0.05;
      r.y += r.speed;
      if (slLoopH > 0) {
        if (r.y >= slLoopH) r.y -= slLoopH;
        if (r.y < 0) r.y += slLoopH;
      }
      applyReel(r);
    } else if (r.mode === 'locking') {
      var t = Math.min(1, (now - r.t0) / r.dur);
      r.y = r.from + (r.to - r.from) * (1 - Math.pow(1 - t, 4));
      applyReel(r);
      if (t >= 1) {
        r.mode = 'idle';
        r.y = r.to % slLoopH;
        applyReel(r);
        onReelLocked(i);
      }
    }
  }
  slRaf = requestAnimationFrame(slotLoop);
}

/* 单列锁定的瞬间：高亮 + 火花 + 咔哒声 */
function onReelLocked(i) {
  var r = slReels[i];
  if (!r) return;
  r.el.classList.add('locked');
  var b = r.el.getBoundingClientRect();
  var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  TC.FX.sparks(cx, cy, 14, '#fde047');
  TC.FX.ring(cx, cy, '#f59e0b');
  if (!TC.Music.isMuted()) {
    var c = TC.Music.init();
    if (c) TC.Music.bell(TC.Music.midi(78 + i * 5), c.currentTime, 0.32, 0.07);
  }
  if (i === slReels.length - 1) onAllLocked(cx, cy);
}

/* 三列全锁：金币瀑布 + 机柜震动 + 跑马灯狂欢 */
function onAllLocked(cx, cy) {
  if (cab) {
    cab.classList.remove('rolling');
    cab.classList.add('win');
  }
  if (cabMsg) cabMsg.textContent = '🎉 三 重 同 名 · 大 奖 开 出 ！';
  TC.FX.shake();
  /* 金币从柜身中段喷出来再落下：FX 粒子是「向上抛 + 重力」，贴顶发射会飞出屏幕 */
  var b = cabWrap.getBoundingClientRect();
  var topX = b.left + b.width * 0.46;
  var topY = b.top + b.height * 0.46;
  TC.FX.emojiBurst(topX, topY, ['🪙', '💰', '✨', '🪙', '💵'], 20);
  TC.FX.confetti(topX, topY, 40, ['#fde047', '#f59e0b', '#fbbf24', '#ef4444']);
  TC.FX.sparks(cx, cy, 30, '#fde047');
  TC.FX.ring(cx, cy, '#ef4444', 0, 3);
  for (var k = 1; k <= 4; k++) {
    (function (kk) {
      setTimeout(function () {
        var bb = cabWrap.getBoundingClientRect();
        var x = bb.left + bb.width * (0.16 + Math.random() * 0.62);
        var y = bb.top + bb.height * (0.36 + Math.random() * 0.18);
        TC.FX.emojiBurst(x, y, ['🪙', '💰', '✨'], 7);
        TC.FX.confetti(x, y, 16, ['#fde047', '#fbbf24', '#ffffff']);
      }, kk * 170);
    })(k);
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  slotFit();
  buildBulbs();
  buildReels();
  if (!slRaf) slotLoop();
  window.addEventListener('resize', slotFit);

  if (leverEl) {
    leverEl.addEventListener('click', function () {
      leverEl.classList.add('pulled');
      setTimeout(function () { leverEl.classList.remove('pulled'); }, 260);
      if (!TC.Music.isMuted()) TC.Music.sfxFlip();
      TC.toggleRoll();
    });
  }
}

function stageLayout() {
  slotFit();
}

function stageStartRoll() {
  if (slRevealTimer) { clearTimeout(slRevealTimer); slRevealTimer = null; }
  if (slReveal) slReveal.classList.remove('active');
  clearLockTimers();
  if (cab) { cab.classList.add('rolling'); cab.classList.remove('win'); }
  if (cabMsg) cabMsg.textContent = '滚轮飞转中…… 再拉一次拉杆停下';
  for (var i = 0; i < slReels.length; i++) {
    slReels[i].el.classList.remove('locked');
    slReels[i].mode = 'rolling';
    slReels[i].speed = slIh * 0.05;
  }
  slRollT0 = Date.now();
  if (slRollTimer) clearInterval(slRollTimer);
  slRollTimer = setInterval(function () {
    var pr = Math.min(1, (Date.now() - slRollT0) / 2600);
    TC.Music.sfxRoll(pr);                 /* 摇人脉冲，每次必响 */
  }, 56);
}

function clearLockTimers() {
  for (var i = 0; i < slLockTimers.length; i++) clearTimeout(slLockTimers[i]);
  slLockTimers = [];
}

function stageStopRoll(winners) {
  if (slRollTimer) { clearInterval(slRollTimer); slRollTimer = null; }
  if (cab) cab.classList.remove('rolling');
  if (!winners || !winners.length || !slItems.length) return;

  /* 只滚出第 1 位中选者，其余交给揭晓浮层 */
  var k = 0;
  for (var i = 0; i < slItems.length; i++) {
    if (slItems[i].id === winners[0].id && slItems[i].name === winners[0].name) { k = i; break; }
  }
  slSettleAt = 0;
  for (var r = 0; r < slReels.length; r++) {
    (function (idx) {
      slLockTimers.push(setTimeout(function () { lockReel(idx, k); }, idx * 220));
    })(r);
  }
}

function lockReel(idx, k) {
  var r = slReels[idx];
  if (!r || !slLoopH) return;
  /* 让第 k 个名字正好停在中间的亮条里 */
  var base = (k - 1) * slIh;
  var from = r.y % slLoopH; if (from < 0) from += slLoopH;
  var d = (base - from) % slLoopH; if (d < 0) d += slLoopH;
  var travel = d + (d < slIh * 3 ? slLoopH : 0);
  r.mode = 'locking';
  r.from = from;
  r.to = from + travel;
  r.t0 = Date.now();
  r.dur = Math.max(420, Math.min(1150, 430 + travel * 0.16));
  r.speed = 0;
  slSettleAt = Math.max(slSettleAt, Date.now() + r.dur + 40);
}

function revealWinners(winners) {
  if (slRevealTimer) clearTimeout(slRevealTimer);
  /* 等三列全部咔哒锁死、金币落一会儿再弹浮层 */
  var wait = Math.max(0, slSettleAt + 140 - Date.now());
  slRevealTimer = setTimeout(function () { showSlotReveal(winners); }, wait);
}

function showSlotReveal(winners) {
  if (!slReveal) return;
  if (slNames) slNames.innerHTML = '';
  slReveal.classList.add('active');           /* 先显示再量尺寸 */
  for (var i = 0; i < winners.length; i++) {
    var d = document.createElement('div');
    d.className = 'sl-one';
    d.style.animationDelay = (i * 0.1) + 's';
    d.innerHTML = '<div class="sid2 id-tag"></div><div class="snm2"></div>';
    d.querySelector('.sid2').textContent = 'No.' + winners[i].id;
    d.querySelector('.snm2').textContent = winners[i].name;
    slNames.appendChild(d);
  }
  var res = TC.autoFitGrid(slNames, winners.length, {
    gap: 12, ratio: 0.62, minW: 130, maxW: 460, pad: 6
  });
  if (res) {
    var fs = Math.max(20, Math.min(Math.round(res.cw * 0.30), 88));
    var kids = slNames.children;
    for (var j = 0; j < kids.length; j++) {
      kids[j].querySelector('.snm2').style.fontSize = fs + 'px';
      kids[j].querySelector('.sid2').style.fontSize = Math.max(10, Math.round(fs * 0.24)) + 'px';
    }
  }
}

function stageClearReveal() {
  if (slRevealTimer) { clearTimeout(slRevealTimer); slRevealTimer = null; }
  if (slReveal) slReveal.classList.remove('active');
}

function onResetHook() {
  if (slRollTimer) { clearInterval(slRollTimer); slRollTimer = null; }
  if (slRevealTimer) { clearTimeout(slRevealTimer); slRevealTimer = null; }
  clearLockTimers();
  if (slReveal) slReveal.classList.remove('active');
  if (cab) cab.classList.remove('rolling', 'win');
  if (cabMsg) cabMsg.textContent = '投入一枚硬币，开始摇号';
  buildReels();
}

function themedPillStyle(el) {
  el.style.background = 'rgba(239,68,68,.20)';
  el.style.border = '1px solid rgba(245,158,11,.68)';
  el.style.color = '#fde68a';
}
