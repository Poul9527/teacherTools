/* ── 欢乐扭蛋机点名 · 舞台脚本 ─────────────────────────────────────── */

var ggScene = TC.$('#gg-scene');
var ggMachine = TC.$('#gg-machine');
var ggDome = TC.$('#gg-dome');
var ggKnob = TC.$('#gg-knob');
var ggSlot = TC.$('#gg-slot');
var ggCv = TC.$('#gg-ball');
var ggCtx = ggCv ? ggCv.getContext('2d') : null;
var ggGold = TC.$('#gg-gold');
var ggGoldNm = TC.$('#gg-gold-nm');
var ggReveal = TC.$('#gg-reveal');
var ggBox = TC.$('#gg-rv-box');

var GG_PAIRS = [
  ['#fda4af', '#f43f5e'], ['#fcd34d', '#f59e0b'], ['#a7f3d0', '#10b981'],
  ['#bae6fd', '#0ea5e9'], ['#ddd6fe', '#8b5cf6'], ['#fbcfe8', '#ec4899'],
  ['#fed7aa', '#f97316'], ['#c7d2fe', '#6366f1']
];

var ggEggs = [];
var ggR = 0, ggCX = 0, ggCY = 0, ggEggR = 12, ggW = 0, ggH = 0, ggDpr = 1;
var ggAgit = 0, ggAgitTar = 0, ggRaf = null;
var ggTimer = null, ggT0 = 0;
var ggFlying = false, ggPending = false, ggSafe = null, ggFlyRaf = null;

/* ---------- 玻璃球仓尺寸 ---------- */
function ggResize() {
  if (!ggCv || !ggCtx || !ggDome) return;
  var w = ggDome.clientWidth, h = ggDome.clientHeight;
  if (w <= 0 || h <= 0) return;
  ggDpr = Math.min(window.devicePixelRatio || 1, 2);
  ggCv.width = Math.round(w * ggDpr);
  ggCv.height = Math.round(h * ggDpr);
  ggCtx.setTransform(ggDpr, 0, 0, ggDpr, 0, 0);
  ggW = w; ggH = h;
  ggCX = w / 2; ggCY = h / 2;
  ggR = Math.min(ggCX, ggCY) - 2;
  ggEggR = ggR * Math.min(0.170, 0.82 / Math.sqrt(Math.max(1, ggEggs.length)));
  for (var i = 0; i < ggEggs.length; i++) {
    var e = ggEggs[i];
    e.r = ggEggR * e.rs;
    var dx = e.x - ggCX, dy = e.y - ggCY;
    var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
    var max = ggR - e.r;
    if (d > max) { e.x = ggCX + dx / d * max; e.y = ggCY + dy / d * max; }
  }
}

/* ---------- 建蛋 ---------- */
function ggBuild() {
  ggEggs = [];
  var list = TC.students || [];
  var n = Math.min(list.length, 60);
  for (var i = 0; i < n; i++) {
    var pair = GG_PAIRS[i % GG_PAIRS.length];
    var name = list[i].name || '';
    ggEggs.push({
      s: list[i],
      x: 0, y: 0,
      vx: TC.rand(-1.2, 1.2), vy: TC.rand(-0.6, 1.4),
      r: 12, rs: 0.92 + Math.random() * 0.16,
      rot: Math.random() * 6.2832, vr: TC.rand(-0.08, 0.08),
      c1: pair[0], c2: pair[1],
      txt: name.length > 1 ? name.slice(-2) : (name || '?')
    });
  }
  ggResize();
  /* 黄金角撒点，一开始就不重叠 */
  for (var k = 0; k < ggEggs.length; k++) {
    var e = ggEggs[k];
    var ang = k * 2.39996;
    var rad = Math.sqrt((k + 0.5) / Math.max(1, ggEggs.length)) * (ggR - e.r - 3) * 0.92;
    e.x = ggCX + Math.cos(ang) * rad;
    e.y = ggCY + Math.sin(ang) * rad * 0.92 - ggR * 0.08;
    if (e.y < ggCY - ggR + e.r) e.y = ggCY - ggR + e.r + 2;
  }
}

