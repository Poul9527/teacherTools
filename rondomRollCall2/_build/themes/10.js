module.exports = {
  dir: '10-弹幕气泡爆炸点名',
  title: '弹幕气泡爆炸',
  badge: '梦幻气泡版',
  icon: '🫧',
  accent: '#ec4899',
  accent2: '#a855f7',
  color: '#1a0a1e',
  historyTitle: '本轮爆破名单',
  desc: '一颗颗梦幻灯泡在夜色里缓缓升腾，每颗泡泡里都浮着一位同学的名字。摇人时十字准星在泡泡之间飞速跳跃锁定，被瞄准的泡泡涨大发亮、轻轻发抖；停下的瞬间准星扣下，命中的泡泡应声炸开，化作满天飞星与光晕，名字在星光中浮现。',
  tags: ['气泡', '爆破', '准星', '梦幻'],
  musicNote: '梦幻流行：正弦 Pad + 沙锤律动，混响与延迟拉满',

  music: {
    bpm: 108,
    root: 50,
    stepsPerBar: 16,
    chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14, 17]],
    pad: { wave: 'sine', vol: 0.058, oct: 1, dur: 1.10, atk: 0.66, cut: 2400 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 0, 0], oct: 0, vol: 0.072, wave: 'sine', dur: 6, cut: 300 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'triangle', vol: 0.038, oct: 2, dur: 1.5 },
    lead: { pat: [3, -1, 2, -1, 1, -1, 2, -1], wave: 'sine', vol: 0.032, oct: 3, dur: 1.2, atk: 0.07 },
    drums: 'shaker',
    drumVol: 0.45,
    swing: 0,
    reverb: 0.6,
    delay: 0.4,
    bells: true
  },
  sfx: { win: 'chime' },

  css: `
:root{
  --accent:#ec4899;
  --accent2:#a855f7;
  --bg: radial-gradient(circle at 50% 4%, #3a1145 0%, #1c0b23 46%, #0a0410 100%);
  --panel: rgba(30,10,36,.82);
  --border: rgba(236,72,153,.28);
  --glow: rgba(236,72,153,.55);
}
#bb-bg{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }

.bb-field{
  position:absolute; inset: clamp(4px,1vh,14px);
  overflow:hidden;
}
.bb-bubbles{ position:absolute; inset:0; }

/* ---------- 泡泡 ---------- */
.bb-ball{ position:absolute; }
.bb-float{
  position:absolute; inset:0;
  will-change: transform;
  transform-origin: 50% 50%;
}
.bb-skin{
  position:absolute; inset:0; border-radius:50%;
  transition: filter .25s;
}
.bb-hi{
  position:absolute; left:24%; top:18%; width:24%; height:17%;
  border-radius:50%; background: rgba(255,255,255,.78);
  transform: rotate(-26deg); filter: blur(.6px);
  pointer-events:none;
}
.bb-hi2{
  position:absolute; right:20%; bottom:22%; width:12%; height:9%;
  border-radius:50%; background: rgba(255,255,255,.45);
  filter: blur(.8px); pointer-events:none;
}
.bb-txt{
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1px; padding:8%; overflow:hidden; text-align:center;
}
.bb-txt .bb-id{ color: rgba(255,255,255,.72); }
.bb-txt .bb-nm{
  color:#fff; font-weight:900; line-height:1.05; white-space:nowrap;
  max-width:100%; overflow:hidden; text-overflow:ellipsis;
}
.bb-ball.lock .bb-txt .bb-nm{ text-shadow: 0 0 18px #fff, 0 0 30px #ec4899; }

.bb-halo{
  position:absolute; inset:-16%; border-radius:50%; pointer-events:none; opacity:0;
  border:2px solid rgba(255,255,255,.9);
  box-shadow: 0 0 30px rgba(236,72,153,.9), inset 0 0 30px rgba(168,85,247,.8);
}
.bb-halo.on{ animation: bbHalo .95s ease-out forwards; }
@keyframes bbHalo{
  0%{ opacity:1; transform: scale(.55); }
  100%{ opacity:0; transform: scale(2.1); }
}
.bb-ball.dim .bb-skin{ filter: grayscale(.92) brightness(.45); }
.bb-ball.dim .bb-txt{ opacity:.28; }

/* ---------- 十字准星 ---------- */
.bb-cross{
  position:absolute; left:0; top:0;
  width:100px; height:100px; margin:-50px 0 0 -50px;
  z-index:9; pointer-events:none; opacity:0;
  transition: opacity .18s;
  transform-origin: 50% 50%;
}
.bb-cross.on{ opacity:1; }
.bb-cb{
  position:absolute; width:26px; height:26px;
  border:3px solid #ec4899;
  animation: bbCrossGlow .5s ease-in-out infinite alternate;
}
@keyframes bbCrossGlow{
  from{ border-color:#ec4899; box-shadow: 0 0 10px rgba(236,72,153,.7); }
  to{ border-color:#f9a8d4; box-shadow: 0 0 22px rgba(236,72,153,1); }
}
.bb-cb.tl{ left:0; top:0; border-right:none; border-bottom:none; border-radius:8px 0 0 0; }
.bb-cb.tr{ right:0; top:0; border-left:none; border-bottom:none; border-radius:0 8px 0 0; }
.bb-cb.bl{ left:0; bottom:0; border-right:none; border-top:none; border-radius:0 0 0 8px; }
.bb-cb.br{ right:0; bottom:0; border-left:none; border-top:none; border-radius:0 0 8px 0; }
.bb-cd{
  position:absolute; left:50%; top:50%; width:9px; height:9px; margin:-4.5px 0 0 -4.5px;
  border-radius:50%; background:#fff;
  box-shadow: 0 0 14px #ec4899, 0 0 28px #a855f7;
}

/* ---------- 揭晓 ---------- */
.bb-reveal{
  position:absolute; inset:0; z-index:60; display:none;
  align-items:center; justify-content:center;
  padding: clamp(6px,1.4vh,18px);
  background: radial-gradient(circle at 50% 46%, rgba(60,14,72,.72), rgba(8,3,14,.92));
  backdrop-filter: blur(5px);
}
.bb-reveal.active{ display:flex; }
.bb-panel{
  width: min(93%, 960px);
  height: min(80%, 540px);
  display:flex; flex-direction:column;
  gap: clamp(4px,.9vh,10px);
  padding: clamp(8px,1.4vh,18px) clamp(10px,1.6vw,24px);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(88,28,135,.55), rgba(24,8,32,.92));
  border: 2px solid rgba(236,72,153,.65);
  box-shadow: 0 0 70px rgba(236,72,153,.5), 0 0 130px rgba(168,85,247,.35), 0 24px 60px rgba(0,0,0,.85);
  animation: bbPanelIn .48s cubic-bezier(.34,1.46,.64,1);
  overflow:hidden;
}
@keyframes bbPanelIn{ from{ opacity:0; transform: translateY(30px) scale(.85); } to{ opacity:1; transform:none; } }
.bb-panel-hd{
  text-align:center; font-weight:900; letter-spacing:.28em;
  font-size: clamp(12px,1.95vh,18px);
  color:#fbcfe8;
  text-shadow: 0 0 18px rgba(236,72,153,.95);
  border-bottom:1px dashed rgba(236,72,153,.45);
  padding-bottom: clamp(3px,.7vh,8px);
  flex-shrink:0;
}
.bb-list{
  flex:1; min-height:0;
  display:grid; justify-content:center; align-content:center;
  position:relative;
}
.bb-item{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1px; border-radius:16px; overflow:hidden; padding:4px 6px;
  background: radial-gradient(circle at 34% 26%, rgba(255,255,255,.30), rgba(236,72,153,.28) 46%, rgba(168,85,247,.22) 100%);
  border:1.5px solid rgba(236,72,153,.62);
  box-shadow: 0 0 22px rgba(236,72,153,.35), inset 0 0 22px rgba(255,255,255,.12);
  animation: bbItemIn .45s cubic-bezier(.34,1.56,.64,1) backwards;
}
@keyframes bbItemIn{ from{ opacity:0; transform: scale(.55); } to{ opacity:1; transform:none; } }
.bb-item .bb-id{ color:#fbcfe8; opacity:.9; }
.bb-item .bb-nm{
  color:#ffffff; font-weight:900; white-space:nowrap;
  max-width:100%; overflow:hidden; text-overflow:ellipsis;
  text-shadow: 0 0 18px rgba(236,72,153,1);
}
.bb-panel-ft{
  text-align:center; color:#f9a8d4; opacity:.72;
  font-size: clamp(9px,1.3vh,12px); letter-spacing:.08em; flex-shrink:0;
}
`,

  body: `
<canvas id="bb-bg"></canvas>
<div class="bb-field" id="bb-field">
  <div class="bb-bubbles" id="bb-bubbles" data-dyn></div>
  <div class="bb-cross" id="bb-cross">
    <span class="bb-cb tl"></span><span class="bb-cb tr"></span>
    <span class="bb-cb bl"></span><span class="bb-cb br"></span>
    <span class="bb-cd"></span>
  </div>
</div>
<div class="bb-reveal" id="bb-reveal">
  <div class="bb-panel">
    <div class="bb-panel-hd">🫧 本 轮 爆 破 名 单 🫧</div>
    <div class="bb-list" id="bb-list" data-dyn></div>
    <div class="bb-panel-ft">按 空格 继续下一轮 · 按 Esc 收起</div>
  </div>
</div>`
};
