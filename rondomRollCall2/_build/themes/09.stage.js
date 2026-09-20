/* ── 吃鸡空投补给箱 · 舞台脚本 ───────────────────────────────────── */

var cgDrop = TC.$('#cg-drop');
var cgChute = TC.$('#cg-chute');
var cgCanopy = TC.$('#cg-canopy');
var cgRopes = TC.$('#cg-ropes');
var cgCrate = TC.$('#cg-crate');
var cgHud = TC.$('#cg-hud');
var cgReveal = TC.$('#cg-reveal');
var cgList = TC.$('#cg-list');
var cgPsub = TC.$('#cg-psub');

var cgBg = TC.$('#cg-bg'), cgCtx = cgBg ? cgBg.getContext('2d') : null;
var cgRaf = null, cgT = 0;
var cgW = 0, cgH = 0;
var cgCrateW = 90, cgCrateH = 92, cgTotalH = 240;
var cgY = 0, cgHoverY = 40, cgLandY = 200;
var cgLanded = false, cgImpact = 0, cgRot = 0, cgReady = false;
var cgSmoke = [], cgHills = [];
var cgSprRed = null, cgSprGray = null;

/* ---------- 烟雾精灵 ---------- */
function cgMakeSprite(r, g, b, a) {
  var c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  var x = c.getContext('2d');
  var gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')');
  gr.addColorStop(0.45, 'rgba(' + r + ',' + g + ',' + b + ',' + (a * 0.42).toFixed(2) + ')');
  gr.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  return c;
}

function cgBgResize() {
  if (!cgBg || !cgCtx) return;
  var w = cgBg.parentElement.clientWidth, h = cgBg.parentElement.clientHeight;
  if (!w || !h) return;
  cgW = w; cgH = h;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cgBg.width = Math.round(w * dpr);
  cgBg.height = Math.round(h * dpr);
  cgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!cgSprRed) cgSprRed = cgMakeSprite(232, 58, 48, 0.62);
  if (!cgSprGray) cgSprGray = cgMakeSprite(120, 132, 128, 0.30);
  cgMakeHills(w, h);
}

function cgMakeHills(w, h) {
  cgHills = [];
  var layers = [
    { y: h * 0.76, amp: h * 0.075, col: 'rgba(7,29,20,.92)' },
    { y: h * 0.86, amp: h * 0.052, col: 'rgba(3,15,10,.96)' }
  ];
  for (var L = 0; L < layers.length; L++) {
    var pts = [], base = layers[L].y, amp = layers[L].amp, ph = 1.7 + L * 3.3;
    for (var i = 0; i <= 14; i++) {
      var t = i / 14;
      var y = base - (Math.sin(t * 5.1 + ph) * 0.56 + Math.sin(t * 11.3 + ph * 1.7) * 0.44) * amp;
      pts.push({ x: t * w, y: y });
    }
    cgHills.push({ pts: pts, col: layers[L].col, base: base });
  }
}

/* ---------- 背景绘制：地平线 + 起伏山脊 + 红色信号烟 ---------- */
function cgDrawBg() {
  if (!cgCtx || !cgW || !cgH) return;
  var c = cgCtx, w = cgW, h = cgH;
  c.clearRect(0, 0, w, h);

  var sky = c.createLinearGradient(0, 0, 0, h * 0.9);
  sky.addColorStop(0, 'rgba(6,32,22,.55)');
  sky.addColorStop(0.55, 'rgba(10,44,30,.30)');
  sky.addColorStop(1, 'rgba(4,16,10,.0)');
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h * 0.92);

  for (var L = 0; L < cgHills.length; L++) {
    var hl = cgHills[L];
    c.fillStyle = hl.col;
    c.beginPath();
    c.moveTo(0, h);
    for (var i = 0; i < hl.pts.length; i++) c.lineTo(hl.pts[i].x, hl.pts[i].y);
    c.lineTo(w, h);
    c.closePath();
    c.fill();
  }

  var gy = h * 0.88;
  var glow = c.createLinearGradient(0, gy - h * 0.10, 0, gy + h * 0.04);
  glow.addColorStop(0, 'rgba(16,185,129,0)');
  glow.addColorStop(0.6, 'rgba(16,185,129,.16)');
  glow.addColorStop(1, 'rgba(16,185,129,0)');
  c.fillStyle = glow;
  c.fillRect(0, gy - h * 0.10, w, h * 0.16);

  /* 降落点标记 */
  c.save();
  c.strokeStyle = 'rgba(250,204,21,.42)';
  c.lineWidth = 2;
  c.setLineDash([9, 8]);
  c.lineDashOffset = -(cgT * 0.5);
  c.beginPath();
  c.ellipse(w * 0.5, gy + h * 0.02, w * 0.085, h * 0.026, 0, 0, 6.2832);
  c.stroke();
  c.restore();

  /* 信号烟 */
  var rate = TC.rolling ? 4 : 1;
  for (var k = 0; k < rate; k++) {
    if (cgSmoke.length > 460) break;
    cgSmoke.push({
      x: w * 0.5 + (Math.random() - 0.5) * w * 0.10,
      y: gy + h * 0.025 + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 1.1,
      vy: -(0.6 + Math.random() * 1.7) * (TC.rolling ? 1.45 : 1),
      r: 9 + Math.random() * 17,
      gr: 0.26 + Math.random() * 0.5,
      life: 1,
      decay: 0.0042 + Math.random() * 0.0056,
      red: Math.random() < 0.76
    });
  }

  c.save();
  c.globalCompositeOperation = 'lighter';
  for (var m = cgSmoke.length - 1; m >= 0; m--) {
    var p = cgSmoke[m];
    p.x += p.vx;
    p.y += p.vy;
    p.vx += Math.sin((p.y + cgT) * 0.012) * 0.035;
    p.r += p.gr;
    p.life -= p.decay;
    if (p.life <= 0 || p.y < -60) { cgSmoke.splice(m, 1); continue; }
    c.globalAlpha = Math.max(0, p.life) * (p.red ? 0.85 : 0.42);
    var spr = p.red ? cgSprRed : cgSprGray;
    c.drawImage(spr, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
  }
  c.restore();
  c.globalAlpha = 1;
}

