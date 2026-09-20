/* ── 盲盒拆拆乐 · 舞台脚本 ─────────────────────────────────────────── */

var bbRoot = TC.$('#bb-root');
var bbBag = TC.$('#bb-bag');
var bbTear = TC.$('#bb-tear');
var bbCards = TC.$('#bb-cards');
var bbHint = TC.$('#bb-hint');

var bbTimer = null;
var bbCardsEls = [];
var bbProgress = 0;
var bbDrag = null;
var bbGoneT = null;
var bbTold = false;

/* 撕包装的沙沙声：高频短音 + 噪声掠过 */
function bbCrinkle(strong) {
  var c = TC.Music.init();
  if (!c) return;
  var t = c.currentTime;
  TC.Music.tone(1500 + Math.random() * 3200, t, 0.030, 0.016 + (strong ? 0.012 : 0),
    'square', null, { cut: 9000 });
  if (Math.random() < 0.22) TC.Music.whoosh(t, 0.20, 0.42);
}

function bbPaint() {
  if (bbTear) bbTear.style.width = (bbProgress * 100).toFixed(1) + '%';
}

/* ---------- 拖动撕开 ---------- */
function bbDown(e) {
  if (!bbBag || !TC.rolling) return;
  bbDrag = { x0: e.clientX, p0: bbProgress, w: Math.max(90, bbBag.clientWidth) };
  if (e.pointerId !== undefined && bbBag.setPointerCapture) {
    try { bbBag.setPointerCapture(e.pointerId); } catch (err) { }
  }
  bbBag.classList.add('grab');
  if (e.preventDefault) e.preventDefault();
}

function bbMove(e) {
  if (!bbDrag) return;
  var p = bbDrag.p0 + (e.clientX - bbDrag.x0) / (bbDrag.w * 1.05);
  bbProgress = Math.max(0, Math.min(0.985, p));
  bbPaint();
  if (Math.random() < 0.16) bbCrinkle(false);
  if (p >= 1) {
    bbDrag = null;
    if (bbBag) bbBag.classList.remove('grab');
    if (TC.rolling) TC.toggleRoll();
    return;
  }
  if (e.preventDefault) e.preventDefault();
}

function bbUp() {
  bbDrag = null;
  if (bbBag) bbBag.classList.remove('grab');
}

/* ---------- 立牌排布 ---------- */
/* 先交给 autoFitGrid 算尺寸，再把列数收敛成能整除的均衡排布（行数只减不增，绝不会溢出） */
function bbFit(n) {
  var r = TC.autoFitGrid(bbCards, n, {
    gap: Math.max(7, Math.min(20, bbCards.clientWidth / 110)),
    ratio: 1.30, minW: 92, maxW: 340, pad: 6
  });
  if (!r || !n) return r;
  var rows = Math.ceil(n / r.cols);
  var lo = Math.ceil(n / rows);
  var best = r.cols;
  for (var c = r.cols; c >= lo; c--) {
    if (n % c === 0) { best = c; break; }
  }
  if (best !== r.cols) {
    bbCards.style.gridTemplateColumns = 'repeat(' + best + ', ' + r.cw.toFixed(2) + 'px)';
    bbCards.dataset.cols = best;
    r = { cols: best, cw: r.cw, ch: r.ch };
  }
  return r;
}

/* 中文一字约 1em，只靠公式估算必然溢出，这里按真实渲染宽度收缩字号 */
function bbFitText(el, maxFs, boxW, boxH) {
  var fs = Math.max(11, maxFs);
  el.style.fontSize = Math.round(fs) + 'px';
  var guard = 0;
  while (guard++ < 18 && fs > 11 &&
    (el.getBoundingClientRect().width > boxW - 6 || el.getBoundingClientRect().height > boxH)) {
    fs = Math.max(11, fs - Math.max(1, Math.round(fs * 0.07)));
    el.style.fontSize = Math.round(fs) + 'px';
  }
  return Math.round(fs);
}

