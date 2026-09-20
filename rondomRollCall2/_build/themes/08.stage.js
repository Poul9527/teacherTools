/* ── 刮刮乐盲盒 · 舞台脚本 ───────────────────────────────────────── */

var scWrap = TC.$('#sc-wrap');
var scCard = TC.$('#sc-card');
var scInner = TC.$('#sc-inner');
var scCoat = TC.$('#sc-coat');
var scCoin = TC.$('#sc-coin');
var scBurst = TC.$('#sc-burst');
var scPid = TC.$('#sc-pid');
var scPname = TC.$('#sc-pname');
var scPlabel = TC.$('#sc-plabel');
var scBar = TC.$('#sc-bar');
var scPct = TC.$('#sc-pct');
var scHint = TC.$('#sc-hint');
var scReveal = TC.$('#sc-reveal');
var scRcList = TC.$('#sc-rc-list');

var scCoatCtx = scCoat ? scCoat.getContext('2d') : null;
var scMask = document.createElement('canvas');
var SC_MW = 96, SC_MH = 112;
scMask.width = SC_MW; scMask.height = SC_MH;
var scMaskCtx = scMask.getContext('2d');

var scW = 0, scH = 0, scDpr = 1;
var scCoinR = 22;
var scCoinX = 0, scCoinY = 0, scPrevX = 0, scPrevY = 0;
var scMouseOn = false;
var scRollTimer = null, scT0 = 0, scTicks = 0, scErases = 0;
var scPath = [], scPathIdx = 0;
var scRatio = 0, scRevealed = false, scLayoutDone = false;

/* ---------- 背景：暖光晕 + 旋转光线 + 金粉 ---------- */
var scBg = TC.$('#sc-bg'), scBgCtx = scBg ? scBg.getContext('2d') : null;
var scBgRaf = null, scBgT = 0, scSpecks = [];

function scBgResize() {
  if (!scBg || !scBgCtx) return;
  var w = scBg.parentElement.clientWidth, h = scBg.parentElement.clientHeight;
  if (!w || !h) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  scBg.width = Math.round(w * dpr); scBg.height = Math.round(h * dpr);
  scBgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  scSpecks = [];
  var n = Math.round(w * h / 26000);
  for (var i = 0; i < n; i++) {
    scSpecks.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.7 + Math.random() * 2.1,
      sp: 0.18 + Math.random() * 0.65,
      ph: Math.random() * 6.28,
      c: Math.random() < 0.4 ? 'rgba(255,255,255,.9)' : 'rgba(253,224,71,.95)'
    });
  }
}

function scBgDraw() {
  if (!scBg || !scBgCtx) return;
  var w = scBg.clientWidth, h = scBg.clientHeight;
  if (!w || !h) return;
  var c = scBgCtx;
  c.clearRect(0, 0, w, h);

  var g = c.createRadialGradient(w * 0.5, h * 0.40, 0, w * 0.5, h * 0.40, Math.max(w, h) * 0.75);
  g.addColorStop(0, 'rgba(146,100,14,.55)');
  g.addColorStop(0.5, 'rgba(70,48,8,.26)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);

  c.save();
  c.translate(w * 0.5, h * 0.42);
  c.rotate(scBgT * 0.0015);
  var R = Math.max(w, h) * 0.9, sp = 0.052;
  for (var i = 0; i < 12; i++) {
    c.rotate(6.2832 / 12);
    var lg = c.createLinearGradient(0, 0, 0, -R);
    lg.addColorStop(0, 'rgba(253,224,71,.10)');
    lg.addColorStop(1, 'rgba(253,224,71,0)');
    c.fillStyle = lg;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.sin(sp) * R, -Math.cos(sp) * R);
    c.lineTo(Math.sin(-sp) * R, -Math.cos(-sp) * R);
    c.closePath();
    c.fill();
  }
  c.restore();

  for (var k = 0; k < scSpecks.length; k++) {
    var s = scSpecks[k];
    s.ph += 0.02; s.y -= s.sp;
    if (s.y < -8) { s.y = h + 8; s.x = Math.random() * w; }
    c.globalAlpha = 0.22 + Math.abs(Math.sin(s.ph)) * 0.55;
    c.fillStyle = s.c;
    c.beginPath();
    c.arc(s.x + Math.sin(s.ph) * 9, s.y, s.r, 0, 6.2832);
    c.fill();
  }
  c.globalAlpha = 1;
}

