module.exports = {
  dir: '13-时空传送阵法点名',
  title: '时空传送阵法',
  badge: '魔法阵法版',
  icon: '🔮',
  accent: '#38bdf8',
  accent2: '#818cf8',
  color: '#04101f',
  historyTitle: '本轮传送名单',
  desc: '地面浮现巨大的六芒星双层符文阵，圆环缓缓自转，边缘不断有蓝色能量粒子上浮。摇人时阵法反向狂转、粒子朝圆心汇聚成旋涡光球；喊停的一瞬天降一道时空光柱，名字在光柱中凝聚成形，再炸成星光散开。',
  tags: ['六芒星', '传送阵', '符文', '光柱'],
  musicNote: '史诗奇幻，锯齿波 Pad + 太鼓与人声层，时空门开启的庄重感',

  music: {
    bpm: 96,
    root: 45,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 19], [3, 10, 15, 19], [-2, 5, 10, 17], [-4, 3, 7, 14]],
    pad: { wave: 'sawtooth', vol: 0.055, oct: 1, dur: 1.06, atk: 0.52, cut: 1500 },
    bass: { pat: [1, 0, 0, 0, 1, 0, 0, 0], oct: 0, vol: 0.085, wave: 'triangle', dur: 4, cut: 300 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'triangle', vol: 0.032, oct: 2, dur: 1.4 },
    drums: 'taiko',
    drumVol: 0.60,
    swing: 0,
    reverb: 0.65,
    delay: 0.30,
    bells: true
  },
  sfx: { win: 'epic' },

  css: `
:root{
  --accent:#38bdf8;
  --accent2:#818cf8;
  --bg: radial-gradient(circle at 50% 10%, #0b2544 0%, #051226 46%, #01060f 100%);
  --panel: rgba(5,16,32,.84);
  --border: rgba(56,189,248,.24);
  --glow: rgba(56,189,248,.5);
}

.tp-root{
  position:absolute; inset:0; overflow:hidden;
  background:
    radial-gradient(circle at 50% 46%, rgba(56,189,248,.10) 0%, transparent 58%),
    radial-gradient(circle at 50% 92%, rgba(129,140,248,.12) 0%, transparent 60%);
}

/* 阵法直径：设计基准 76vh/56vw，同时用 96% 兜底保证永不超出舞台 */
.tp-array{
  position:absolute; left:50%; top:50%; z-index:2;
  width: min(76vh,56vw,96%);
  height: min(76vh,56vw,96%);
  transform: translate(-50%,-50%);
}
#tp-ring{ position:absolute; inset:0; width:100%; height:100%; }

/* 摇人时中心的旋涡光球 */
.tp-vortex{
  position:absolute; left:50%; top:50%; z-index:3; border-radius:50%;
  width: min(24vh,20vw); height: min(24vh,20vw);
  transform: translate(-50%,-50%) scale(.16);
  opacity:0; pointer-events:none;
  background: radial-gradient(circle,
    #ffffff 0%, #bae6fd 16%, rgba(56,189,248,.72) 40%,
    rgba(129,140,248,.28) 66%, transparent 78%);
  filter: blur(3px);
  transition: opacity .35s, transform .55s cubic-bezier(.3,1.35,.5,1);
}
.tp-root.rolling .tp-vortex{
  opacity:1; transform: translate(-50%,-50%) scale(1);
  animation: tpVortex 1.2s linear infinite;
}
@keyframes tpVortex{
  0%{ filter: blur(3px) hue-rotate(0deg); }
  100%{ filter: blur(3px) hue-rotate(360deg); }
}
.tp-root.beaming .tp-vortex{
  opacity:.4; transform: translate(-50%,-50%) scale(1.6);
  animation: none;
}

/* 天降时空光柱：中间实、两侧虚的细长光柱 */
.tp-beam{
  position:absolute; left:50%; top:0; bottom:34%; z-index:4;
  width: min(40vh,30vw);
  transform: translateX(-50%);
  pointer-events:none; opacity:0;
  transition: opacity .38s;
  clip-path: polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%);
  mix-blend-mode: screen;
}
.tp-root.beaming .tp-beam{ opacity:1; }
.tp-beam-glow{
  position:absolute; inset:0;
  background:
    linear-gradient(90deg,
      rgba(56,189,248,0) 0%, rgba(125,211,252,.30) 22%,
      rgba(224,242,254,.62) 50%, rgba(125,211,252,.30) 78%,
      rgba(56,189,248,0) 100%),
    linear-gradient(180deg,
      rgba(186,230,253,0) 0%, rgba(186,230,253,.35) 12%,
      rgba(125,211,252,.70) 42%, rgba(129,140,248,.55) 76%,
      rgba(56,189,248,.14) 100%);
  filter: blur(7px);
}
.tp-beam::after{
  content:''; position:absolute; left:50%; top:0; bottom:8%; width:22%;
  transform: translateX(-50%);
  background: linear-gradient(180deg,
    rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 18%,
    rgba(224,242,254,.80) 55%, rgba(224,242,254,0) 100%);
  filter: blur(6px);
}
.tp-beam-scan{
  position:absolute; left:-6%; right:-6%; height:16%; top:-18%;
  background: linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.95), rgba(255,255,255,0));
  filter: blur(6px);
}
.tp-root.beaming .tp-beam-scan{ animation: tpScan 1.6s ease-in-out infinite; }
@keyframes tpScan{
  0%{ top:-18%; opacity:0; }
  22%{ opacity:.95; }
  100%{ top:102%; opacity:0; }
}

/* 光柱中的中选者（独立于光柱，避免被 screen 混合冲淡） */
.tp-names{
  position:absolute; left:50%; top:5%; bottom:40%;
  width: min(36vh,27vw);
  transform: translateX(-50%);
  display:grid; justify-content:center; align-content:center; z-index:6;
}
.tp-cw{ display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; }
.tp-cw .nm{
  display:block; max-width:100%; white-space:nowrap; overflow:hidden;
  font-weight:900; line-height:1.08; color:#ffffff;
  text-shadow:
    0 0 16px rgba(186,230,253,1),
    0 0 42px rgba(56,189,248,.92),
    0 0 88px rgba(129,140,248,.8);
  opacity:0;
}
.tp-cw .id3{
  font-family: ui-monospace, Consolas, monospace; font-weight:800;
  color:#bae6fd; opacity:0; white-space:nowrap; letter-spacing:.5px;
}
.tp-cw.roll .nm{ opacity:.42; }
.tp-root.rolling .tp-cw.roll .nm{ animation: tpFlick .18s linear infinite; }
@keyframes tpFlick{ 0%,100%{ opacity:.24; } 50%{ opacity:.60; } }
.tp-cw.on .nm{ animation: tpRise .74s cubic-bezier(.2,.9,.3,1) both; }
.tp-cw.on .id3{ animation: tpRise .74s .16s cubic-bezier(.2,.9,.3,1) both; }
@keyframes tpRise{
  from{ opacity:0; transform: translateY(42px) scale(.7); filter: blur(10px); }
  to{ opacity:1; transform: none; filter: blur(0); }
}

.tp-hud{
  position:absolute; left:0; right:0; bottom:2.5%; z-index:6; text-align:center;
  font-size: clamp(9px,1.35vh,13px); font-weight:800;
  letter-spacing: clamp(2px,.6vw,7px);
  color:#7dd3fc; opacity:.55;
  text-shadow: 0 0 14px rgba(56,189,248,.8);
  transition: opacity .3s;
}
.tp-root.rolling .tp-hud{ opacity:.95; color:#e0f2fe; }
`,
  body: `
<div class="tp-root" id="tp-root">
  <div class="tp-array" id="tp-array">
    <canvas id="tp-ring"></canvas>
  </div>
  <div class="tp-vortex" id="tp-vortex"></div>
  <div class="tp-beam" id="tp-beam">
    <div class="tp-beam-glow"></div>
    <div class="tp-beam-scan"></div>
  </div>
  <div class="tp-names" id="tp-names" data-dyn></div>
  <div class="tp-hud" id="tp-hud">阵 法 待 启 · 按 空 格 启 动 传 送</div>
</div>`
};