/* ---------- 物理：重力 + 圆仓反弹 + 蛋间斥力 ---------- */
function ggStep() {
  var n = ggEggs.length;
  if (!n) return;
  ggAgit += (ggAgitTar - ggAgit) * 0.07;
  var g = 0.40 + ggAgit * 0.30;
  var rest = 0.58 + ggAgit * 0.36;
  var i, j, e, a, b;

  for (i = 0; i < n; i++) {
    e = ggEggs[i];
    e.vy += g;
    if (ggAgit > 0.02) {
      e.vx += (Math.random() - 0.5) * 5.0 * ggAgit;
      e.vy += (Math.random() - 0.5) * 6.0 * ggAgit - 1.4 * ggAgit;
      e.vr += (Math.random() - 0.5) * 0.36 * ggAgit;
    }
    var damp = 0.984 + ggAgit * 0.010;
    e.vx *= damp; e.vy *= damp; e.vr *= damp;
    e.x += e.vx; e.y += e.vy;
    e.rot += e.vr;

    var dx = e.x - ggCX, dy = e.y - ggCY;
    var d = Math.sqrt(dx * dx + dy * dy) || 0.001;
    var max = ggR - e.r;
    if (d > max) {
      var nx = dx / d, ny = dy / d;
      e.x = ggCX + nx * max; e.y = ggCY + ny * max;
      var vn = e.vx * nx + e.vy * ny;
      if (vn > 0) {
        e.vx -= (1 + rest) * vn * nx;
        e.vy -= (1 + rest) * vn * ny;
        e.vr += (Math.random() - 0.5) * 0.16;
      }
    }
  }

  for (i = 0; i < n; i++) {
    a = ggEggs[i];
    for (j = i + 1; j < n; j++) {
      b = ggEggs[j];
      var ddx = b.x - a.x, ddy = b.y - a.y;
      var dd = Math.sqrt(ddx * ddx + ddy * ddy) || 0.001;
      var min = a.r + b.r;
      if (dd < min) {
        var ox = ddx / dd, oy = ddy / dd;
        var push = (min - dd) * 0.5;
        a.x -= ox * push; a.y -= oy * push;
        b.x += ox * push; b.y += oy * push;
        var rvx = b.vx - a.vx, rvy = b.vy - a.vy;
        var vn2 = rvx * ox + rvy * oy;
        if (vn2 < 0) {
          var imp = -(1 + 0.72) * vn2 / 2;
          a.vx -= imp * ox; a.vy -= imp * oy;
          b.vx += imp * ox; b.vy += imp * oy;
          a.vr -= imp * 0.02; b.vr += imp * 0.02;
        }
      }
    }
  }

  for (i = 0; i < n; i++) {
    e = ggEggs[i];
    e.vx = TC.clamp(e.vx, -34, 34);
    e.vy = TC.clamp(e.vy, -34, 34);
    e.vr = TC.clamp(e.vr, -0.7, 0.7);
    /* 蛋间斥力可能把蛋挤出仓壁，最后统一贴回玻璃球内壁 */
    var bx = e.x - ggCX, by = e.y - ggCY;
    var bd = Math.sqrt(bx * bx + by * by) || 0.001;
    var bm = ggR - e.r;
    if (bd > bm) { e.x = ggCX + bx / bd * bm; e.y = ggCY + by / bd * bm; }
  }
}

/* ---------- 绘制：带高光的双色小蛋 ---------- */
function ggDraw() {
  if (!ggCtx) return;
  var ctx = ggCtx;
  ctx.clearRect(0, 0, ggW, ggH);
  for (var i = 0; i < ggEggs.length; i++) {
    var e = ggEggs[i];
    var rx = e.r * 0.84;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.rot);
    var lg = ctx.createLinearGradient(0, -e.r, 0, e.r);
    lg.addColorStop(0, e.c1);
    lg.addColorStop(0.47, e.c1);
    lg.addColorStop(0.53, e.c2);
    lg.addColorStop(1, e.c2);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, e.r, 0, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,8,20,.20)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.30, -e.r * 0.38, rx * 0.26, e.r * 0.22, -0.45, 0, 6.2832);
    ctx.fill();
    ctx.restore();

    if (e.r >= 9) {
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = 'rgba(50,10,24,.74)';
      ctx.font = '900 ' + Math.round(e.r * 0.68) + 'px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.txt, 0, 0);
      ctx.restore();
    }
  }
}