/* ---------- 背景主循环（同时负责金币待机漂浮） ---------- */
function scLoop() {
  scBgT++;
  scBgDraw();
  if (!TC.rolling && scCoin && scLayoutDone && !scMouseOn) {
    var rx = scW * 0.76 + Math.sin(scBgT * 0.021) * scW * 0.035;
    var ry = scH * 0.78 + Math.cos(scBgT * 0.017) * scH * 0.035;
    scCoinX += (rx - scCoinX) * 0.045;
    scCoinY += (ry - scCoinY) * 0.045;
    scPlaceCoin(scCoinX, scCoinY);
  }
  scBgRaf = requestAnimationFrame(scLoop);
}

/* ---------- 卡片尺寸（按舞台实际可视区域计算，绝不写死） ---------- */
function scFit() {
  if (!scWrap || !scInner) return;
  var W = scWrap.clientWidth, H = scWrap.clientHeight;
  if (!W || !H) return;
  var AR = 1.16;
  var availH = H - Math.max(34, H * 0.11);
  var ch = Math.min(availH, W * 0.62 * AR);
  var cw = ch / AR;
  if (cw > W * 0.94) { cw = W * 0.94; ch = cw * AR; }
  cw = Math.max(110, Math.round(cw));
  ch = Math.round(cw * AR);
  var changed = (!scLayoutDone || cw !== scW || ch !== scH);
  scW = cw; scH = ch;
  scDpr = Math.min(window.devicePixelRatio || 1, 2);

  scInner.style.width = scW + 'px';
  scInner.style.height = scH + 'px';

  scCoinR = Math.max(13, scW * 0.078);
  if (scCoin) {
    scCoin.style.width = (scCoinR * 2) + 'px';
    scCoin.style.height = (scCoinR * 2) + 'px';
    scCoin.style.lineHeight = (scCoinR * 2) + 'px';
    scCoin.style.fontSize = (scCoinR * 1.95) + 'px';
  }
  if (scPname) scPname.style.fontSize = Math.round(scW * 0.195) + 'px';
  if (scPid) scPid.style.fontSize = Math.round(scW * 0.062) + 'px';
  if (scPlabel) scPlabel.style.fontSize = Math.round(scW * 0.040) + 'px';
  if (scHint) scHint.style.fontSize = clampPx(scW * 0.038, 11, 16) + 'px';
  var scTopEl = TC.$('.sc-top', scCard);
  if (scTopEl) scTopEl.style.fontSize = clampPx(scW * 0.036, 10, 15) + 'px';
  var scBotEl = TC.$('.sc-bottom', scCard);
  if (scBotEl) scBotEl.style.fontSize = clampPx(scW * 0.030, 9, 13) + 'px';
  var scFootEl = TC.$('.sc-rc-foot', scReveal);
  if (scFootEl) scFootEl.style.fontSize = clampPx(scW * 0.028, 9, 12) + 'px';
  var scHeadEl = TC.$('.sc-rc-head', scReveal);
  if (scHeadEl) scHeadEl.style.fontSize = clampPx(scW * 0.032, 10, 14) + 'px';

  if (scCoat && scCoatCtx) {
    scCoat.width = Math.round(scW * scDpr);
    scCoat.height = Math.round(scH * scDpr);
  }
  SC_MH = Math.max(40, Math.round(SC_MW * AR));
  scMask.width = SC_MW;
  scMask.height = SC_MH;
  scMaskCtx = scMask.getContext('2d');

  if (changed) {
    scLayoutDone = true;
    scDrawCoat();
    scCoinX = scW * 0.76; scCoinY = scH * 0.78;
    scPlaceCoin(scCoinX, scCoinY);
  }
}

