module.exports = {
  dir: '03-老虎机摇号点名',
  title: '老虎机摇号',
  badge: '街机拉杆版',
  icon: '🎰',
  accent: '#ef4444',
  accent2: '#f59e0b',
  color: '#180606',
  historyTitle: '本轮出奖名单',
  desc: '街机柜的霓虹灯管亮起，三列滚轮开始疯转，屏幕上的名字糊成一道残影。你猛拉右侧的机械拉杆，滚轮逐列咔哒锁定——三重同名，金币从柜顶哗啦啦砸下来，整个机柜都在震。',
  tags: ['老虎机', '8-bit', '机械拉杆', '金币'],
  musicNote: '复古 8-bit 街机：方波主音 + 摇摆鼓组，148 BPM 的电子厅感',

  music: {
    bpm: 148,
    root: 52,
    stepsPerBar: 16,
    chords: [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 1, 5, 8], [3, 7, 10, 14]],
    pad: { wave: 'square', vol: 0.024, oct: 1, dur: 1.02, atk: 0.30, cut: 1300 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 1, 0], oct: 0, vol: 0.072, wave: 'square', dur: 1.5, cut: 520 },
    arp: { pat: [0, 2, 4, 6, 4, 2, 0, 2], wave: 'square', vol: 0.024, oct: 2, dur: 0.8 },
    lead: { pat: [4, 3, 4, 2, 4, 5, 4, -1], wave: 'square', vol: 0.032, oct: 2, dur: 1.0, extra: 0 },
    drums: 'swing',
    drumVol: 0.55,
    swing: 0.22,
    reverb: 0.24,
    delay: 0.20,
    bells: false
  },
  sfx: { win: 'arcade' },

  css: `
:root{
  --accent:#ef4444;
  --accent2:#f59e0b;
  --bg: radial-gradient(circle at 50% 0%, #3b0a0a 0%, #1e0505 46%, #0a0101 100%);
  --panel: rgba(24,6,6,.84);
  --border: rgba(239,68,68,.30);
  --glow: rgba(239,68,68,.55);
}

.sl-stage{ position:absolute; inset:0; overflow:hidden; }
/* 街机厅地板 */
.sl-stage::before{
  content:''; position:absolute; left:-8%; right:-8%; bottom:0; height:30%;
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 44px, rgba(255,255,255,0) 44px 88px),
    linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.62));
  pointer-events:none;
}
.sl-stage::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 50% 44%, rgba(239,68,68,.20), rgba(245,158,11,.07) 44%, transparent 68%);
}

.cab-wrap{
  position:absolute; left:50%; top:50%; transform: translate(-50%,-50%);
  display:flex; align-items:center; gap: 1.2%;
  width: min(94vw, 126vh); height: min(88vh, 62vw);
}

/* ---------- 机柜 ---------- */
.cab{
  position:relative; flex:1; height:100%; min-width:0;
  display:flex; flex-direction:column;
  gap: 2%;
  padding: 2.6% 3.2% 2%;
  border-radius: clamp(10px,1.7vh,22px);
  background: linear-gradient(168deg,#3d1111 0%,#1d0606 48%,#120303 100%);
  border: clamp(2px,.42vh,5px) solid #f59e0b;
  box-shadow: 0 0 0 clamp(1px,.2vh,3px) rgba(0,0,0,.7),
              0 18px 52px rgba(0,0,0,.78),
              inset 0 0 70px rgba(239,68,68,.18);
}
.cab.rolling{ box-shadow: 0 0 0 clamp(1px,.2vh,3px) rgba(0,0,0,.7),
              0 18px 52px rgba(0,0,0,.78), 0 0 44px rgba(245,158,11,.6),
              inset 0 0 70px rgba(239,68,68,.28); }
.cab.win{ animation: cabWin 1.1s ease-out; }
@keyframes cabWin{
  0%{ box-shadow: 0 0 0 3px rgba(0,0,0,.7), 0 0 90px rgba(253,224,71,1), inset 0 0 90px rgba(253,224,71,.5); }
  100%{ box-shadow: 0 0 0 3px rgba(0,0,0,.7), 0 18px 52px rgba(0,0,0,.78), inset 0 0 70px rgba(239,68,68,.18); }
}

/* 柜顶柜底跑马灯 */
.bulb{
  position:absolute; width:1.5%; padding-bottom:1.5%; height:0;
  border-radius:50%; transform: translate(-50%,-50%);
  background: radial-gradient(circle at 34% 30%, #fffbe8, #fbbf24 52%, #b45309 100%);
  box-shadow: 0 0 9px rgba(253,224,71,.95);
  animation: bulbBlink 1.5s ease-in-out infinite;
  pointer-events:none;
}
.cab.rolling .bulb{ animation-duration:.24s; }
@keyframes bulbBlink{ 0%,100%{ opacity:.28; transform:translate(-50%,-50%) scale(.82); } 50%{ opacity:1; transform:translate(-50%,-50%) scale(1.06); } }

.cab-head{ flex:0 0 auto; text-align:center; line-height:1.1; }
.cab-title{
  display:block; font-size: clamp(12px,2.5vh,28px); font-weight:900; letter-spacing:6px;
  background: linear-gradient(180deg,#fff7d6 8%,#fbbf24 52%,#b45309 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 16px rgba(245,158,11,.85));
}
.cab-sub{ display:block; font-size: clamp(9px,1.3vh,13px); color:#fca5a5; letter-spacing:2px; opacity:.85; }

.cab-screen{
  flex:1; min-height:0; position:relative;
  border-radius: clamp(7px,1.05vh,15px);
  background: linear-gradient(180deg,#0a0202,#180505);
  border: clamp(2px,.32vh,4px) solid rgba(245,158,11,.55);
  box-shadow: inset 0 0 44px rgba(239,68,68,.24), 0 0 22px rgba(0,0,0,.7);
}
.reels{ display:flex; gap:2.6%; height:100%; width:100%; padding:2.4%; position:relative; }
.reel{
  flex:1; min-width:0; position:relative; overflow:hidden;
  border-radius: clamp(5px,.85vh,12px);
  background: linear-gradient(180deg,#fdf6e3,#ffeec2 46%,#f7d68b);
  box-shadow: inset 0 12px 24px rgba(80,30,0,.42), inset 0 -12px 24px rgba(80,30,0,.42);
  transition: box-shadow .16s;
}
.reel-strip{ position:absolute; left:0; right:0; top:0; will-change: transform; }
.reel-item{
  height: var(--ih, 60px);
  display:flex; align-items:center; justify-content:center;
  font-size: calc(var(--ih, 60px) * 0.42);
  font-weight:900; color:#3b1a02; letter-spacing:1px;
  white-space:nowrap; overflow:hidden;
  border-bottom: 1px solid rgba(120,53,15,.20);
  text-shadow: 0 1px 0 rgba(255,255,255,.65);
}
.reel.locked{
  box-shadow: inset 0 12px 24px rgba(80,30,0,.30),
              0 0 32px rgba(245,158,11,1), 0 0 74px rgba(239,68,68,.72);
}
.payline{ position:absolute; inset:2.4%; pointer-events:none; z-index:3;
  border-radius: clamp(5px,.85vh,12px); overflow:hidden; }
.payline::before{
  content:''; position:absolute; left:0; right:0; top:33.333%; height:33.333%;
  border-top: 2px dashed rgba(239,68,68,.62);
  border-bottom: 2px dashed rgba(239,68,68,.62);
  background: linear-gradient(180deg, rgba(239,68,68,.10), rgba(245,158,11,.20), rgba(239,68,68,.10));
  animation: payPulse 1.7s ease-in-out infinite;
}
@keyframes payPulse{ 0%,100%{ opacity:.5 } 50%{ opacity:1 } }

.cab-foot{
  flex:0 0 auto; text-align:center; letter-spacing:2px;
  font-size: clamp(9px,1.4vh,14px); font-weight:700; color:#fca5a5; opacity:.9;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}

/* ---------- 机械拉杆 ---------- */
.lever{ position:relative; flex:0 0 20%; height:100%; cursor:pointer; }
.lever-rod{
  position:absolute; left:50%; top:22%; width:13%; height:58%;
  transform: translateX(-50%);
  background: linear-gradient(90deg,#7f1d1d,#e5e7eb 36%,#9ca3af 58%,#4b5563);
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(0,0,0,.65);
  transition: transform .15s cubic-bezier(.34,1.56,.64,1);
}
.lever-ball{
  position:absolute; left:50%; top:12%; width:64%; padding-bottom:64%; height:0;
  transform: translateX(-50%);
  border-radius:50%;
  background: radial-gradient(circle at 34% 28%, #fff3f3, #ef4444 44%, #7f1d1d 100%);
  box-shadow: 0 0 30px rgba(239,68,68,.95), 0 8px 20px rgba(0,0,0,.65);
  transition: transform .15s cubic-bezier(.34,1.56,.64,1);
}
.lever-slot{
  position:absolute; left:50%; bottom:4%; width:82%; height:13%;
  transform: translateX(-50%);
  border-radius: 8px;
  background: linear-gradient(180deg,#180505,#3d1111);
  border: 1px solid rgba(245,158,11,.45);
  box-shadow: inset 0 5px 12px rgba(0,0,0,.95);
}
.lever-tip{
  position:absolute; left:50%; bottom:-1%; transform: translateX(-50%);
  font-size: clamp(8px,1.2vh,12px); color:#fbbf24; letter-spacing:2px;
  font-weight:800; white-space:nowrap; opacity:.85;
}
.lever.pulled .lever-rod{ transform: translateX(-50%) translateY(30%); }
.lever.pulled .lever-ball{ transform: translateX(-50%) translateY(30%) scale(.9); }
.lever:hover .lever-ball{ box-shadow: 0 0 44px rgba(239,68,68,1), 0 8px 20px rgba(0,0,0,.65); }

/* ---------- 揭晓浮层 ---------- */
.sl-reveal{
  position:absolute; inset:0; z-index:60;
  display:none; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(5px,1.1vh,13px);
  background: radial-gradient(circle at 50% 48%, rgba(59,10,10,.93), rgba(10,1,1,.95));
  backdrop-filter: blur(3px);
}
.sl-reveal.active{ display:flex; }
.sl-label{
  font-size: clamp(11px,1.85vh,16px); letter-spacing:5px; font-weight:900;
  color:#fbbf24; text-shadow: 0 0 20px rgba(245,158,11,.9);
  animation: popIn .4s backwards;
}
.sl-names{ width: min(92vw, 1080px); height: min(46vh, 400px); position:relative; }
.sl-one{
  position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  border-radius: 14px;
  background: linear-gradient(160deg, rgba(245,158,11,.20), rgba(127,29,29,.46));
  border: 3px solid #f59e0b;
  box-shadow: 0 0 32px rgba(245,158,11,.62), inset 0 0 26px rgba(239,68,68,.28);
  animation: slRise .55s cubic-bezier(.34,1.56,.64,1) backwards;
}
.sl-one .sid2{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(10px,1.6vh,15px); color:#fde68a; font-weight:900; opacity:.9;
}
.sl-one .snm2{
  font-size: clamp(24px,6.4vh,64px); font-weight:900; line-height:1.06; letter-spacing:3px;
  background: linear-gradient(180deg,#ffffff 10%,#fde68a 50%,#f59e0b 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 22px rgba(245,158,11,.85));
  white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis;
}
@keyframes slRise{ from{ opacity:0; transform: translateY(26px) scale(.78); } to{ opacity:1; transform:none; } }
.sl-tip{ font-size: clamp(10px,1.5vh,13px); color:#9c6b5b; letter-spacing:1px; }
`,

  body: `
<div class="sl-stage" id="sl-stage">
  <div class="cab-wrap" id="cab-wrap">
    <div class="cab" id="cab">
      <div class="bulbs" id="bulbs" data-dyn></div>
      <div class="cab-head">
        <span class="cab-title">LUCKY SLOT</span>
        <span class="cab-sub">拉下拉杆 · 摇出幸运儿</span>
      </div>
      <div class="cab-screen">
        <div class="reels" id="reels" data-dyn></div>
        <div class="payline"></div>
      </div>
      <div class="cab-foot" id="cab-msg">投入一枚硬币，开始摇号</div>
    </div>
    <div class="lever" id="lever" title="点击拉杆 开始 / 停止">
      <div class="lever-rod"></div>
      <div class="lever-ball"></div>
      <div class="lever-slot"></div>
      <span class="lever-tip">拉我</span>
    </div>
  </div>
</div>
<div class="sl-reveal" id="sl-reveal">
  <div class="sl-label">🎰 本 轮 开 出 的 大 奖 🎰</div>
  <div class="sl-names fit-grid" id="sl-names" data-dyn></div>
  <div class="sl-tip">按 空格 继续抽取 · 按 Esc 收起</div>
</div>`
};
