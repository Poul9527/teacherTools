/* ── 幸运金蛋大锤敲 · 舞台脚本 ─────────────────────────────────────── */

var eggField = TC.$('#egg-field');
var eggScene = TC.$('#egg-scene');
var eggShelves = TC.$('#egg-shelves');
var sledge = TC.$('#gold-hammer');
var geReveal = TC.$('#ge-reveal');
var geNames = TC.$('#ge-names');

var EGG_GAP = 14;         /* 金蛋网格间距 */
var eggCells = [];        /* { el, egg, grp, ew, eh } */
var eggRollTimer = null, eggRollIdx = -1, eggRollT0 = 0;
var eggTimers = [];

/* ---------- 背景：飘落的金色亮片 ---------- */
var eggBg = TC.$('#egg-bg'), eggBgCtx = eggBg.getContext('2d');
var eggFlakes = [], eggBgRaf = null;
var GOLD = ['#ffe98a', '#f7c948', '#e0a10a', '#fff6cf', '#ef4444'];

function bgResize() {
  if (!eggBg) return;
  var w = eggBg.parentElement.clientWidth, h = eggBg.parentElement.clientHeight;
  if (!w || !h) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  eggBg.width = Math.floor(w * dpr); eggBg.height = Math.floor(h * dpr);
  eggBgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var n = Math.round(w * h / 9000);
  eggFlakes = [];
  for (var i = 0; i < n; i++) {
    eggFlakes.push({
      x: Math.random() * w, y: Math.random() * h,
      w: 2.5 + Math.random() * 6,
      vy: 0.30 + Math.random() * 0.95,
      ph: Math.random() * 6.28, sw: 0.24 + Math.random() * 0.85,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.07,
      c: GOLD[Math.floor(Math.random() * GOLD.length)],
      a: 0.22 + Math.random() * 0.55
    });
  }
}