function bbLayout() {
  if (!bbCards || !bbCardsEls.length) return;
  var r = bbFit(bbCardsEls.length);
  if (!r) return;
  for (var i = 0; i < bbCardsEls.length; i++) {
    var el = bbCardsEls[i];
    var nm = el.querySelector('.nm');
    var id2 = el.querySelector('.id2');
    var em = el.querySelector('.em');
    var len = Math.max(1, Math.min(8, (nm.textContent || '').length));
    var fs = bbFitText(nm, Math.min(r.ch * 0.44, r.cw * 0.90 / len),
      el.clientWidth || r.cw, r.ch * 0.50);
    id2.style.fontSize = Math.max(8, Math.round(fs * 0.42)) + 'px';
    if (em) em.style.fontSize = Math.max(10, Math.round(fs * 0.50)) + 'px';
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  bbPaint();
  if (bbBag) {
    bbBag.addEventListener('pointerdown', bbDown);
    bbBag.addEventListener('pointermove', bbMove);
    bbBag.addEventListener('pointerup', bbUp);
    bbBag.addEventListener('pointercancel', bbUp);
    bbBag.addEventListener('lostpointercapture', bbUp);
  }
}

function stageLayout() {
  if (bbRoot && bbRoot.classList.contains('revealed')) bbLayout();
}

function stageStartRoll() {
  if (!bbRoot) return;
  if (bbGoneT) { clearTimeout(bbGoneT); bbGoneT = null; }
  bbRoot.classList.remove('revealed');
  if (bbCards) bbCards.innerHTML = '';
  bbCardsEls = [];
  if (bbBag) bbBag.classList.remove('torn', 'gone', 'grab');
  bbProgress = 0;
  bbPaint();
  if (bbBag) bbBag.classList.add('shaking');
  if (bbHint) bbHint.classList.add('on');
  if (!bbTold) {
    bbTold = true;
    TC.toast('按住袋子上的封条往右拖，可以自己把它撕开 ✋', 3000);
  }
  var t0 = Date.now();
  var tick = 0;
  bbTimer = setInterval(function () {
    tick++;
    if (!TC.rolling) return;
    var pr = Math.min(1, (Date.now() - t0) / 2800);
    /* ★ 摇人定时器里必须每次调用 */
    TC.Music.sfxRoll(pr);
    if (bbProgress < 0.94) {
      bbProgress = Math.min(0.94, bbProgress + 0.010 + pr * 0.022);
      bbPaint();
    }
    if (tick % 4 === 0) bbCrinkle(false);
  }, 62);
}

function stageStopRoll(winners) {
  if (bbTimer) { clearInterval(bbTimer); bbTimer = null; }
  if (!bbRoot || !bbBag) return;
  bbBag.classList.remove('shaking');
  if (bbHint) bbHint.classList.remove('on');
  bbProgress = 1;
  bbPaint();
  /* 撕拉一声 */
  var c = TC.Music.init();
  if (c) {
    TC.Music.whoosh(c.currentTime, 0.42, 1.1);
    TC.Music.tone(900, c.currentTime, 0.30, 0.06, 'sawtooth', null,
      { glide: 190, cut: 5200, cutTo: 700 });
    TC.Music.tone(2600, c.currentTime + 0.02, 0.16, 0.035, 'square', null, { cut: 9000 });
  }
  setTimeout(function () { if (bbBag) bbBag.classList.add('torn'); }, 110);

  var r = bbBag.getBoundingClientRect();
  var sx = r.left + r.width / 2;
  var sy = r.top + r.height * 0.16;
  /* 开口处金光迸射 */
  TC.FX.sparks(sx, sy, 64, '#fde047');
  TC.FX.sparks(sx, sy, 30, '#ec4899');
  TC.FX.sparks(sx, sy, 18, '#ffffff');
  TC.FX.ring(sx, sy, '#fde047', 0, 3);
  TC.FX.flash('#fde047', 0.35);
  TC.FX.emojiBurst(sx, sy, ['🎉', '✨', '🎊', '💫', '🎁'], 12);
  TC.FX.textPop('撕拉！', sx, sy - r.height * 0.1, '#fde047', Math.max(20, r.width * 0.34));

  bbGoneT = setTimeout(function () { if (bbBag) bbBag.classList.add('gone'); }, 1000);
}

function revealWinners(winners) {
  if (!bbCards || !winners || !winners.length) return;
  bbCards.innerHTML = '';
  bbCardsEls = [];
  for (var i = 0; i < winners.length; i++) {
    var w = winners[i];
    var el = document.createElement('div');
    el.className = 'bb-card';
    el.style.animationDelay = (i * 0.10) + 's';
    el.innerHTML = '<span class="em">🎁</span><span class="nm"></span><span class="id2 id-tag"></span>';
    el.querySelector('.nm').textContent = w.name;
    el.querySelector('.id2').textContent = 'No.' + w.id;
    bbCards.appendChild(el);
    bbCardsEls.push(el);
  }
  if (bbRoot) bbRoot.classList.add('revealed');
  bbLayout();
  if (bbBag) {
    var r = bbBag.getBoundingClientRect();
    TC.FX.sparks(r.left + r.width / 2, r.top + r.height * 0.28, 28, '#fde047');
  }
}

function stageClearReveal() {
  if (bbRoot) bbRoot.classList.remove('revealed');
  if (bbCards) bbCards.innerHTML = '';
  bbCardsEls = [];
  if (bbBag) bbBag.classList.remove('torn', 'gone', 'shaking', 'grab');
  if (bbTimer) { clearInterval(bbTimer); bbTimer = null; }
  if (bbGoneT) { clearTimeout(bbGoneT); bbGoneT = null; }
  bbProgress = 0;
  bbPaint();
}

function onResetHook() {
  stageClearReveal();
  if (bbHint) bbHint.classList.remove('on');
}

function themedPillStyle(el) {
  el.style.background = 'rgba(168,85,247,.20)';
  el.style.border = '1px solid rgba(236,72,153,.6)';
  el.style.color = '#f5d0fe';
}
