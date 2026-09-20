/* ── 星空银河点名 · 舞台脚本 ───────────────────────────────────────── */

var stage = TC.$('.tc-stage');
var field = TC.$('#star-field');
var comet = TC.$('#comet');
var reveal = TC.$('#gx-reveal');
var namesBox = TC.$('#gx-names');
var nodes = [];
var hopTimer = null, hopIdx = -1;

/* ---------- 背景：星云 + 视差星海 + 流星 ---------- */
var sky = TC.$('#sky-bg'), sctx = sky.getContext('2d');
var bgStars = [], bgShoot = [], constel = [], bgRaf = null, bgT = 0;

function skyResize() {
  if (!sky) return;
  var w = sky.parentElement.clientWidth, h = sky.parentElement.clientHeight;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  sky.width = w * dpr; sky.height = h * dpr;
  sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var n = Math.round(w * h / 5200);
  bgStars = [];
  for (var i = 0; i < n; i++) {
    var depth = Math.random();
    bgStars.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.4 + depth * 1.7, d: depth,
      ph: Math.random() * 6.28, sp: 0.006 + Math.random() * 0.02,
      hue: Math.random() < 0.16 ? 'rgba(186,230,253,' : (Math.random() < 0.3 ? 'rgba(196,181,253,' : 'rgba(255,255,255,')
    });
  }
}

function spawnShooter(w, h) {
  bgShoot.push({
    x: Math.random() * w * 1.2 - w * 0.1, y: -30,
    vx: -(3.4 + Math.random() * 3.2), vy: 2.2 + Math.random() * 2.0,
    life: 1, len: 90 + Math.random() * 130
  });
}

function skyLoop() {
  var w = sky.clientWidth, h = sky.clientHeight;
  bgT += 1;
  sctx.clearRect(0, 0, w, h);

  /* 星云光晕 */
  var nebulae = [
    [w * 0.22, h * 0.28, w * 0.44, 'rgba(76,29,149,.34)'],
    [w * 0.78, h * 0.22, w * 0.38, 'rgba(8,72,120,.34)'],
    [w * 0.52, h * 0.82, w * 0.50, 'rgba(88,28,135,.26)']
  ];
  for (var i = 0; i < nebulae.length; i++) {
    var nb = nebulae[i];
    var ox = Math.sin(bgT * 0.0016 + i) * w * 0.035;
    var oy = Math.cos(bgT * 0.0013 + i * 1.7) * h * 0.04;
    var grd = sctx.createRadialGradient(nb[0] + ox, nb[1] + oy, 0, nb[0] + ox, nb[1] + oy, nb[2]);
    grd.addColorStop(0, nb[3]);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grd;
    sctx.fillRect(0, 0, w, h);
  }

  /* 视差星海 */
  for (var k = 0; k < bgStars.length; k++) {
    var s = bgStars[k];
    s.ph += s.sp;
    var a = 0.30 + Math.abs(Math.sin(s.ph)) * (0.35 + s.d * 0.35);
    sctx.fillStyle = s.hue + a.toFixed(2) + ')';
    sctx.beginPath(); sctx.arc(s.x, s.y, s.r, 0, 6.284); sctx.fill();
    if (s.d > 0.86) {
      sctx.save();
      sctx.globalAlpha = a * 0.5;
      sctx.strokeStyle = '#fff'; sctx.lineWidth = 0.6;
      sctx.beginPath();
      sctx.moveTo(s.x - s.r * 3, s.y); sctx.lineTo(s.x + s.r * 3, s.y);
      sctx.moveTo(s.x, s.y - s.r * 3); sctx.lineTo(s.x, s.y + s.r * 3);
      sctx.stroke(); sctx.restore();
    }
  }

  /* 流星 */
  if (Math.random() < 0.006 && bgShoot.length < 4) spawnShooter(w, h);
  for (var m = bgShoot.length - 1; m >= 0; m--) {
    var sh = bgShoot[m];
    sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.006;
    if (sh.life <= 0 || sh.y > h + 60) { bgShoot.splice(m, 1); continue; }
    var ang = Math.atan2(sh.vy, sh.vx);
    var ex = sh.x - Math.cos(ang) * sh.len, ey = sh.y - Math.sin(ang) * sh.len;
    var lg = sctx.createLinearGradient(sh.x, sh.y, ex, ey);
    lg.addColorStop(0, 'rgba(255,255,255,' + (sh.life * 0.95).toFixed(2) + ')');
    lg.addColorStop(1, 'rgba(125,211,252,0)');
    sctx.strokeStyle = lg; sctx.lineWidth = 2.1; sctx.lineCap = 'round';
    sctx.beginPath(); sctx.moveTo(sh.x, sh.y); sctx.lineTo(ex, ey); sctx.stroke();
  }

  /* 中选者连成的星座 */
  for (var c = constel.length - 1; c >= 0; c--) {
    var L = constel[c];
    L.life -= 0.008;
    if (L.life <= 0) { constel.splice(c, 1); continue; }
    sctx.save();
    sctx.globalAlpha = Math.max(0, L.life) * 0.9;
    sctx.strokeStyle = '#fde047';
    sctx.lineWidth = 1.8;
    sctx.shadowBlur = 14; sctx.shadowColor = '#fde047';
    sctx.setLineDash([7, 6]);
    sctx.lineDashOffset = -(bgT * 0.7);
    sctx.beginPath();
    sctx.moveTo(L.a.x, L.a.y);
    sctx.lineTo(L.b.x, L.b.y);
    sctx.stroke();
    sctx.restore();
  }

  bgRaf = requestAnimationFrame(skyLoop);
}

