module.exports = {
  dir: '01-星空银河点名',
  title: '星空银河点名',
  badge: '星河沉浸版',
  icon: '🌌',
  accent: '#7dd3fc',
  accent2: '#a78bfa',
  color: '#04081c',
  historyTitle: '本轮已点亮的星星',
  desc: '深空银河缓缓流转，每位同学都是一颗带学号的星。摇人时流星在星图间高速穿梭，抽中的星星轰然炸成超新星，并与其他中选者连成星座，星名以银河大字浮现。',
  tags: ['星空', '银河', '流星', '星座连线'],
  musicNote: '空灵 Sine Pad + 钟琴泛音，节奏舒缓悠远',

  music: {
    bpm: 82,
    root: 45,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 19], [-2, 5, 10, 17], [-4, 3, 8, 15], [-5, 2, 7, 14]],
    pad: { wave: 'sine', vol: 0.060, oct: 1, dur: 1.06, atk: 0.62, cut: 2000 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 0, 0], oct: 0, vol: 0.075, wave: 'sine', dur: 6, cut: 280 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'sine', vol: 0.036, oct: 2, dur: 1.4 },
    drums: 'heart',
    drumVol: 0.5,
    reverb: 0.58,
    delay: 0.34,
    bells: true
  },
  sfx: { win: 'chime' },

  css: `
:root{
  --accent:#7dd3fc;
  --accent2:#a78bfa;
  --bg: radial-gradient(circle at 50% 6%, #16255f 0%, #070d26 46%, #01030c 100%);
  --panel: rgba(6,12,32,.80);
  --border: rgba(125,211,252,.22);
  --glow: rgba(125,211,252,.55);
}
#sky-bg{ position:absolute; inset:0; width:100%; height:100%; }
.star-field{
  position:absolute; inset: clamp(2px,.8vh,10px);
}

.star-node{
  position: relative;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 1px;
  border-radius: 12px;
  border: 1px solid rgba(125,211,252,.16);
  background: radial-gradient(circle at 50% 30%, rgba(56,110,190,.22), rgba(3,8,24,.55) 72%);
  overflow: hidden;
  transition: transform .16s, box-shadow .2s, border-color .2s, background .2s;
  animation: starIdle 4s ease-in-out infinite;
}
@keyframes starIdle{
  0%,100%{ box-shadow: 0 0 0 rgba(125,211,252,0); }
  50%{ box-shadow: 0 0 14px rgba(125,211,252,.20); }
}
.star-node .sd{
  position:absolute; width:3px; height:3px; border-radius:50%;
  background:#fff; opacity:.5; top:18%; right:16%;
  box-shadow: 0 0 6px #fff;
}
.star-node .sid{
  font-size: clamp(8px, 1.15vh, 11px);
  color: rgba(125,211,252,.75);
  font-family: ui-monospace, Consolas, monospace;
  font-weight: 700;
  letter-spacing: .3px;
}
.star-node .snm{
  font-size: clamp(11px, 2.05vh, 21px);
  font-weight: 800;
  color: #eaf6ff;
  text-shadow: 0 0 10px rgba(125,211,252,.5);
  white-space: nowrap;
  padding: 0 3px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 摇人中：星图被高速扫过 */
.star-field.rolling .star-node{ animation-duration: .55s; opacity:.55; }
.star-node.lit{
  transform: scale(1.14);
  border-color:#fef08a;
  background: radial-gradient(circle at 50% 30%, rgba(254,240,138,.42), rgba(10,20,50,.72) 74%);
  box-shadow: 0 0 26px rgba(254,240,138,.9), 0 0 60px rgba(125,211,252,.5);
  opacity:1 !important;
}
.star-node.won{
  transform: scale(1.22);
  border-color:#fde047;
  background: radial-gradient(circle at 50% 30%, rgba(253,224,71,.6), rgba(20,30,70,.8) 74%);
  box-shadow: 0 0 34px rgba(253,224,71,1), 0 0 90px rgba(167,139,250,.8);
  animation: starWin .9s ease-out;
  opacity:1 !important;
  z-index:5;
}
@keyframes starWin{
  0%{ transform: scale(1); filter: brightness(3); }
  40%{ transform: scale(1.34); }
  100%{ transform: scale(1.22); filter: brightness(1); }
}
.star-node.dim{ opacity:.22; }

/* 流星光标 */
.comet{
  position:absolute; width: 14px; height:14px; border-radius:50%;
  background: radial-gradient(circle, #fff 0%, #7dd3fc 45%, transparent 72%);
  pointer-events:none; z-index:8;
  transition: transform .08s linear, opacity .2s;
  opacity:0;
}
.comet::after{
  content:''; position:absolute; left:-46px; top:4px; width:46px; height:6px;
  background: linear-gradient(90deg, transparent, rgba(125,211,252,.85));
  border-radius: 3px; filter: blur(1.5px);
}
.star-field.rolling .comet{ opacity:1; }

/* 银河大字揭晓 */
.gx-reveal{
  position:absolute; inset:0; z-index:60;
  display:none; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(6px,1.4vh,16px);
  background: radial-gradient(circle at 50% 50%, rgba(10,18,52,.90), rgba(1,3,12,.94));
  backdrop-filter: blur(3px);
}
.gx-reveal.active{ display:flex; }
.gx-label{
  font-size: clamp(11px,1.85vh,16px); letter-spacing: 5px; font-weight: 800;
  color:#7dd3fc; text-shadow: 0 0 18px rgba(125,211,252,.8);
  animation: popIn .4s backwards;
}
.gx-names{ display:flex; flex-wrap:wrap; gap: clamp(8px,1.6vw,26px); justify-content:center; align-items:flex-end; }
.gx-one{ text-align:center; animation: gxRise .62s cubic-bezier(.34,1.56,.64,1) backwards; }
.gx-one .gid{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(11px,1.7vh,16px); color:#a5f3fc; font-weight:800; opacity:.85;
}
.gx-one .gnm{
  font-size: clamp(34px,9.4vh,96px);
  font-weight: 900; line-height:1.06; letter-spacing: 4px;
  background: linear-gradient(180deg,#ffffff 12%,#bae6fd 55%,#a78bfa 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 26px rgba(125,211,252,.85));
}
@keyframes gxRise{ from{ opacity:0; transform: translateY(26px) scale(.82); } to{ opacity:1; transform:none; } }
.gx-tip{ font-size: clamp(10px,1.5vh,13px); color:#64748b; letter-spacing:1px; }
`,

  body: `
<canvas id="sky-bg"></canvas>
<div class="star-field fit-grid" id="star-field" data-dyn></div>
<div class="comet" id="comet"></div>
<div class="gx-reveal" id="gx-reveal">
  <div class="gx-label">✦ 星 河 选 中 的 幸 运 之 星 ✦</div>
  <div class="gx-names" id="gx-names"></div>
  <div class="gx-tip">按 空格 继续抽取 · 按 Esc 收起</div>
</div>`
};