function bgLoop() {
  if (!eggBg) return;
  var w = eggBg.clientWidth, h = eggBg.clientHeight;
  eggBgCtx.clearRect(0, 0, w, h);
  /* 台面暖光 */
  var gr = eggBgCtx.createRadialGradient(w * 0.5, h * 0.62, 0, w * 0.5, h * 0.62, w * 0.55);
  gr.addColorStop(0, 'rgba(190,60,30,.28)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  eggBgCtx.fillStyle = gr;
  eggBgCtx.fillRect(0, 0, w, h);

  for (var i = 0; i < eggFlakes.length; i++) {
    var f = eggFlakes[i];
    f.y += f.vy; f.ph += 0.022; f.rot += f.vr;
    f.x += Math.sin(f.ph) * f.sw;
    if (f.y > h + 16) { f.y = -16; f.x = Math.random() * w; }
    if (f.x < -24) f.x = w + 18; else if (f.x > w + 24) f.x = -18;
    eggBgCtx.save();
    eggBgCtx.translate(f.x, f.y);
    eggBgCtx.rotate(f.rot);
    eggBgCtx.globalAlpha = f.a;
    eggBgCtx.fillStyle = f.c;
    eggBgCtx.fillRect(-f.w / 2, -f.w / 4, f.w, f.w * 0.55);
    eggBgCtx.restore();
  }
  eggBgRaf = requestAnimationFrame(bgLoop);
}

/* ---------- 金蛋阵列 ---------- */
function buildEggs() {
  if (!eggField) return;
  clearAllTimers();
  eggRollIdx = -1;
  eggField.innerHTML = '';
  eggField.classList.remove('rolling');
  eggCells = [];

  var list = TC.students || [];
  var n = Math.min(list.length, 12);   /* 蛋数封顶 12：一个蛋对应一批学生 */
  var i, k;
  var groups = [];
  for (i = 0; i < n; i++) groups.push([]);
  for (k = 0; k < list.length; k++) groups[k % n].push(list[k]);

  for (i = 0; i < n; i++) {
    var cell = document.createElement('div');
    cell.className = 'egg-cell';
    cell.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';

    var shadow = document.createElement('span');
    shadow.className = 'eshadow';

    var egg = document.createElement('div');
    egg.className = 'egg';
    egg.innerHTML = '<span class="en"></span>';
    egg.querySelector('.en').textContent = groups[i].length + '人';

    cell.appendChild(shadow);
    cell.appendChild(egg);
    eggField.appendChild(cell);
    eggCells.push({ el: cell, egg: egg, grp: groups[i], ew: 60, eh: 76 });
  }
  layout();
  syncPicked();
}

function layout() {
  if (!eggField || !eggCells.length) return;
  var r = TC.autoFitGrid(eggField, eggCells.length, { gap: EGG_GAP, ratio: 1.15, minW: 72, maxW: 200 });
  if (!r) return;
  /* 蛋尺寸由单元格反推：宽不超列宽、高不超行高，永远不出屏（蛋 宽:高 = 0.8） */
  var eh = Math.max(26, Math.min(r.ch * 0.96, r.cw * 1.16));
  var ew = eh * 0.80;
  var i;
  for (i = 0; i < eggCells.length; i++) {
    var c = eggCells[i];
    c.ew = ew; c.eh = eh;
    c.egg.style.width = ew.toFixed(1) + 'px';
    c.egg.style.height = eh.toFixed(1) + 'px';
    c.egg.style.fontSize = eh.toFixed(1) + 'px';
    var sh = c.el.querySelector('.eshadow');
    if (sh) sh.style.height = Math.max(4, eh * 0.13).toFixed(1) + 'px';
  }
  if (sledge) {
    sledge.style.width = (ew * 0.96).toFixed(1) + 'px';
    sledge.style.height = (eh * 1.75).toFixed(1) + 'px';
  }
  buildShelves(r, ew, eh);
}

/* 按 autoFitGrid 排出的行位置，给每一排金蛋铺一条丝绒长台面 */
function buildShelves(r, ew, eh) {
  if (!eggShelves || !eggScene || !eggField) return;
  eggShelves.innerHTML = '';
  var fr = eggField.getBoundingClientRect();
  var sr = eggScene.getBoundingClientRect();
  if (!fr.height) return;
  var n = eggCells.length;
  var rows = Math.ceil(n / r.cols);
  var totalH = rows * r.ch + (rows - 1) * EGG_GAP;
  /* .fit-grid 是 align-content:end，整块网格贴着舞台区域底边 */
  var gridTop = fr.height - totalH;
  var shelfH = Math.max(7, Math.min(eh * 0.30, r.ch * 0.24));
  for (var i = 0; i < rows; i++) {
    var rowBottom = gridTop + (i + 1) * r.ch + i * EGG_GAP;
    var sh = document.createElement('div');
    sh.className = 'egg-shelf';
    sh.style.left = (fr.left - sr.left).toFixed(1) + 'px';
    sh.style.width = fr.width.toFixed(1) + 'px';
    sh.style.height = shelfH.toFixed(1) + 'px';
    sh.style.top = (fr.top - sr.top + rowBottom - shelfH * 0.50).toFixed(1) + 'px';
    eggShelves.appendChild(sh);
  }
}

function syncPicked() {
  if (!eggCells.length) return;
  var noRep = TC.isNoRepeat();
  for (var i = 0; i < eggCells.length; i++) {
    var c = eggCells[i], alive = 0;
    for (var j = 0; j < c.grp.length; j++) {
      if (TC.remain.indexOf(c.grp[j]) > -1) alive++;
    }
    var gone = noRep && TC.remain.length > 0 && alive === 0;
    c.el.classList[gone ? 'add' : 'remove']('dim');
  }
}

function cellOf(w) {
  for (var i = 0; i < eggCells.length; i++) {
    var g = eggCells[i].grp;
    for (var j = 0; j < g.length; j++) {
      if (g[j].id === w.id && g[j].name === w.name) return eggCells[i];
    }
  }
  return null;
}

/* ---------- 大锤定位：把柄尾对准目标蛋的右下方 ---------- */
function hammerMoveTo(c, rot) {
  if (!sledge || !eggScene || !c) return;
  var sr = eggScene.getBoundingClientRect();
  var cr = c.el.getBoundingClientRect();
  var cx = cr.left - sr.left + cr.width / 2;
  var cy = cr.top - sr.top + cr.height / 2;
  var px = cx + c.ew * 0.42;
  var py = cy + c.eh * 1.10;
  var hw = sledge.offsetWidth, hh = sledge.offsetHeight;
  sledge.style.transform =
    'translate(' + (px - hw / 2).toFixed(1) + 'px,' + (py - hh * 0.96).toFixed(1) + 'px)' +
    ' rotate(' + rot + 'deg)';
}

/* ---------- 砸蛋 ---------- */
function spawnShards(c) {
  var n = 6, i;
  for (i = 0; i < n; i++) {
    var sh = document.createElement('div');
    sh.className = 'shard';
    var ang = (i / n) * 6.283 + Math.random() * 0.6;
    var dist = 55 + Math.random() * 95;
    sh.style.setProperty('--tx', (Math.cos(ang) * dist).toFixed(1) + 'px');
    sh.style.setProperty('--ty', (Math.sin(ang) * dist - 34).toFixed(1) + 'px');
    sh.style.setProperty('--rot', Math.round((Math.random() - 0.5) * 760) + 'deg');
    sh.style.width = (c.ew * 0.36).toFixed(1) + 'px';
    sh.style.height = (c.eh * 0.32).toFixed(1) + 'px';
    c.el.appendChild(sh);
    (function (el) {
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
    })(sh);
  }
}

function smash(c) {
  if (!c) return;
  c.egg.classList.add('cracked');
  var r = c.el.getBoundingClientRect();
  var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  spawnShards(c);
  TC.FX.sparks(cx, cy, 40, '#ffe066');
  TC.FX.confetti(cx, cy, 48, ['#ffd54a', '#eab308', '#ef4444', '#fff6cf']);
  TC.FX.emojiBurst(cx, cy, ['🪙', '💰', '✨', '🎉', '🥚'], 12);
  TC.FX.ring(cx, cy, '#ffe066', 0, 3);
  TC.FX.textPop('碎！', cx, cy - r.height * 0.42, '#ffe066', 34);
  TC.FX.flash('#ffd54a', 0.22);
  TC.FX.shake(1);
  var ac = TC.Music.init();
  if (ac) {
    TC.Music.crash(ac.currentTime, 1.0);
    TC.Music.kick(ac.currentTime, 1.25);
    TC.Music.whoosh(ac.currentTime, 0.28, 1.0);
  }
}

function later(fn, ms) {
  var id = setTimeout(function () { fn(); }, ms);
  eggTimers.push(id);
  return id;
}

function clearAllTimers() {
  if (eggRollTimer) { clearInterval(eggRollTimer); eggRollTimer = null; }
  for (var i = 0; i < eggTimers.length; i++) clearTimeout(eggTimers[i]);
  eggTimers = [];
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  bgResize();
  buildEggs();
  if (!eggBgRaf) bgLoop();
  window.addEventListener('resize', bgResize);
}

function stageLayout() {
  bgResize();
  layout();
}

function stageStartRoll() {
  if (geReveal) geReveal.classList.remove('active');
  if (!eggCells.length) return;
  clearAllTimers();
  eggField.classList.add('rolling');
  for (var i = 0; i < eggCells.length; i++) {
    var c = eggCells[i];
    c.el.classList.remove('lit', 'won');
    c.egg.classList.remove('cracked');
    c.egg.style.opacity = '';
    var olds = c.el.querySelectorAll('.shard');
    for (var s = 0; s < olds.length; s++) c.el.removeChild(olds[s]);
  }
  if (sledge) sledge.classList.add('on');
  eggRollT0 = Date.now();
  var total = eggCells.length;

  eggRollTimer = setInterval(function () {
    if (eggRollIdx > -1 && eggCells[eggRollIdx]) eggCells[eggRollIdx].el.classList.remove('lit');
    var next;
    if (total > 1) {
      next = eggRollIdx;
      while (next === eggRollIdx) next = Math.floor(Math.random() * total);
    } else next = 0;
    eggRollIdx = next;
    var c = eggCells[eggRollIdx];
    c.el.classList.add('lit');
    hammerMoveTo(c, -70 + Math.random() * 22);
    var pr = Math.min(1, (Date.now() - eggRollT0) / 2800);
    TC.Music.sfxRoll(pr);
    var r = c.el.getBoundingClientRect();
    if (Math.random() < 0.24) TC.FX.sparks(r.left + r.width / 2, r.top + r.height * 0.45, 3, '#ffe066');
  }, 92);
}

function stageStopRoll(winners) {
  clearAllTimers();
  if (!eggCells.length) return;
  eggField.classList.remove('rolling');
  if (eggRollIdx > -1 && eggCells[eggRollIdx]) eggCells[eggRollIdx].el.classList.remove('lit');
  eggRollIdx = -1;

  /* 中选者所在的蛋就是被砸的那一枚 */
  var primary = null;
  for (var i = 0; i < winners.length && !primary; i++) primary = cellOf(winners[i]);
  if (!primary) primary = eggCells[Math.floor(Math.random() * eggCells.length)];

  var ac = TC.Music.init();
  if (ac) TC.Music.gong(ac.currentTime + 0.16, 1.2);

  if (sledge) sledge.classList.add('on');
  primary.el.classList.add('lit');
  hammerMoveTo(primary, -70);
  later(function () { hammerMoveTo(primary, 15); }, 200);   /* 抡下 */
  later(function () { smash(primary); }, 292);              /* 命中 */
  later(function () { hammerMoveTo(primary, -14); }, 380);  /* 回弹 */
  later(function () { if (sledge) sledge.classList.remove('on'); }, 780);

  /* 其它中选者所在的蛋同步点亮 */
  for (var k = 0; k < winners.length; k++) {
    (function (w, idx) {
      var c = cellOf(w);
      if (!c || c === primary) return;
      later(function () {
        c.el.classList.add('won');
        c.el.classList.remove('dim');
        var r = c.el.getBoundingClientRect();
        TC.FX.sparks(r.left + r.width / 2, r.top + r.height / 2, 16, '#ffe066');
        TC.FX.stars(r.left + r.width / 2, r.top + r.height / 2, 6, '#ffd54a');
      }, 430 + idx * 130);
    })(winners[k], k);
  }
  syncPicked();
}

function revealWinners(winners) {
  if (!geReveal) return;
  geNames.innerHTML = '';
  for (var i = 0; i < winners.length; i++) {
    var w = winners[i];
    var d = document.createElement('div');
    d.className = 'ge-one';
    d.style.animationDelay = (0.46 + i * 0.11).toFixed(2) + 's';
    d.innerHTML = '<div class="gid id-tag"></div><div class="gnm"></div>';
    d.querySelector('.gid').textContent = 'No.' + w.id;
    d.querySelector('.gnm').textContent = w.name;
    geNames.appendChild(d);
  }
  geReveal.classList.add('active');
}

function stageClearReveal() {
  if (geReveal) geReveal.classList.remove('active');
}

function onResetHook() {
  if (geReveal) geReveal.classList.remove('active');
  if (sledge) sledge.classList.remove('on');
  buildEggs();
}

function themedPillStyle(el) {
  el.style.background = 'linear-gradient(135deg, rgba(234,179,8,.24), rgba(239,68,68,.22))';
  el.style.border = '1px solid rgba(234,179,8,.62)';
  el.style.color = '#ffe98a';
}
