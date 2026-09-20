module.exports = {
  dir: '15-全息魔方矩阵点名',
  title: '全息魔方矩阵',
  badge: '3D魔方矩阵版',
  icon: '🎲',
  accent: '#6366f1',
  accent2: '#22d3ee',
  color: '#05080f',
  historyTitle: '本轮解码名单',
  desc: '深空里悬浮着一枚半透明的全息魔方，六面霓虹玻璃格子里滚动着全班的名字。摇人时魔方三轴翻滚、五十四格名单高速刷屏；停止的一瞬魔方减速归位，六面拼合锁定闪出一道光，正面中央亮出被解码的同学。',
  tags: ['赛博魔方', '3D全息', '扫描线', '电子音'],
  musicNote: 'Cyber Techno 锯齿合成器 + 密集方波琶音',

  music: {
    bpm: 124,
    root: 41,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 15], [3, 10, 15, 19], [-2, 5, 10, 14], [5, 12, 17, 21]],
    pad: { wave: 'sawtooth', vol: 0.038, oct: 1, dur: 0.98, atk: 0.30, cut: 1400 },
    bass: { pat: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], oct: 0, vol: 0.095, wave: 'sawtooth', dur: 2, cut: 360 },
    arp: { pat: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0, 2], wave: 'square', vol: 0.030, oct: 2, dur: 1.0 },
    lead: { pat: [0, -1, 2, -1, 4, -1, 3, 2], wave: 'square', vol: 0.032, oct: 3, dur: 1.5, extra: 0 },
    drums: 'trap',
    drumVol: 0.68,
    reverb: 0.3,
    delay: 0.22,
    bells: false
  },
  sfx: { win: 'arcade' },

  css: `
:root{
  --accent:#6366f1;
  --accent2:#22d3ee;
  --bg: radial-gradient(circle at 50% 0%, #131e42 0%, #060a17 52%, #01030a 100%);
  --panel: rgba(6,12,24,.78);
  --border: rgba(99,102,241,.28);
  --glow: rgba(34,211,238,.50);
}

#mx-bg{ position:absolute; inset:0; width:100%; height:100%; }
.mx-scene{
  position:absolute; inset:0; overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}

/* ---------- 3D 魔方 ---------- */
.mx-3d{
  --cube: min(58vh, 46vw);
  --half: calc(min(58vh, 46vw) / 2);
  --fit: 1;
  position:relative;
  width: var(--cube); height: var(--cube);
  perspective: 1500px;
  transform: scale(var(--fit));
  z-index: 2;
}
.mx-spin{ position:absolute; inset:0; transform-style: preserve-3d; }
.cube{ position:absolute; inset:0; transform-style: preserve-3d; }

.cface{
  position:absolute; inset:0;
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4%;
  padding: 4%;
  border: 1px solid rgba(34,211,238,.55);
  background:
    linear-gradient(180deg, rgba(34,211,238,.09), rgba(99,102,241,.16)),
    repeating-linear-gradient(0deg, rgba(34,211,238,.13) 0 1px, rgba(0,0,0,0) 1px 33.33%),
    repeating-linear-gradient(90deg, rgba(34,211,238,.13) 0 1px, rgba(0,0,0,0) 1px 33.33%),
    rgba(5,11,26,.62);
  box-shadow: inset 0 0 4vh rgba(34,211,238,.22), 0 0 3vh rgba(99,102,241,.24);
  transition: box-shadow .25s, border-color .25s, background .25s;
}
.f0{ transform: translateZ(var(--half)); }
.f1{ transform: rotateY(180deg) translateZ(var(--half)); }
.f2{ transform: rotateY(90deg) translateZ(var(--half)); }
.f3{ transform: rotateY(-90deg) translateZ(var(--half)); }
.f4{ transform: rotateX(90deg) translateZ(var(--half)); }
.f5{ transform: rotateX(-90deg) translateZ(var(--half)); }

.cube.locked .cface{
  border-color: #7dd3fc;
  background:
    linear-gradient(180deg, rgba(34,211,238,.30), rgba(99,102,241,.40)),
    repeating-linear-gradient(0deg, rgba(125,211,252,.35) 0 1px, rgba(0,0,0,0) 1px 33.33%),
    repeating-linear-gradient(90deg, rgba(125,211,252,.35) 0 1px, rgba(0,0,0,0) 1px 33.33%),
    rgba(10,22,48,.72);
  box-shadow: inset 0 0 6vh rgba(34,211,238,.6), 0 0 6vh rgba(34,211,238,.85);
}
.cface.locked{ animation: faceFlash .55s ease-out; }
@keyframes faceFlash{
  0%{ filter: brightness(2.6); }
  100%{ filter: brightness(1); }
}

.fcell{
  position:relative; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  overflow:hidden; border-radius: 3px;
  background: linear-gradient(150deg, rgba(34,211,238,.11), rgba(99,102,241,.17));
  border: 1px solid rgba(34,211,238,.30);
  box-shadow: inset 0 0 1.2vh rgba(34,211,238,.16);
  transition: background .3s, border-color .3s, box-shadow .3s;
}
.fcell .fi{
  font-family: ui-monospace, Consolas, monospace;
  font-size: var(--cfi, 10px); font-weight:700; line-height:1;
  color: rgba(103,232,249,.80); letter-spacing:1px;
}
.fcell .fn{
  font-size: var(--cf, 22px); font-weight:800; line-height:1.06;
  color:#e0f2fe; white-space:nowrap; overflow:hidden; max-width:100%;
  text-shadow: 0 0 1.2vh rgba(34,211,238,.80);
}
.fcell.hot{
  background: linear-gradient(150deg, rgba(34,211,238,.55), rgba(99,102,241,.60));
  border-color:#a5f3fc;
  box-shadow: inset 0 0 2vh rgba(34,211,238,.6), 0 0 2.4vh rgba(34,211,238,.9);
  animation: hotPulse 1.15s ease-in-out infinite;
}
.fcell.hot .fn{ color:#ffffff; text-shadow: 0 0 2vh #22d3ee, 0 0 4vh rgba(99,102,241,.9); }
.fcell.hot .fi{ color:#c7d2fe; }
@keyframes hotPulse{
  0%,100%{ filter: brightness(1); }
  50%{ filter: brightness(1.45); }
}

/* ---------- 全息 HUD 揭晓面板 ---------- */
.mx-hud{
  position:absolute; left:50%; top:50%; z-index:40;
  transform: translate(-50%,-50%);
  display:none; flex-direction:column; align-items:center;
  gap: clamp(5px,1.1vh,14px);
  padding: clamp(14px,2.6vh,30px) clamp(18px,3.2vw,52px);
  min-width: min(84%, 760px); max-width: 94%; max-height: 96%;
  background: linear-gradient(180deg, rgba(6,14,30,.90), rgba(3,6,16,.95));
  border: 1.5px solid var(--accent2);
  border-radius: 4px;
  box-shadow:
    0 0 6vh rgba(34,211,238,.45),
    0 0 14vh rgba(99,102,241,.35),
    inset 0 0 5vh rgba(34,211,238,.12);
  animation: hudIn .45s cubic-bezier(.34,1.56,.64,1) .74s backwards;
  overflow:hidden;
}
.mx-hud.active{ display:flex; }
.mx-hud::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background: repeating-linear-gradient(0deg, rgba(34,211,238,.07) 0 1px, rgba(0,0,0,0) 1px 3px);
}
@keyframes hudIn{ from{ opacity:0; transform: translate(-50%,-50%) scale(.72); } to{ opacity:1; transform: translate(-50%,-50%) scale(1); } }

.hud-c{ position:absolute; width: clamp(12px,2.3vh,22px); height: clamp(12px,2.3vh,22px); border: 2px solid var(--accent2); }
.hud-c.tl{ left:-2px; top:-2px; border-right:0; border-bottom:0; }
.hud-c.tr{ right:-2px; top:-2px; border-left:0; border-bottom:0; }
.hud-c.bl{ left:-2px; bottom:-2px; border-right:0; border-top:0; }
.hud-c.br{ right:-2px; bottom:-2px; border-left:0; border-top:0; }
.hud-scan{
  position:absolute; left:0; right:0; height:24%; pointer-events:none;
  background: linear-gradient(180deg, rgba(34,211,238,0), rgba(34,211,238,.22), rgba(34,211,238,0));
  animation: hudScan 2.4s linear infinite;
}
@keyframes hudScan{ 0%{ top:-26%; } 100%{ top:104%; } }

.hud-head, .hud-foot{
  font-family: ui-monospace, Consolas, monospace;
  letter-spacing:1.5px; position:relative; z-index:2;
}
.hud-head{
  display:flex; align-items:center; gap:7px;
  font-size: clamp(10px,1.55vh,14px); font-weight:800; color:#67e8f9;
  text-shadow: 0 0 1.6vh rgba(34,211,238,.8);
}
.hud-dot{
  width:7px; height:7px; border-radius:50%; background:#22d3ee;
  box-shadow: 0 0 1.2vh #22d3ee;
  animation: hudDot 1.1s ease-in-out infinite;
}
@keyframes hudDot{ 0%,100%{ opacity:1; } 50%{ opacity:.25; } }
.hud-foot{ font-size: clamp(9px,1.35vh,12px); color:#64748b; letter-spacing:1px; }

.mx-names{ display:flex; flex-wrap:wrap; gap: clamp(8px,1.5vw,24px); justify-content:center; align-items:flex-end; position:relative; z-index:2; }
.mx-one{ text-align:center; animation: mxRise .55s cubic-bezier(.34,1.56,.64,1) backwards; }
.mx-one .mid{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(10px,1.6vh,15px); color:#67e8f9; font-weight:800; letter-spacing:2px;
}
.mx-one .mnm{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(26px,7.4vh,76px); font-weight:900; line-height:1.1; letter-spacing:3px;
  color:#e0f2fe;
  text-shadow: 0 0 1.8vh rgba(34,211,238,.95), 0 0 5vh rgba(99,102,241,.80);
}
@keyframes mxRise{ from{ opacity:0; transform: translateY(20px) scale(.84); } to{ opacity:1; transform:none; } }
`,

  body: `
<canvas id="mx-bg"></canvas>
<div class="mx-scene" id="mx-scene">
  <div class="mx-3d" id="mx-3d">
    <div class="mx-spin" id="mx-spin">
      <div class="cube" id="mx-cube" data-dyn></div>
    </div>
  </div>
  <div class="mx-hud" id="mx-hud">
    <i class="hud-c tl"></i><i class="hud-c tr"></i><i class="hud-c bl"></i><i class="hud-c br"></i>
    <div class="hud-scan"></div>
    <div class="hud-head"><span class="hud-dot"></span>DECODE COMPLETE · 本轮解码名单</div>
    <div class="mx-names" id="mx-names" data-dyn></div>
    <div class="hud-foot">SPACE 继续解码 · ESC 收起 · MATRIX v2.0</div>
  </div>
</div>`
};
