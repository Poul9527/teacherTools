module.exports = {
  dir: '04-神秘翻牌盲盒点名',
  title: '神秘翻牌盲盒',
  badge: '3D卡牌版',
  icon: '🃏',
  accent: '#8b5cf6',
  accent2: '#c084fc',
  color: '#1a0b2e',
  historyTitle: '本轮翻开的卡牌',
  desc: '一整面神秘卡牌在紫色星雾里静静悬浮，牌背符文忽明忽暗。点名瞬间，一道紫色光标在牌阵中疾速跳跃，被它咬住的那张牌缓缓立体翻转、放大浮起，学号和姓名在光晕中亮起。',
  tags: ['3D翻牌', '卡牌矩阵', '符文', '盲盒'],
  musicNote: '神秘悬疑小调：三角波铺底 + 心跳式低鼓，92 BPM 慢慢逼近',

  music: {
    bpm: 92,
    root: 45,
    stepsPerBar: 16,
    chords: [[0, 3, 7, 10], [-2, 1, 5, 8], [-4, 0, 3, 7], [-5, -1, 2, 7]],
    pad: { wave: 'triangle', vol: 0.055, oct: 1, dur: 1.06, atk: 0.60, cut: 1900 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 0, 0], oct: 0, vol: 0.070, wave: 'sine', dur: 6, cut: 300 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'triangle', vol: 0.032, oct: 2, dur: 1.6 },
    lead: null,
    drums: 'heart',
    drumVol: 0.5,
    swing: 0,
    reverb: 0.5,
    delay: 0.32,
    bells: true
  },
  sfx: { win: 'chime' },

  css: `
:root{
  --accent:#8b5cf6;
  --accent2:#c084fc;
  --bg: radial-gradient(circle at 50% 0%, #2e1065 0%, #170a2b 46%, #06010f 100%);
  --panel: rgba(26,11,46,.82);
  --border: rgba(139,92,246,.28);
  --glow: rgba(139,92,246,.55);
}

.cb-stage{ position:absolute; inset:0; overflow:hidden; }
/* 星雾 */
.cb-stage::before{
  content:''; position:absolute; inset:-12%; pointer-events:none;
  background:
    radial-gradient(circle at 18% 22%, rgba(124,58,237,.26), transparent 42%),
    radial-gradient(circle at 82% 74%, rgba(192,132,252,.20), transparent 44%),
    radial-gradient(circle at 50% 108%, rgba(76,29,149,.30), transparent 52%);
  animation: cbFog 16s ease-in-out infinite alternate;
}
@keyframes cbFog{ from{ transform: translate3d(-1.5%,-1%,0) scale(1); } to{ transform: translate3d(1.5%,1.5%,0) scale(1.05); } }
.cb-stage::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 50% 46%, rgba(192,132,252,.14), transparent 62%);
}

/* ---------- 卡牌矩阵：位置/尺寸完全由 autoFitGrid 决定 ---------- */
.card-matrix{
  position:absolute; inset: clamp(2px,.5vh,8px);
}
.card{
  perspective: 900px;
  perspective-origin: 50% 50%;
  position: relative;
}
.card-inner{
  position:relative; width:100%; height:100%;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  transition: transform .34s cubic-bezier(.34,1.36,.64,1), opacity .3s, filter .3s;
}
.card-face{
  position:absolute; inset:0;
  border-radius: clamp(5px,.85vh,12px);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: 1px; overflow:hidden;
  padding: 4%;
}

/* 牌背：紫色符文 */
.card-back{
  background: linear-gradient(152deg,#3b1a6b 0%,#5b21b6 44%,#1e0b3b 100%);
  border: 1.5px solid rgba(192,132,252,.45);
  box-shadow: inset 0 0 20px rgba(139,92,246,.40);
  transition: box-shadow .2s, border-color .2s;
}
.card-back::before{
  content:''; position:absolute; left:50%; top:50%;
  width:70%; padding-bottom:70%; transform: translate(-50%,-50%);
  border: 1px solid rgba(192,132,252,.42); border-radius:50%;
  box-shadow: inset 0 0 12px rgba(192,132,252,.28);
}
.card-back::after{
  content:''; position:absolute; left:50%; top:50%;
  width:44%; padding-bottom:44%; transform: translate(-50%,-50%);
  border: 1px dashed rgba(232,121,249,.38); border-radius:50%;
}
.card-back .rune{
  position:relative; z-index:2; line-height:1; color:#e9d5ff;
  text-shadow: 0 0 12px rgba(232,121,249,.95), 0 0 26px rgba(139,92,246,.8);
}

/* 牌面：学号 + 姓名 */
.card-front{
  transform: rotateY(180deg);
  background: linear-gradient(158deg,#faf5ff 0%,#ede9fe 48%,#ddd6fe 100%);
  border: 1.5px solid #a78bfa;
  color:#2e1065;
  box-shadow: inset 0 0 18px rgba(167,139,250,.35);
}
.card-front .cid{ font-size: 11px; color:#7c3aed; opacity:.92; line-height:1.1; }
.card-front .cnm{
  font-size: 16px; font-weight:900; line-height:1.12; letter-spacing:.5px;
  max-width: 100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}

/* 摇人中：光标跳动（只改 class + transform，不重排、不抖动） */
.card.hopping .card-inner{ transform: translateY(-9%) scale(1.09); }
.card.hopping .card-back{
  border-color:#f5d0fe;
  box-shadow: 0 0 26px rgba(232,121,249,.95), inset 0 0 26px rgba(232,121,249,.55);
}
.card.hopping .card-back .rune{ color:#fff; }

/* 翻牌 */
.card.flipped .card-inner{ transform: rotateY(180deg); }
.card.won .card-inner{ transform: rotateY(180deg) scale(1.14); }
.card.won .card-front{
  border-color:#f0abfc;
  box-shadow: 0 0 30px rgba(232,121,249,.95), inset 0 0 22px rgba(192,132,252,.5);
  animation: cbWin .85s ease-out;
}
@keyframes cbWin{ 0%{ filter: brightness(2.6); } 100%{ filter: brightness(1); } }
.card.used .card-inner{ opacity:.26; filter: grayscale(.72); }

/* 紫色光标环 */
.cb-cursor{
  position:absolute; left:0; top:0; width:0; height:0;
  border-radius: 12px; pointer-events:none; z-index:6;
  border: 2px solid rgba(232,121,249,.9);
  box-shadow: 0 0 22px rgba(232,121,249,.85), inset 0 0 18px rgba(139,92,246,.5);
  opacity:0; transition: opacity .16s;
}
.card-matrix.rolling .cb-cursor{ opacity:1; }

/* ---------- 揭晓浮层 ---------- */
.cb-reveal{
  position:absolute; inset:0; z-index:60;
  display:none; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(5px,1.1vh,13px);
  background: radial-gradient(circle at 50% 48%, rgba(46,16,101,.93), rgba(6,1,15,.95));
  backdrop-filter: blur(3px);
}
.cb-reveal.active{ display:flex; }
.cb-label{
  font-size: clamp(11px,1.85vh,16px); letter-spacing:5px; font-weight:900;
  color:#d8b4fe; text-shadow: 0 0 20px rgba(192,132,252,.95);
  animation: popIn .4s backwards;
}
.cb-names{ width: min(92vw, 1080px); height: min(46vh, 400px); position:relative; }
.cb-one{
  position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  border-radius: 16px;
  background: linear-gradient(160deg, rgba(139,92,246,.24), rgba(30,11,59,.55));
  border: 3px solid #a78bfa;
  box-shadow: 0 0 34px rgba(139,92,246,.7), inset 0 0 26px rgba(232,121,249,.25);
  animation: cbRise .6s cubic-bezier(.34,1.56,.64,1) backwards;
}
.cb-one .cid2{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(10px,1.6vh,15px); color:#ddd6fe; font-weight:900; opacity:.9;
}
.cb-one .cnm2{
  font-size: clamp(24px,6.4vh,64px); font-weight:900; line-height:1.06; letter-spacing:3px;
  background: linear-gradient(180deg,#ffffff 10%,#e9d5ff 50%,#c084fc 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 22px rgba(192,132,252,.9));
  white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis;
}
@keyframes cbRise{ from{ opacity:0; transform: translateY(26px) rotateY(38deg) scale(.8); } to{ opacity:1; transform:none; } }
.cb-tip{ font-size: clamp(10px,1.5vh,13px); color:#8b7aa8; letter-spacing:1px; }
`,

  body: `
<div class="cb-stage" id="cb-stage">
  <div class="card-matrix fit-grid" id="card-matrix" data-dyn data-fitsize></div>
</div>
<div class="cb-reveal" id="cb-reveal">
  <div class="cb-label">🃏 被 光 标 咬 住 的 幸 运 卡 牌 🃏</div>
  <div class="cb-names fit-grid" id="cb-names" data-dyn></div>
  <div class="cb-tip">按 空格 继续抽取 · 按 Esc 收起</div>
</div>`
};
