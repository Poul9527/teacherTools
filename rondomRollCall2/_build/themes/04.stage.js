/* ── 神秘翻牌盲盒 · 舞台脚本 ───────────────────────────────────────── */

var cbMatrix = TC.$('#card-matrix');
var cbCursor = null;
var cbReveal = TC.$('#cb-reveal');
var cbNames = TC.$('#cb-names');

var cbCards = [], cbCursorIdx = -1, cbTimer = null, cbRollT0 = 0;
var cbRevealTimer = null, cbFlipDoneAt = 0, cbStep = 1;

/* ---------- 建卡牌矩阵 ---------- */
function buildCards() {
  if (!cbMatrix) return;
  cbMatrix.innerHTML = '';
  cbCards = [];

  cbCursor = document.createElement('div');
  cbCursor.className = 'cb-cursor';

  var list = TC.students;
  for (var i = 0; i < list.length; i++) {
    var el = document.createElement('div');
    el.className = 'card';
    el.innerHTML =
      '<div class="card-inner">' +
      '<div class="card-face card-back"><span class="rune">✦</span></div>' +
      '<div class="card-face card-front">' +
      '<span class="cid id-tag"></span><span class="cnm"></span>' +
      '</div></div>';
    el.querySelector('.cid').textContent = list[i].id;
    el.querySelector('.cnm').textContent = list[i].name;
    el.title = list[i].id + ' ' + list[i].name;
    cbMatrix.appendChild(el);
    cbCards.push({
      el: el, s: list[i],
      cid: el.querySelector('.cid'),
      cnm: el.querySelector('.cnm'),
      rune: el.querySelector('.rune')
    });
  }
  cbMatrix.appendChild(cbCursor);
  moveCursor(-1);
  layoutCards();
}

/* ★ 关键：45 张牌也必须完整铺进舞台，不裁切、不滚动 */
function layoutCards() {
  if (!cbMatrix || !cbCards.length) return;
  var gap = Math.max(5, Math.min(9, cbMatrix.clientWidth / 150));
  var r = TC.autoFitGrid(cbMatrix, cbCards.length, {
    gap: gap, ratio: 1.3, minW: 46, maxW: 130, pad: 4
  });
  if (!r) return;
  /* 字号全部由 cw 推出来，换屏幕自动跟着变 */
  var fs = Math.max(9, Math.min(26, Math.round(r.cw / 4.6)));
  var idf = Math.max(7, Math.min(13, Math.round(r.cw / 8.6)));
  var rf = Math.max(9, Math.min(34, Math.round(r.cw * 0.30)));
  for (var i = 0; i < cbCards.length; i++) {
    var c = cbCards[i];
    c.cnm.style.fontSize = fs + 'px';
    c.cid.style.fontSize = idf + 'px';
    c.rune.style.fontSize = rf + 'px';
  }
  moveCursor(cbCursorIdx);
}

/* 光标环：贴住当前卡牌，只做 transform，不触发重排 */
function moveCursor(idx) {
  cbCursorIdx = idx;
  if (!cbCursor) return;
  if (idx < 0 || !cbCards[idx] || !cbMatrix) {
    cbCursor.style.opacity = '0';
    return;
  }
  var mr = cbMatrix.getBoundingClientRect();
  var cr = cbCards[idx].el.getBoundingClientRect();
  if (!cr.width) return;
  cbCursor.style.opacity = '';                 /* 交还给 .rolling 的样式表规则 */
  cbCursor.style.width = cr.width + 'px';
  cbCursor.style.height = cr.height + 'px';
  cbCursor.style.transform = 'translate(' + (cr.left - mr.left) + 'px,' +
    (cr.top - mr.top) + 'px)';
}

function cardOf(w) {
  for (var i = 0; i < cbCards.length; i++) {
    if (cbCards[i].s.id === w.id && cbCards[i].s.name === w.name) return cbCards[i];
  }
  return null;
}

function syncUsed() {
  var dim = TC.isNoRepeat();
  for (var i = 0; i < cbCards.length; i++) {
    var c = cbCards[i];
    if (!dim) { c.el.classList.remove('used'); continue; }
    var gone = TC.remain.indexOf(c.s) === -1 && TC.remain.length > 0;
    if (gone) c.el.classList.add('used'); else c.el.classList.remove('used');
  }
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  buildCards();
  syncUsed();
}

function stageLayout() {
  layoutCards();
}