/* ---------- 星图 ---------- */
function buildField() {
  if (!field) return;
  var list = TC.students;
  field.innerHTML = '';
  nodes = [];
  list.forEach(function (s, i) {
    var el = document.createElement('div');
    el.className = 'star-node';
    el.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
    el.innerHTML =
      '<span class="sd"></span>' +
      '<span class="sid id-tag"></span>' +
      '<span class="snm"></span>';
    el.querySelector('.sid').textContent = s.id;
    el.querySelector('.snm').textContent = s.name;
    el.title = s.id + ' ' + s.name;
    field.appendChild(el);
    nodes.push({ el: el, s: s });
  });
  layout();
  syncPicked();
}

function layout() {
  if (!field || !nodes.length) return;
  var r = TC.autoFitGrid(field, nodes.length, {
    gap: Math.max(5, Math.min(12, field.clientWidth / 130)),
    ratio: 0.80, minW: 54, maxW: 190
  });
  if (r) {
    /* 名字长的自动缩小字号，保证不溢出 */
    var fs = Math.max(10, Math.min(21, Math.round(r.cw / 4.4)));
    nodes.forEach(function (n) {
      n.el.querySelector('.snm').style.fontSize = fs + 'px';
      n.el.querySelector('.sid').style.fontSize = Math.max(8, Math.round(fs * 0.55)) + 'px';
    });
  }
}

function syncPicked() {
  if (TC.isNoRepeat()) {
    nodes.forEach(function (n) {
      var gone = TC.remain.indexOf(n.s) === -1 && TC.remain.length > 0;
      n.el.classList.toggle('dim', gone && !n.el.classList.contains('won'));
    });
  } else {
    nodes.forEach(function (n) { n.el.classList.remove('dim'); });
  }
}

function nodeOf(w) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].s.id === w.id && nodes[i].s.name === w.name) return nodes[i];
  }
  return null;
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  skyResize();
  buildField();
  if (!bgRaf) skyLoop();
  window.addEventListener('resize', skyResize);
}

function stageLayout() {
  skyResize();
  layout();
}

function stageStartRoll() {
  if (reveal) reveal.classList.remove('active');
  field.classList.add('rolling');
  nodes.forEach(function (n) { n.el.classList.remove('lit', 'won'); });
  var total = nodes.length;
  var t0 = Date.now();
  hopTimer = setInterval(function () {
    if (!total) return;
    if (hopIdx >= 0 && nodes[hopIdx]) nodes[hopIdx].el.classList.remove('lit');
    hopIdx = Math.floor(Math.random() * total);
    var n = nodes[hopIdx];
    n.el.classList.add('lit');
    var pr = Math.min(1, (Date.now() - t0) / 2600);
    TC.Music.sfxRoll(pr);
    /* 流星光标滑向当前星（以 .tc-stage 为定位基准） */
    var fr = stage.getBoundingClientRect(), nr = n.el.getBoundingClientRect();
    if (comet) {
      comet.style.transform =
        'translate(' + (nr.left - fr.left + nr.width / 2 - 7) + 'px,' +
        (nr.top - fr.top + nr.height / 2 - 7) + 'px)';
    }
    if (Math.random() < 0.09) {
      TC.FX.sparks(nr.left + nr.width / 2, nr.top + nr.height / 2, 3, '#7dd3fc');
    }
  }, 58);
}

function stageStopRoll(winners) {
  clearInterval(hopTimer); hopTimer = null;
  field.classList.remove('rolling');
  if (nodes[hopIdx]) nodes[hopIdx].el.classList.remove('lit');
  hopIdx = -1;
  if (comet) comet.style.opacity = '0';

  var pts = [];
  winners.forEach(function (w, i) {
    var n = nodeOf(w);
    if (!n) return;
    setTimeout(function () {
      n.el.classList.add('won');
      n.el.classList.remove('dim');
      var r = n.el.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      pts.push({ x: cx - sky.getBoundingClientRect().left, y: cy - sky.getBoundingClientRect().top });
      TC.FX.sparks(cx, cy, 34, '#fde047');
      TC.FX.ring(cx, cy, '#7dd3fc', 0);
      TC.FX.stars(cx, cy, 12, '#bae6fd');
      TC.FX.emojiBurst(cx, cy, ['⭐', '✨', '💫', '🌟'], 8);
      /* 星座连线 */
      if (pts.length > 1) constel.push({ a: pts[pts.length - 2], b: pts[pts.length - 1], life: 1 });
    }, i * 150);
  });
  syncPicked();
}

function revealWinners(winners) {
  if (!reveal) return;
  namesBox.innerHTML = '';
  winners.forEach(function (w, i) {
    var d = document.createElement('div');
    d.className = 'gx-one';
    d.style.animationDelay = (i * 0.11) + 's';
    d.innerHTML = '<div class="gid id-tag"></div><div class="gnm"></div>';
    d.querySelector('.gid').textContent = 'No.' + w.id;
    d.querySelector('.gnm').textContent = w.name;
    namesBox.appendChild(d);
  });
  reveal.classList.add('active');
}

function stageClearReveal() {
  if (reveal) reveal.classList.remove('active');
}

function onResetHook() {
  if (reveal) reveal.classList.remove('active');
  constel = [];
  buildField();
}

function themedPillStyle(el) {
  el.style.background = 'rgba(56,189,248,.16)';
  el.style.border = '1px solid rgba(125,211,252,.5)';
  el.style.color = '#bae6fd';
}