/* ---------- 主循环 ---------- */
function cgLoop() {
  cgT++;
  cgDrawBg();

  if (cgDrop && cgW) {
    var target, spd;
    if (TC.rolling) {
      target = cgLandY;
      spd = 0.062;
      cgRot = Math.sin(cgT * 0.20) * 4.6 + (Math.random() - 0.5) * 3.4;
    } else if (cgLanded) {
      target = cgLandY;
      spd = 0.16;
      cgRot *= 0.86;
    } else {
      target = cgHoverY + Math.sin(cgT * 0.021) * cgH * 0.014;
      spd = 0.012;
      cgRot = Math.sin(cgT * 0.026) * 1.2;
    }
    cgY += (target - cgY) * spd;
    if (cgImpact > 0) cgImpact = Math.max(0, cgImpact - 0.045);
    var sx = 1 + cgImpact * 0.16, sy = 1 - cgImpact * 0.16;
    cgDrop.style.transform = 'translate(-50%,' + cgY.toFixed(1) + 'px) rotate(' + cgRot.toFixed(2) + 'deg) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')';
  }
  cgRaf = requestAnimationFrame(cgLoop);
}

/* ---------- 尺寸：全部按舞台实际可用空间换算 ---------- */
function cgFitDrop() {
  if (!cgDrop) return;
  var W = cgDrop.parentElement.clientWidth, H = cgDrop.parentElement.clientHeight;
  if (!W || !H) return;
  cgW = W; cgH = H;
  var crateW = Math.max(64, Math.min(H * 0.20, W * 0.13, 190));
  if (crateW > W * 0.22) crateW = W * 0.22;
  cgCrateW = Math.round(crateW);
  cgCrateH = Math.round(cgCrateW * 1.02);
  var canopyW = Math.round(cgCrateW * 1.85);
  var canopyH = Math.round(canopyW * 0.52);
  var ropeH = Math.round(cgCrateW * 0.55);
  var chuteH = Math.round(canopyH * 0.88 + ropeH);

  if (cgChute) { cgChute.style.width = canopyW + 'px'; cgChute.style.height = chuteH + 'px'; }
  if (cgCanopy) { cgCanopy.style.width = canopyW + 'px'; cgCanopy.style.height = canopyH + 'px'; }
  if (cgRopes) {
    cgRopes.style.top = Math.round(canopyH * 0.88) + 'px';
    cgRopes.style.width = canopyW + 'px';
    cgRopes.style.height = ropeH + 'px';
  }
  if (cgCrate) { cgCrate.style.width = cgCrateW + 'px'; cgCrate.style.height = cgCrateH + 'px'; }

  var tag = TC.$('.cg-tag', cgCrate);
  if (tag) tag.style.fontSize = Math.max(8, Math.round(cgCrateW * 0.10)) + 'px';
  var cross = TC.$('.cg-cross', cgCrate);
  if (cross) cross.style.fontSize = Math.max(14, Math.round(cgCrateW * 0.30)) + 'px';
  var lidL = TC.$('#cg-lid-l'), lidR = TC.$('#cg-lid-r');
  if (lidL) lidL.style.fontSize = Math.max(9, Math.round(cgCrateW * 0.14)) + 'px';
  if (lidR) lidR.style.fontSize = Math.max(9, Math.round(cgCrateW * 0.14)) + 'px';

  cgTotalH = chuteH + cgCrateH;
  cgHoverY = Math.max(2, Math.round(H * 0.07));
  cgLandY = Math.max(4, Math.round(H * 0.90 - cgTotalH));
  if (!cgReady) { cgReady = true; cgY = -cgTotalH - 12; }
  else if (!cgLanded && !TC.rolling && (cgY < -cgTotalH || cgY > H)) {
    cgY = Math.max(2, Math.min(cgHoverY, H - cgTotalH));
  }
}