function ggLoop() {
  ggRaf = requestAnimationFrame(ggLoop);
  if (!ggCtx || ggW <= 0 || !ggEggs.length) return;
  ggStep();
  ggDraw();
}

/* ---------- 摇人 ---------- */
function ggTick() {
  var pr = Math.min(1, (Date.now() - ggT0) / 2600);
  TC.Music.sfxRoll(pr);
  if (Math.random() < 0.3) TC.Music.sfxClick();
}

/* ---------- 金色特制蛋：滚出 → 爆裂 ---------- */
function ggCancelFly() {
  ggFlying = false;
  ggPending = false;
  if (ggSafe) { clearTimeout(ggSafe); ggSafe = null; }
  if (ggGold) {
    ggGold.classList.remove('show');
    ggGold.style.transition = 'none';
    ggGold.style.opacity = '';
    ggGold.style.transform = 'translate(-50%,-50%)';
  }
}

function ggLaunch(w) {
  if (!ggGold || !ggScene) { ggOpenReveal(); return; }
  var st = ggScene.getBoundingClientRect();
  var sr = ggSlot ? ggSlot.getBoundingClientRect() : null;
  var sx = sr ? (sr.left - st.left + sr.width / 2) : st.width * 0.42;
  var sy = sr ? (sr.top - st.top + sr.height / 2) : st.height * 0.62;
  var ex = st.width * 0.5, ey = st.height * 0.84;

  ggGold.classList.add('show');
  if (ggGoldNm) ggGoldNm.textContent = (w && w.name) ? w.name : '?';
  ggGold.style.transition = 'none';
  ggGold.style.opacity = '';

  ggFlying = true;
  var T0 = Date.now(), DUR = 900;
  var arc = st.height * 0.10;

  function fly() {
    ggFlyRaf = null;
    if (!ggFlying) return;
    var t = Math.min(1, (Date.now() - T0) / DUR);
    var e = t * t * (3 - 2 * t);
    var x = sx + (ex - sx) * e;
    var y = sy + (ey - sy) * e - Math.sin(Math.PI * t) * arc;
    ggGold.style.transform =
      'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' +
      'translate(-50%,-50%) rotate(' + (t * 780).toFixed(0) + 'deg)';
    if (t < 1) ggFlyRaf = requestAnimationFrame(fly);
    else ggBoom(ex, ey);
  }
  ggFlyRaf = requestAnimationFrame(fly);
  if (ggSafe) clearTimeout(ggSafe);
  ggSafe = setTimeout(function () { if (ggFlying) ggBoom(ex, ey); }, DUR + 260);
}

function ggBoom(x, y) {
  ggFlying = false;
  if (ggSafe) { clearTimeout(ggSafe); ggSafe = null; }
  if (ggFlyRaf) { cancelAnimationFrame(ggFlyRaf); ggFlyRaf = null; }
  var st = ggScene ? ggScene.getBoundingClientRect() : null;
  var cx = st ? st.left + x : window.innerWidth / 2;
  var cy = st ? st.top + y : window.innerHeight * 0.6;

  if (ggGold) {
    ggGold.style.transition = 'transform .28s cubic-bezier(.2,1.4,.5,1), opacity .28s ease-out';
    ggGold.style.transform =
      'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) scale(1.9)';
    ggGold.style.opacity = '0';
    setTimeout(function () {
      if (!ggGold) return;
      ggGold.classList.remove('show');
      ggGold.style.transition = 'none';
      ggGold.style.opacity = '';
      ggGold.style.transform = 'translate(-50%,-50%)';
    }, 300);
  }

  TC.FX.confetti(cx, cy, 110, ['#f43f5e', '#fbbf24', '#38bdf8', '#a7f3d0', '#ffffff', '#ec4899']);
  TC.FX.emojiBurst(cx, cy, ['✨', '🎉', '⭐', '🎊', '🍬'], 16);
  TC.FX.sparks(cx, cy, 46, '#fde047');
  TC.FX.ring(cx, cy, '#fbbf24', 0, 3);
  TC.FX.flash('#fbbf24', 0.20);
  TC.FX.shake(1);

  if (ggPending) { ggPending = false; ggOpenReveal(); }
}