function clampPx(v, a, b) { return Math.max(a, Math.min(b, Math.round(v))); }

function scPlaceCoin(x, y) {
  if (!scCoin) return;
  scCoin.style.transform = 'translate(' + (x - scCoinR) + 'px,' + (y - scCoinR) + 'px)';
}

/* ---------- 涂层：银灰闪粉 ---------- */
function scDrawCoat() {
  if (!scCoat || !scCoatCtx || !scW || !scH) return;
  var w = scCoat.width, h = scCoat.height, c = scCoatCtx;
  var k = w / scW;
  scCoat.style.transition = 'none';
  scCoat.style.opacity = '1';

  c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, w, h);

  var g = c.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#dfe3ea');
  g.addColorStop(0.24, '#a3aab6');
  g.addColorStop(0.46, '#eef1f6');
  g.addColorStop(0.7, '#9ba2ae');
  g.addColorStop(1, '#d3d8e0');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  var n = Math.round(w * h / 150);
  for (var i = 0; i < n; i++) {
    c.fillStyle = 'rgba(255,255,255,' + (0.10 + Math.random() * 0.6).toFixed(2) + ')';
    c.beginPath();
    c.arc(Math.random() * w, Math.random() * h, (0.5 + Math.random() * 1.5) * k, 0, 6.2832);
    c.fill();
  }
  for (var j = 0; j < n * 0.45; j++) {
    c.fillStyle = 'rgba(78,86,102,' + (0.05 + Math.random() * 0.22).toFixed(2) + ')';
    c.beginPath();
    c.arc(Math.random() * w, Math.random() * h, (0.6 + Math.random() * 1.3) * k, 0, 6.2832);
    c.fill();
  }

  c.save();
  c.translate(w / 2, h / 2);
  c.rotate(-0.34);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  var fs = Math.max(12, scW * 0.072) * k;
  c.font = '900 ' + fs + 'px -apple-system,"Microsoft YaHei",sans-serif';
  c.fillStyle = 'rgba(112,120,134,.55)';
  c.fillText('刮 开 涂 层', 0, -fs * 1.5);
  c.font = '900 ' + (fs * 0.92) + 'px -apple-system,"Microsoft YaHei",sans-serif';
  c.fillText('SCRATCH  HERE', 0, 0);
  c.font = '800 ' + (fs * 0.6) + 'px -apple-system,"Microsoft YaHei",sans-serif';
  c.fillStyle = 'rgba(112,120,134,.45)';
  c.fillText('用 金 币 刮 出 幸 运', 0, fs * 1.6);
  c.restore();

  c.save();
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.lineWidth = Math.max(2, w * 0.007);
  c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
  c.restore();

  var hg = c.createLinearGradient(0, 0, w, h * 0.65);
  hg.addColorStop(0, 'rgba(255,255,255,0)');
  hg.addColorStop(0.5, 'rgba(255,255,255,.30)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hg;
  c.fillRect(0, 0, w, h * 0.65);

  scMaskCtx.clearRect(0, 0, scMask.width, scMask.height);
  scErases = 0; scRatio = 0;
  if (scBar) scBar.style.width = '0%';
  if (scPct) scPct.textContent = '0%';
}

/* ---------- 擦除 ---------- */
function scErase(ax, ay, bx, by, r) {
  if (!scCoatCtx || !scW || !scH) return;
  var w = scCoat.width, h = scCoat.height;
  var sx = w / scW, sy = h / scH;
  var c = scCoatCtx;
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = Math.max(3, r * 2 * sx);
  c.beginPath();
  c.moveTo(ax * sx, ay * sy);
  c.lineTo(bx * sx, by * sy);
  c.stroke();
  c.restore();

  var mx = scMask.width / scW, my = scMask.height / scH;
  scMaskCtx.save();
  scMaskCtx.globalCompositeOperation = 'source-over';
  scMaskCtx.strokeStyle = '#fff';
  scMaskCtx.lineCap = 'round'; scMaskCtx.lineJoin = 'round';
  scMaskCtx.lineWidth = Math.max(2, r * 2 * mx);
  scMaskCtx.beginPath();
  scMaskCtx.moveTo(ax * mx, ay * my);
  scMaskCtx.lineTo(bx * mx, by * my);
  scMaskCtx.stroke();
  scMaskCtx.restore();
}