/* ---------- 揭晓清单 ---------- */
function cgFitList(n, winners) {
  if (!cgList || !n) return;
  var W = cgList.clientWidth;
  if (!W) return;
  var gap = 8;
  var ideal = (W - gap * (n - 1)) / n;
  var r = TC.autoFitGrid(cgList, n, { gap: gap, ratio: 1.3, minW: 88, maxW: Math.max(90, ideal), pad: 0 });
  if (!r) return;
  var maxLen = 2;
  for (var i = 0; i < winners.length; i++) {
    if (winners[i].name.length > maxLen) maxLen = winners[i].name.length;
  }
  var unit = Math.min(r.cw, r.ch);
  var nmF = Math.min(unit * 0.34, (r.cw * 0.84) / Math.max(2, maxLen));
  nmF = Math.max(12, Math.min(64, Math.round(nmF)));
  var idF = Math.max(9, Math.round(nmF * 0.36));
  var raF = Math.max(9, Math.round(nmF * 0.32));
  var items = cgList.children;
  for (var k = 0; k < items.length; k++) {
    var nm = items[k].querySelector('.cg-nm');
    var id = items[k].querySelector('.cg-id');
    var ra = items[k].querySelector('.cg-rar');
    if (nm) nm.style.fontSize = nmF + 'px';
    if (id) id.style.fontSize = idF + 'px';
    if (ra) ra.style.fontSize = raF + 'px';
  }
  if (cgPsub) cgPsub.style.fontSize = Math.max(9, Math.min(13, Math.round(unit * 0.10))) + 'px';
}

/* ---------- HUD ---------- */
function cgHudText() {
  if (!cgHud) return;
  if (TC.rolling) cgHud.textContent = '🪂 空投中 · 补给箱正在下落…';
  else cgHud.textContent = '🪂 待抽 ' + TC.remain.length + ' 人 · 空投航线就绪';
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  cgBgResize();
  cgFitDrop();
  if (!cgRaf) cgLoop();
  window.addEventListener('resize', cgBgResize);
  if (cgCrate) cgCrate.classList.remove('open');
  if (cgList) { cgList.innerHTML = ''; cgList._winners = []; }
  if (cgReveal) cgReveal.classList.remove('active');
  cgHudText();
}

function stageLayout() {
  cgBgResize();
  cgFitDrop();
  cgHudText();
  if (cgReveal && cgReveal.classList.contains('active') && cgList) {
    var ws = cgList._winners || [];
    if (ws.length) cgFitList(ws.length, ws);
  }
}

function stageStartRoll() {
  if (cgReveal) cgReveal.classList.remove('active');
  if (cgCrate) cgCrate.classList.remove('open');
  cgLanded = false;
  cgImpact = 0;
  cgHudText();
}

function stageStopRoll(winners) {
  cgLanded = true;
  cgImpact = 1;
  cgY = cgLandY;
  if (cgDrop) {
    cgDrop.style.transform = 'translate(-50%,' + cgY.toFixed(1) + 'px) rotate(0deg) scale(1,1)';
  }
  if (cgCrate) cgCrate.classList.add('open');
  cgHudText();
  TC.FX.shake(1.1);
  var p = cgCenter();
  if (p) {
    TC.FX.ring(p.x, p.y, '#10b981', 0, 3);
    TC.FX.ring(p.x, p.y, '#facc15', 0, 2);
    TC.FX.sparks(p.x, p.y, 44, '#facc15');
    TC.FX.sparks(p.x, p.y, 26, '#10b981');
    TC.FX.confetti(p.x, p.y, 46, ['#10b981', '#facc15', '#fde047', '#34d399', '#ffffff']);
    TC.FX.emojiBurst(p.x, p.y, ['📦', '✨', '🪂', '💥', '🌟'], 14);
  }
  var ac = TC.Music.init();
  if (ac) {
    TC.Music.whoosh(ac.currentTime, 0.55, 1.1);
    TC.Music.sub(ac.currentTime, 1.25);
    TC.Music.crash(ac.currentTime, 0.9);
  }
}

function cgCenter() {
  if (!cgCrate) return null;
  var r = cgCrate.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function revealWinners(winners) {
  if (!cgReveal || !cgList || !winners || !winners.length) return;
  cgList.innerHTML = '';
  cgList._winners = winners;
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'cg-item';
    d.style.animationDelay = (i * 0.09) + 's';
    d.innerHTML = '<span class="cg-rar">★ 传说 ★</span><span class="cg-id id-tag"></span><b class="cg-nm"></b>';
    d.querySelector('.cg-id').textContent = 'NO.' + w.id;
    d.querySelector('.cg-nm').textContent = w.name;
    cgList.appendChild(d);
  });
  cgReveal.classList.add('active');
  cgFitList(winners.length, winners);
}

function stageClearReveal() {
  if (cgReveal) cgReveal.classList.remove('active');
}

function onResetHook() {
  if (cgReveal) cgReveal.classList.remove('active');
  if (cgCrate) cgCrate.classList.remove('open');
  if (cgList) { cgList.innerHTML = ''; cgList._winners = []; }
  cgLanded = false;
  cgImpact = 0;
  cgSmoke = [];
  cgHudText();
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(16,185,129,.26), rgba(250,204,21,.14))';
  el.style.border = '1px solid rgba(16,185,129,.6)';
  el.style.color = '#a7f3d0';
}