/* ---------- 揭晓浮层 ---------- */
function ggOpenReveal() {
  if (!ggReveal) return;
  ggReveal.classList.add('active');
  ggLayoutReveal();
}

function ggLayoutReveal() {
  if (!ggBox) return;
  var cards = ggBox.children;
  if (!cards.length) return;
  var r = TC.autoFitGrid(ggBox, cards.length, {
    gap: 12, ratio: 0.66, minW: 150, maxW: 440, maxH: 320
  });
  if (!r) return;
  for (var i = 0; i < cards.length; i++) {
    var nm = cards[i].querySelector('.gc-nm');
    if (!nm) continue;
    var len = (nm.textContent || '').length || 1;
    var fs = Math.max(16, Math.min(r.cw * 0.40, (r.cw * 0.90) / len));
    nm.style.fontSize = fs + 'px';
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  ggResize();
  ggBuild();
  if (!ggRaf) ggRaf = requestAnimationFrame(ggLoop);
  window.addEventListener('resize', ggResize);
}

function stageLayout() {
  ggResize();
  if (ggReveal && ggReveal.classList.contains('active')) ggLayoutReveal();
}

function stageStartRoll() {
  ggCancelFly();
  if (ggReveal) ggReveal.classList.remove('active');
  ggAgitTar = 1;
  ggT0 = Date.now();
  if (ggMachine) ggMachine.classList.add('on');
  if (ggKnob) ggKnob.classList.add('on');
  if (!ggTimer) ggTimer = setInterval(ggTick, 80);
}

function stageStopRoll(winners) {
  if (ggTimer) { clearInterval(ggTimer); ggTimer = null; }
  ggAgitTar = 0;
  if (ggMachine) ggMachine.classList.remove('on');
  if (ggKnob) ggKnob.classList.remove('on');
  var w = (winners && winners[0]) ? winners[0] : null;
  ggPending = true;
  ggLaunch(w);
}

function revealWinners(winners) {
  if (!ggBox || !ggReveal) return;
  ggBox.innerHTML = '';
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'gg-card';
    d.style.animationDelay = (i * 0.09) + 's';
    d.innerHTML = '<div class="gc-egg">🥚</div><div class="gc-nm"></div><div class="gc-id id-tag"></div>';
    d.querySelector('.gc-nm').textContent = w.name;
    d.querySelector('.gc-id').textContent = 'NO.' + w.id;
    ggBox.appendChild(d);
  });
  if (!ggFlying) { ggPending = false; ggOpenReveal(); }
}

function stageClearReveal() {
  if (ggReveal) ggReveal.classList.remove('active');
  ggPending = false;
}

function onResetHook() {
  if (ggReveal) ggReveal.classList.remove('active');
  if (ggTimer) { clearInterval(ggTimer); ggTimer = null; }
  ggCancelFly();
  ggAgitTar = 0;
  ggAgit = 0;
  if (ggMachine) ggMachine.classList.remove('on');
  if (ggKnob) ggKnob.classList.remove('on');
  ggBuild();
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(244,63,94,.28), rgba(251,191,36,.28))';
  el.style.border = '1px solid rgba(251,191,36,.62)';
  el.style.color = '#ffe9b8';
  el.style.boxShadow = '0 0 14px rgba(244,63,94,.45)';
}