function scUpdateRatio() {
  if (!scMaskCtx) return;
  var w = scMask.width, h = scMask.height;
  var d = scMaskCtx.getImageData(0, 0, w, h).data;
  var hit = 0, total = w * h;
  for (var i = 3; i < d.length; i += 4) { if (d[i] > 96) hit++; }
  scRatio = hit / total;
  var pc = Math.min(100, Math.round(scRatio * 100));
  if (scBar) scBar.style.width = pc + '%';
  if (scPct) scPct.textContent = pc + '%';
  if (!TC.rolling && !scRevealed && scRatio > 0.55) scFullReveal();
}

/* 全部揭开：涂层渐隐 + 金光 */
function scFullReveal() {
  if (scRevealed) return;
  scRevealed = true;
  if (scCoat) { scCoat.style.transition = 'opacity .5s ease'; scCoat.style.opacity = '0'; }
  if (scBar) scBar.style.width = '100%';
  if (scPct) scPct.textContent = '100%';
  if (scBurst) { scBurst.classList.remove('on'); void scBurst.offsetWidth; scBurst.classList.add('on'); }
  var p = scCenter();
  if (p) {
    TC.FX.sparks(p.x, p.y, 30, '#fde047');
    TC.FX.ring(p.x, p.y, '#eab308', 0, 3);
    TC.FX.emojiBurst(p.x, p.y, ['🪙', '✨', '💰', '💛'], 10);
  }
  TC.Music.sfxFlip();
}