function stageStartRoll() {
  if (cbRevealTimer) { clearTimeout(cbRevealTimer); cbRevealTimer = null; }
  if (cbReveal) cbReveal.classList.remove('active');
  if (cbMatrix) cbMatrix.classList.add('rolling');
  for (var i = 0; i < cbCards.length; i++) cbCards[i].el.classList.remove('hopping', 'won');

  var total = cbCards.length;
  if (!total) return;
  /* 固定步长光标：沿固定路径推进，只切一个 class，绝不会抖动 */
  cbStep = Math.max(1, Math.round(total / 9));
  cbRollT0 = Date.now();
  if (cbTimer) clearInterval(cbTimer);
  cbTimer = setInterval(function () {
    var pr = Math.min(1, (Date.now() - cbRollT0) / 2600);
    if (cbCursorIdx >= 0 && cbCards[cbCursorIdx]) cbCards[cbCursorIdx].el.classList.remove('hopping');
    var guard = 0;
    do {
      cbCursorIdx = (cbCursorIdx + cbStep) % total;
      guard++;
    } while (cbCards[cbCursorIdx].el.classList.contains('flipped') && guard <= total);
    cbCards[cbCursorIdx].el.classList.add('hopping');
    moveCursor(cbCursorIdx);
    TC.Music.sfxRoll(pr);                     /* 每跳一次一声脉冲 */
  }, 84);
}

function stageStopRoll(winners) {
  if (cbTimer) { clearInterval(cbTimer); cbTimer = null; }
  if (cbMatrix) cbMatrix.classList.remove('rolling');
  if (cbCursorIdx >= 0 && cbCards[cbCursorIdx]) cbCards[cbCursorIdx].el.classList.remove('hopping');
  if (!winners || !winners.length) { moveCursor(-1); return; }

  cbFlipDoneAt = Date.now() + 200 + winners.length * 170 + 700;
  for (var i = 0; i < winners.length; i++) {
    (function (w, idx) {
      setTimeout(function () {
        var c = cardOf(w);
        if (!c) return;
        c.el.classList.remove('hopping');
        c.el.classList.add('flipped');
        var r = c.el.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        /* 命中光标停在它身上，再散开 */
        if (idx === 0) moveCursor(cbCards.indexOf(c));
        TC.Music.sfxFlip();
        TC.FX.sparks(cx, cy, 22, '#c084fc');
        TC.FX.ring(cx, cy, '#8b5cf6');
        TC.FX.emojiBurst(cx, cy, ['🃏', '✨', '🔮', '💜'], 8);
        if (idx === 0) TC.FX.stars(cx, cy, 14, '#e9d5ff');
        TC.FX.textPop('✦', cx, cy - r.height * 0.4, '#e9d5ff', Math.max(16, r.width * 0.4));
        setTimeout(function () {
          c.el.classList.add('won');
          TC.FX.sparks(cx, cy, 16, '#f0abfc');
        }, 640);
      }, 200 + idx * 170);
    })(winners[i], i);
  }
  setTimeout(function () { moveCursor(-1); }, 200 + winners.length * 170 + 300);
  syncUsed();
}

function revealWinners(winners) {
  if (cbRevealTimer) clearTimeout(cbRevealTimer);
  /* 先让卡牌优雅翻完，再弹浮层，不抢戏 */
  var wait = Math.max(0, Math.min(cbFlipDoneAt, Date.now() + 1500) - Date.now());
  cbRevealTimer = setTimeout(function () { showCardReveal(winners); }, wait);
}

function showCardReveal(winners) {
  if (!cbReveal) return;
  if (cbNames) cbNames.innerHTML = '';
  cbReveal.classList.add('active');            /* 先显示，autoFitGrid 才量得到尺寸 */
  for (var i = 0; i < winners.length; i++) {
    var d = document.createElement('div');
    d.className = 'cb-one';
    d.style.animationDelay = (i * 0.1) + 's';
    d.innerHTML = '<div class="cid2 id-tag"></div><div class="cnm2"></div>';
    d.querySelector('.cid2').textContent = 'No.' + winners[i].id;
    d.querySelector('.cnm2').textContent = winners[i].name;
    cbNames.appendChild(d);
  }
  var r = TC.autoFitGrid(cbNames, winners.length, {
    gap: 12, ratio: 0.62, minW: 130, maxW: 460, pad: 6
  });
  if (r) {
    var fs = Math.max(20, Math.min(Math.round(r.cw * 0.30), 88));
    var kids = cbNames.children;
    for (var j = 0; j < kids.length; j++) {
      kids[j].querySelector('.cnm2').style.fontSize = fs + 'px';
      kids[j].querySelector('.cid2').style.fontSize = Math.max(10, Math.round(fs * 0.24)) + 'px';
    }
  }
}

function stageClearReveal() {
  if (cbRevealTimer) { clearTimeout(cbRevealTimer); cbRevealTimer = null; }
  if (cbReveal) cbReveal.classList.remove('active');
}

function onResetHook() {
  if (cbTimer) { clearInterval(cbTimer); cbTimer = null; }
  if (cbRevealTimer) { clearTimeout(cbRevealTimer); cbRevealTimer = null; }
  if (cbReveal) cbReveal.classList.remove('active');
  if (cbMatrix) cbMatrix.classList.remove('rolling');
  buildCards();
}

function themedPillStyle(el) {
  el.style.background = 'rgba(139,92,246,.22)';
  el.style.border = '1px solid rgba(192,132,252,.68)';
  el.style.color = '#e9d5ff';
}
