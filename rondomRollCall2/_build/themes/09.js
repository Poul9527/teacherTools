module.exports = {
  dir: '09-吃鸡空投补给箱点名',
  title: '吃鸡空投补给箱',
  badge: '空投补给版',
  icon: '🪂',
  accent: '#10b981',
  accent2: '#facc15',
  color: '#07160f',
  historyTitle: '本轮空投名单',
  desc: '战场上空，一只挂着伞盖的空投箱正缓缓下坠。摇人时降落伞加速俯冲、箱体剧烈摇晃，地面那柱红色信号烟越升越浓；停下的一刻箱子轰然砸地，屏幕震颤、冲击波贴地扩散，箱盖向两侧翻开射出金光，箱底那份传说级补给名单就此曝光。',
  tags: ['吃鸡', '空投箱', '降落伞', '信号烟'],
  musicNote: '紧张军事感：锯齿波铺底 + 军鼓进行曲节奏',

  music: {
    bpm: 100,
    root: 43,
    stepsPerBar: 16,
    chords: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 11, 14, 17]],
    pad: { wave: 'sawtooth', vol: 0.036, oct: 0, dur: 1.02, atk: 0.52, cut: 920 },
    bass: { pat: [1, 0, 1, 0, 0, 0, 1, 0], oct: 0, vol: 0.098, wave: 'triangle', dur: 4, cut: 270 },
    arp: { pat: [0, 1, 2, 3, -1, 2, -1, 1], wave: 'square', vol: 0.026, oct: 2, dur: 0.55 },
    lead: { pat: [0, -1, -1, 2, -1, -1, 3, -1], wave: 'sawtooth', vol: 0.028, oct: 3, dur: 0.95, atk: 0.04 },
    drums: 'march',
    drumVol: 0.62,
    swing: 0,
    reverb: 0.36,
    delay: 0.2,
    bells: false
  },
  sfx: { win: 'epic' },

  css: `
:root{
  --accent:#10b981;
  --accent2:#facc15;
  --bg: radial-gradient(circle at 50% 4%, #123324 0%, #08180f 46%, #030906 100%);
  --panel: rgba(6,24,16,.84);
  --border: rgba(16,185,129,.26);
  --glow: rgba(16,185,129,.55);
}
#cg-bg{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }

/* ---------- 空投箱整体 ---------- */
.cg-drop{
  position:absolute; left:50%; top:0;
  display:flex; flex-direction:column; align-items:center;
  transform-origin: 50% 100%;
  will-change: transform;
  z-index:6;
}
.cg-chute{ position:relative; }
.cg-canopy{
  position:absolute; left:0; top:0;
  border-radius: 50% 50% 10% 10% / 88% 88% 12% 12%;
  background:
    repeating-linear-gradient(96deg, #6b7280 0%, #6b7280 9%, #475569 9%, #475569 18%),
    linear-gradient(180deg,#9ca3af,#4b5563);
  box-shadow: inset -16px -20px 44px rgba(0,0,0,.55), inset 12px 10px 26px rgba(255,255,255,.16), 0 8px 26px rgba(0,0,0,.5);
  border-bottom: 3px solid rgba(2,6,4,.75);
}
.cg-ropes{ position:absolute; left:0; }
.cg-ropes span{
  position:absolute; bottom:0; left:50%; width:2px; height:100%;
  transform-origin: 50% 100%;
  background: linear-gradient(180deg, rgba(226,232,240,.9), rgba(100,116,139,.65));
}
.cg-crate{
  position:relative;
  filter: drop-shadow(0 14px 26px rgba(0,0,0,.6));
}
.cg-box{
  position:absolute; inset:0;
  border-radius: 6px;
  background:
    linear-gradient(180deg,#3d6b52 0%,#2b4f3c 42%,#1d3a2b 100%);
  border:2px solid rgba(0,0,0,.5);
  overflow:hidden;
  box-shadow: inset 0 -18px 34px rgba(0,0,0,.55), inset 0 10px 20px rgba(255,255,255,.10);
}
.cg-box::after{
  content:''; position:absolute; inset:0;
  background: repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0%, rgba(0,0,0,.16) 6%, rgba(255,255,255,.05) 6%, rgba(255,255,255,.05) 12%);
  pointer-events:none;
}
.cg-band{
  position:absolute; left:0; right:0; top:38%; height:16%;
  background: linear-gradient(180deg,#d97706,#92400e);
  box-shadow: 0 2px 6px rgba(0,0,0,.5);
  z-index:3;
}
.cg-cross{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  color: rgba(250,204,21,.9); font-weight:900; z-index:4;
  text-shadow: 0 0 12px rgba(250,204,21,.7);
}
.cg-tag{
  position:absolute; left:0; right:0; bottom:7%; text-align:center; z-index:4;
  color: rgba(16,185,129,.9); font-weight:900; letter-spacing:.18em;
  text-shadow: 0 0 10px rgba(16,185,129,.6);
}
.cg-glow{
  position:absolute; left:0; right:0; top:0; height:60%; z-index:5;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.95) 0%, rgba(253,224,71,.85) 22%, rgba(250,204,21,.35) 55%, rgba(250,204,21,0) 100%);
  opacity:0; transition: opacity .35s .18s;
}
.cg-crate.open .cg-glow{ opacity:1; }

.cg-lid{
  position:absolute; top:0; width:50%; height:24%; z-index:8;
  background: linear-gradient(180deg,#4f8062,#2f5442);
  border:2px solid rgba(0,0,0,.5);
  box-shadow: inset 0 6px 12px rgba(255,255,255,.14);
  display:flex; align-items:center; justify-content:center;
  color: rgba(250,204,21,.85); font-weight:900;
  transition: transform .55s cubic-bezier(.34,1.36,.64,1);
  backface-visibility: hidden;
}
.cg-lid-l{ left:0; transform-origin: 0% 100%; border-radius: 6px 2px 2px 4px; }
.cg-lid-r{ right:0; transform-origin: 100% 100%; border-radius: 2px 6px 4px 2px; }
.cg-crate.open .cg-lid-l{ transform: rotate(-114deg); }
.cg-crate.open .cg-lid-r{ transform: rotate(114deg); }

/* ---------- HUD ---------- */
.cg-hud{
  position:absolute; left: clamp(6px,1.2vw,18px); top: clamp(4px,.9vh,14px);
  z-index:9; display:flex; align-items:center; gap:6px;
  padding: clamp(3px,.7vh,6px) clamp(8px,1.1vw,14px);
  border-radius: 8px; font-weight:800; letter-spacing:.08em;
  background: rgba(4,20,13,.72);
  border:1px solid rgba(16,185,129,.4);
  color:#a7f3d0;
  font-size: clamp(10px,1.45vh,13px);
  box-shadow: 0 4px 16px rgba(0,0,0,.5);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  max-width: 60%;
}

/* ---------- 开箱揭晓 ---------- */
.cg-reveal{
  position:absolute; inset:0; z-index:60; display:none;
  align-items:center; justify-content:center;
  padding: clamp(6px,1.4vh,18px);
  background: radial-gradient(circle at 50% 60%, rgba(6,26,18,.72), rgba(1,6,4,.90));
  backdrop-filter: blur(4px);
}
.cg-reveal.active{ display:flex; }
.cg-panel{
  width: min(93%, 960px);
  height: min(80%, 540px);
  display:flex; flex-direction:column;
  gap: clamp(4px,.9vh,10px);
  padding: clamp(8px,1.4vh,18px) clamp(10px,1.6vw,24px);
  border-radius: 16px;
  background:
    repeating-linear-gradient(90deg, rgba(0,0,0,.20) 0%, rgba(0,0,0,.20) 5%, rgba(255,255,255,.03) 5%, rgba(255,255,255,.03) 10%),
    linear-gradient(180deg,#25503b,#102a1d 55%,#0a1c13);
  border: 2px solid rgba(16,185,129,.65);
  box-shadow: 0 0 70px rgba(16,185,129,.5), 0 0 130px rgba(250,204,21,.22), 0 24px 60px rgba(0,0,0,.85);
  animation: cgPanelIn .48s cubic-bezier(.34,1.46,.64,1);
  overflow:hidden;
}
@keyframes cgPanelIn{ from{ opacity:0; transform: translateY(38px) scale(.86); } to{ opacity:1; transform:none; } }
.cg-panel-hd{
  display:flex; align-items:center; justify-content:center; gap:.5em;
  font-weight:900; letter-spacing:.26em;
  font-size: clamp(12px,1.95vh,18px);
  color:#facc15;
  text-shadow: 0 0 16px rgba(250,204,21,.8);
  border-bottom:1px dashed rgba(16,185,129,.45);
  padding-bottom: clamp(3px,.7vh,8px);
  flex-shrink:0;
}
.cg-panel-sub{
  text-align:center; color:#6ee7b7; letter-spacing:.16em;
  font-size: clamp(9px,1.35vh,12px); flex-shrink:0; opacity:.85;
}
.cg-list{
  flex:1; min-height:0;
  display:grid; justify-content:center; align-content:center;
  position:relative;
}
.cg-item{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1px; border-radius:10px; overflow:hidden; padding:3px 5px;
  background: linear-gradient(180deg, rgba(16,185,129,.24), rgba(16,185,129,.05));
  border:1.5px solid rgba(16,185,129,.55);
  box-shadow: 0 0 18px rgba(16,185,129,.28) inset;
  animation: cgItemIn .45s cubic-bezier(.34,1.56,.64,1) backwards;
}
@keyframes cgItemIn{ from{ opacity:0; transform: translateY(22px) scale(.78); } to{ opacity:1; transform:none; } }
.cg-item .cg-rar{
  color:#facc15; font-weight:900; letter-spacing:.1em;
  text-shadow: 0 0 12px rgba(250,204,21,.85);
}
.cg-item .cg-id{ color:#6ee7b7; opacity:.9; }
.cg-item .cg-nm{
  color:#ffffff; font-weight:900; white-space:nowrap;
  max-width:100%; overflow:hidden; text-overflow:ellipsis;
  text-shadow: 0 0 16px rgba(16,185,129,.9);
}
.cg-panel-ft{
  text-align:center; color:#6ee7b7; opacity:.7;
  font-size: clamp(9px,1.3vh,12px); letter-spacing:.08em; flex-shrink:0;
}
`,

  body: `
<canvas id="cg-bg"></canvas>
<div class="cg-drop" id="cg-drop">
  <div class="cg-chute" id="cg-chute">
    <div class="cg-canopy" id="cg-canopy"></div>
    <div class="cg-ropes" id="cg-ropes">
      <span style="transform:rotate(-52deg)"></span>
      <span style="transform:rotate(-32deg)"></span>
      <span style="transform:rotate(-11deg)"></span>
      <span style="transform:rotate(11deg)"></span>
      <span style="transform:rotate(32deg)"></span>
      <span style="transform:rotate(52deg)"></span>
    </div>
  </div>
  <div class="cg-crate" id="cg-crate">
    <div class="cg-box">
      <div class="cg-glow" id="cg-glow"></div>
      <div class="cg-band"></div>
      <div class="cg-cross">✚</div>
      <div class="cg-tag">SUPPLY · 空投补给</div>
    </div>
    <div class="cg-lid cg-lid-l" id="cg-lid-l"><b>A</b></div>
    <div class="cg-lid cg-lid-r" id="cg-lid-r"><b>A</b></div>
  </div>
</div>
<div class="cg-hud" id="cg-hud">🪂 空投航线已就绪 · 等待投放</div>
<div class="cg-reveal" id="cg-reveal">
  <div class="cg-panel">
    <div class="cg-panel-hd"><span>📦</span><span>空 投 补 给 · 传 说 级 名 单</span></div>
    <div class="cg-panel-sub" id="cg-psub">本 次 补 给 官</div>
    <div class="cg-list" id="cg-list" data-dyn></div>
    <div class="cg-panel-ft">按 空格 继续空投 · 按 Esc 收起清单</div>
  </div>
</div>`
};