function scCenter() {
  if (!scInner) return null;
  var r = scInner.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/* ---------- 摇人时金币的自动刮擦路线 ---------- */
function scMakePath() {
  scPath = [];
  var cols = 4, rows = 5, c, r;
  for (r = 0; r < rows; r++) {
    for (c = 0; c < cols; c++) {
      scPath.push({
        x: scW * (0.18 + (c + 0.5 + (Math.random() - 0.5) * 0.6) * (0.64 / cols)),
        y: scH * (0.18 + (r + 0.5 + (Math.random() - 0.5) * 0.6) * (0.64 / rows))
      });
    }
  }
  for (var i = scPath.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = scPath[i]; scPath[i] = scPath[j]; scPath[j] = t;
  }
  scPathIdx = 0;
}

function scScramble() {
  scTicks++;
  if (scTicks % 4 !== 0) return;
  var list = TC.students;
  if (!list || !list.length) return;
  var s = TC.pick(list);
  if (scPid) scPid.textContent = s.id;
  if (scPname) scPname.textContent = s.name;
}

function scRollTick() {
  if (!scPath.length || !scW) return;
  var tg = scPath[scPathIdx % scPath.length];
  var dx = tg.x - scCoinX, dy = tg.y - scCoinY;
  var d = Math.sqrt(dx * dx + dy * dy);
  if (d < scW * 0.055) {
    scPathIdx++;
    tg = scPath[scPathIdx % scPath.length];
    dx = tg.x - scCoinX; dy = tg.y - scCoinY;
    d = Math.sqrt(dx * dx + dy * dy) || 1;
  }
  var step = Math.max(scW * 0.05, d * 0.36);
  var nx = scCoinX + dx / d * step;
  var ny = scCoinY + dy / d * step;
  scErase(scCoinX, scCoinY, nx, ny, scCoinR * 0.82);
  scCoinX = nx; scCoinY = ny;
  scPlaceCoin(scCoinX, scCoinY);

  scErases++;
  if (scErases % 6 === 0) scUpdateRatio();
  scScramble();

  /* 沙沙刮卡声 */
  if (Math.random() < 0.55) {
    var ac = TC.Music.init();
    if (ac) TC.Music.whoosh(ac.currentTime, 0.075, 0.30);
  }
  if (scErases % 4 === 0) {
    var p = scCenter();
    if (p) TC.FX.sparks(p.x + scCoinX - scW / 2, p.y + scCoinY - scH / 2, 2, '#fde047');
  }
  TC.Music.sfxRoll(Math.min(1, (Date.now() - scT0) / 3200));
}

/* ---------- 手动刮 ---------- */
function scScratchTo(clientX, clientY) {
  if (!scInner || TC.rolling || scRevealed) return;
  var r = scInner.getBoundingClientRect();
  var x = clientX - r.left, y = clientY - r.top;
  if (x < -30 || y < -30 || x > scW + 30 || y > scH + 30) return;
  x = Math.max(2, Math.min(scW - 2, x));
  y = Math.max(2, Math.min(scH - 2, y));
  var d = Math.sqrt((x - scPrevX) * (x - scPrevX) + (y - scPrevY) * (y - scPrevY));
  if (d > scW * 0.45) { scPrevX = x; scPrevY = y; scErase(x, y, x, y, scCoinR * 0.7); }
  else scErase(scPrevX, scPrevY, x, y, scCoinR * 0.7);
  scPrevX = x; scPrevY = y;
  scCoinX = x; scCoinY = y;
  scPlaceCoin(scCoinX, scCoinY);
  scErases++;
  if (scErases % 5 === 0) scUpdateRatio();
}

function scOnMouse(e) {
  if (!scInner) return;
  var r = scInner.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
  scMouseOn = true;
  scScratchTo(e.clientX, e.clientY);
}
function scOnTouch(e) {
  if (!e.touches || !e.touches.length) return;
  var t = e.touches[0];
  var r = scInner.getBoundingClientRect();
  if (t.clientX < r.left || t.clientX > r.right || t.clientY < r.top || t.clientY > r.bottom) return;
  scMouseOn = true;
  scScratchTo(t.clientX, t.clientY);
  if (e.preventDefault) e.preventDefault();
}

/* ---------- 小票揭晓 ---------- */
function scBuildReceipt(winners) {
  if (!scRcList) return;
  scRcList.innerHTML = '';
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'sc-rc-item';
    d.style.animationDelay = (i * 0.07) + 's';
    d.innerHTML = '<span class="sc-rc-id id-tag"></span><b class="sc-rc-nm"></b>';
    d.querySelector('.sc-rc-id').textContent = w.id;
    d.querySelector('.sc-rc-nm').textContent = w.name;
    scRcList.appendChild(d);
  });
  scFitReceipt(winners.length);
}

function scFitReceipt(n) {
  if (!scRcList || !n) return;
  var r = TC.autoFitGrid(scRcList, n, { gap: 6, ratio: 1.0, minW: 62, maxW: 190, pad: 2 });
  if (!r) return;
  var fs = Math.max(11, Math.min(20, Math.round(r.cw / 4.6)));
  var items = scRcList.children;
  for (var i = 0; i < items.length; i++) {
    var nm = items[i].querySelector('.sc-rc-nm');
    var id = items[i].querySelector('.sc-rc-id');
    if (nm) nm.style.fontSize = fs + 'px';
    if (id) id.style.fontSize = Math.max(8, Math.round(fs * 0.6)) + 'px';
  }
  var head = TC.$('.sc-rc-head', scReveal);
  if (head) head.style.fontSize = Math.max(10, Math.min(14, Math.round(r.cw / 7))) + 'px';
}

/* ---------- 生命周期钩子 ---------- */
function scResetFace() {
  if (scPlabel) scPlabel.textContent = '恭 喜 中 奖 同 学';
  if (scPid) scPid.textContent = '--';
  if (scPname) scPname.textContent = '？ ？ ？';
  if (scCard) scCard.classList.remove('won');
  if (scBar) scBar.style.width = '0%';
  if (scPct) scPct.textContent = '0%';
  if (scHint) scHint.textContent = '按住鼠标在卡片上刮一刮 · 或直接按空格开始点名';
}

function stageInit() {
  scBgResize();
  scFit();
  scResetFace();
  if (!scBgRaf) scLoop();
  window.addEventListener('resize', scBgResize);
  if (scInner) {
    scInner.addEventListener('mousemove', scOnMouse);
    scInner.addEventListener('mouseleave', function () { scMouseOn = false; });
    scInner.addEventListener('touchmove', scOnTouch, { passive: false });
    scInner.addEventListener('touchend', function () { scMouseOn = false; });
  }
}

function stageLayout() {
  scBgResize();
  scFit();
  if (scRcList && scReveal && scReveal.classList.contains('active')) {
    scFitReceipt(scRcList.children.length);
  }
}

function stageStartRoll() {
  if (scReveal) scReveal.classList.remove('active');
  scRevealed = false;
  scTicks = 0;
  scMouseOn = false;
  scDrawCoat();
  scMakePath();
  scCoinX = scW * 0.5; scCoinY = scH * 0.5;
  scPrevX = scCoinX; scPrevY = scCoinY;
  scPlaceCoin(scCoinX, scCoinY);
  if (scPlabel) scPlabel.textContent = '刮 开 中 · 请 稍 候';
  if (scPid) scPid.textContent = '--';
  if (scPname) scPname.textContent = '？ ？ ？';
  if (scCard) scCard.classList.remove('won');
  if (scHint) scHint.textContent = '金币正在刮擦涂层… 再按一次空格停下';
  scT0 = Date.now();
  clearInterval(scRollTimer);
  scRollTimer = setInterval(scRollTick, 55);
}

function stageStopRoll(winners) {
  clearInterval(scRollTimer); scRollTimer = null;
  scRevealed = true;

  /* 残余涂层一次性碎散 */
  if (scCoat) { scCoat.style.transition = 'opacity .42s ease'; scCoat.style.opacity = '0'; }
  scMaskCtx.clearRect(0, 0, scMask.width, scMask.height);
  if (scBar) scBar.style.width = '100%';
  if (scPct) scPct.textContent = '100%';
  if (scBurst) { scBurst.classList.remove('on'); void scBurst.offsetWidth; scBurst.classList.add('on'); }

  var w = winners && winners.length ? winners[0] : null;
  if (w) {
    if (scPlabel) scPlabel.textContent = '恭 喜 中 奖 同 学';
    if (scPid) scPid.textContent = w.id;
    if (scPname) scPname.textContent = w.name;
  }
  if (scCard) scCard.classList.add('won');
  if (scHint) scHint.textContent = '刮中啦！按 空格 继续下一轮 · 按 R 重置';

  var p = scCenter();
  if (p) {
    TC.FX.sparks(p.x, p.y, 46, '#fde047');
    TC.FX.sparks(p.x, p.y, 22, '#ffffff');
    TC.FX.ring(p.x, p.y, '#eab308', 0, 3);
    TC.FX.emojiBurst(p.x, p.y, ['🪙', '💰', '✨', '🎉', '💛'], 16);
    if (w) TC.FX.textPop(w.name, p.x, p.y - scH * 0.18, '#fff7cc', Math.max(22, scW * 0.14));
  }
  scCoinX = scW * 0.86; scCoinY = scH * 0.86;
  scPlaceCoin(scCoinX, scCoinY);
}

function revealWinners(winners) {
  if (!scReveal || !winners || !winners.length) return;
  scBuildReceipt(winners);
  scReveal.classList.add('active');
}

function stageClearReveal() {
  if (scReveal) scReveal.classList.remove('active');
}

function onResetHook() {
  clearInterval(scRollTimer); scRollTimer = null;
  scRevealed = false;
  scMouseOn = false;
  if (scReveal) scReveal.classList.remove('active');
  scDrawCoat();
  scResetFace();
  if (scBar) scBar.style.width = '0%';
  scCoinX = scW * 0.76; scCoinY = scH * 0.78;
  scPlaceCoin(scCoinX, scCoinY);
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(234,179,8,.24), rgba(245,158,11,.12))';
  el.style.border = '1px solid rgba(234,179,8,.55)';
  el.style.color = '#fde68a';
}
