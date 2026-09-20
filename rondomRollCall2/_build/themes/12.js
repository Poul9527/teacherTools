module.exports = {
  dir: '12-盲盒拆拆乐点名',
  title: '盲盒拆拆乐',
  badge: '潮玩拆盒版',
  icon: '📦',
  accent: '#a855f7',
  accent2: '#ec4899',
  color: '#180a24',
  historyTitle: '本轮开出名单',
  desc: '舞台正中躺着一只鼓鼓的潮玩盲盒，锯齿封条下透出一点金光。摇人时袋子高频抖动、撕口一点点变长，你也可以按住封条自己往外扯。撕拉一声上下两半飞开，中选者像亚克力立牌一样弹出来站成一排。',
  tags: ['盲盒', '拆盒', '潮玩', '立牌'],
  musicNote: '明亮流行，方块波短琶音 + 拍手节拍，拆盒瞬间的雀跃感',

  music: {
    bpm: 116,
    root: 57,
    stepsPerBar: 16,
    chords: [[0, 4, 7, 11], [7, 11, 14, 18], [9, 13, 16, 20], [5, 9, 12, 16]],
    pad: { wave: 'triangle', vol: 0.055, oct: 1, dur: 1.06, atk: 0.46, cut: 2600 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 1, 0], oct: 0, vol: 0.080, wave: 'triangle', dur: 3, cut: 440 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'square', vol: 0.030, oct: 2, dur: 0.62 },
    drums: 'clap',
    drumVol: 0.55,
    swing: 0,
    reverb: 0.34,
    delay: 0.28,
    bells: true
  },
  sfx: { win: 'chime' },

  css: `
:root{
  --accent:#a855f7;
  --accent2:#ec4899;
  --bg: radial-gradient(circle at 50% 4%, #34125c 0%, #1c0b2c 48%, #07030d 100%);
  --panel: rgba(24,10,36,.84);
  --border: rgba(168,85,247,.26);
  --glow: rgba(236,72,153,.5);
}

.bb-root{ position:absolute; inset:0; overflow:hidden; }

.bb-halo{
  position:absolute; left:50%; top:50%; z-index:0;
  width: min(96vh,74vw); height: min(96vh,74vw);
  background: radial-gradient(circle, rgba(168,85,247,.30) 0%, rgba(236,72,153,.15) 40%, transparent 70%);
  filter: blur(7px);
  animation: bbHalo 5.4s ease-in-out infinite;
}
@keyframes bbHalo{
  0%,100%{ opacity:.62; transform: translate(-50%,-50%) scale(.94); }
  50%{ opacity:1; transform: translate(-50%,-50%) scale(1.05); }
}

.bb-stage{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:2; }
.bb-stage::after{
  content:''; position:absolute; left:50%; bottom:4%; width: min(40vh,30vw); height: clamp(8px,1.6vh,16px);
  transform: translateX(-50%);
  background: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.62), transparent 72%);
  filter: blur(3px);
}

/* ---------- 盲盒本体 ---------- */
.bb-bag{
  position:relative; z-index:3; cursor: grab;
  width: min(34vh,28vw); height: min(56vh,46vw);
  touch-action: none;
  filter: drop-shadow(0 20px 34px rgba(0,0,0,.66));
  animation: bbFloat 3.8s ease-in-out infinite;
}
.bb-bag.grab{ cursor: grabbing; }
.bb-bag.gone{ display:none; }
.bb-bag.shaking{ animation: bbShake .11s linear infinite; }
@keyframes bbFloat{
  0%,100%{ transform: translateY(-1.5%) scale(1); }
  50%{ transform: translateY(1.5%) scale(1.014); }
}
@keyframes bbShake{
  0%{ transform: translate(0,0) rotate(0deg); }
  20%{ transform: translate(-2.3%,-1.1%) rotate(-1.7deg); }
  40%{ transform: translate(2.4%,1.2%) rotate(1.9deg); }
  60%{ transform: translate(-1.9%,.7%) rotate(-1.3deg); }
  80%{ transform: translate(2.1%,-.9%) rotate(1.5deg); }
  100%{ transform: translate(0,0) rotate(0deg); }
}

.bb-top, .bb-bot{
  position:absolute; left:0; right:0; overflow:hidden;
  background-image:
    repeating-linear-gradient(104deg,
      rgba(255,255,255,.11) 0 3px, transparent 3px 9px,
      rgba(0,0,0,.09) 9px 13px, transparent 13px 23px),
    radial-gradient(70% 50% at 28% 16%, rgba(255,255,255,.26), transparent 72%),
    linear-gradient(158deg,#c084fc 0%,#a855f7 34%,#7c3aed 68%,#4c1d95 100%);
  border: 1px solid rgba(255,255,255,.3);
}
.bb-top{ top:0; height:16%; border-radius: 9px 9px 0 0; }
.bb-bot{ top:16%; bottom:0; border-radius: 0 0 12px 12px; }

.bb-saw{
  position:absolute; left:0; right:0; bottom:0; height: clamp(7px,1.3vh,13px);
  z-index:3;
  background: linear-gradient(180deg,#fde047,#f59e0b);
  box-shadow: 0 0 14px rgba(253,224,71,.75);
  clip-path: polygon(0 0, 5% 100%, 10% 0, 15% 100%, 20% 0, 25% 100%, 30% 0, 35% 100%,
    40% 0, 45% 100%, 50% 0, 55% 100%, 60% 0, 65% 100%, 70% 0, 75% 100%, 80% 0,
    85% 100%, 90% 0, 95% 100%, 100% 0);
}
.bb-seam{
  position:absolute; left:0; right:0; top:16%; height:2px; z-index:4;
  margin-top:-1px;
  background: repeating-linear-gradient(90deg,
    rgba(255,255,255,.85) 0 9px, rgba(255,255,255,0) 9px 18px);
  opacity:.75;
}

.bb-mark{
  position:absolute; left:50%; top:2%; transform: translateX(-50%);
  font-size: clamp(14px,3.4vh,34px); font-weight:900; line-height:1;
  color: rgba(255,255,255,.9);
  text-shadow: 0 2px 10px rgba(0,0,0,.45);
}
.bb-band{
  position:absolute; left:0; right:0; top:14%; height:12%;
  background: linear-gradient(90deg, rgba(236,72,153,.9), rgba(249,168,212,.85), rgba(236,72,153,.9));
  box-shadow: 0 0 16px rgba(236,72,153,.55);
}
.bb-brand{
  position:absolute; left:0; right:0; bottom:7%; text-align:center;
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(7px,1.15vh,12px); font-weight:800; letter-spacing: 2px;
  color: rgba(255,255,255,.82);
}
.bb-mark.m2{
  top:40%; font-size: clamp(30px,8.4vh,84px);
  color: rgba(255,255,255,.30);
  text-shadow: 0 0 24px rgba(253,224,71,.55);
}

/* 撕口进度 */
.bb-tear{
  position:absolute; left:0; top:16%; height: clamp(7px,1.25vh,13px);
  margin-top: calc(clamp(7px,1.25vh,13px) / -2);
  width:0%;
  z-index:6; pointer-events:none; border-radius: 4px;
  background: linear-gradient(90deg, rgba(9,3,16,.96), rgba(26,10,40,.92));
  box-shadow: 0 0 14px rgba(253,224,71,.95), 0 0 30px rgba(236,72,153,.6);
  transition: width .07s linear;
}
.bb-tear::after{
  content:''; position:absolute; right:-2px; top:-1px; bottom:-1px; width:5px;
  border-radius:3px; background:#fff8c4;
  box-shadow: 0 0 14px #fde047, 0 0 34px rgba(253,224,71,.85);
}

.bb-burst{
  position:absolute; left:50%; top:16%; width:1px; height:1px; z-index:7;
  pointer-events:none; opacity:0;
  transform: translate(-50%,-50%) scale(0);
  background: radial-gradient(circle, #ffffff 0%, #fde047 26%, rgba(236,72,153,.55) 56%, transparent 72%);
}
.bb-bag.torn .bb-burst{ animation: bbBurst .85s ease-out forwards; }
@keyframes bbBurst{
  0%{ transform: translate(-50%,-50%) scale(0); opacity:1; }
  60%{ opacity:.92; }
  100%{ transform: translate(-50%,-50%) scale(560); opacity:0; }
}
.bb-bag.torn .bb-top{ animation: bbFlyUp .8s cubic-bezier(.2,.72,.3,1) forwards; }
.bb-bag.torn .bb-bot{ animation: bbDrop .76s cubic-bezier(.2,.72,.3,1) forwards; }
@keyframes bbFlyUp{ to{ transform: translate(-6%,-84%) rotate(-15deg); opacity:0; } }
@keyframes bbDrop{ 40%{ transform: translateY(2%) rotate(2deg); } to{ transform: translateY(16%) rotate(6deg); opacity:0; } }

.bb-hint{
  position:absolute; left:50%; bottom:-14%; transform: translateX(-50%);
  white-space:nowrap; font-size: clamp(9px,1.4vh,14px); font-weight:800;
  color:#f9a8d4; opacity:0; transition: opacity .3s;
  text-shadow: 0 0 12px rgba(236,72,153,.8);
}
.bb-hint.on{ opacity:.95; animation: bbHintPulse 1.2s ease-in-out infinite; }
@keyframes bbHintPulse{ 0%,100%{ transform: translateX(-50%) scale(1); } 50%{ transform: translateX(-50%) scale(1.06); } }

/* ---------- 立牌揭晓 ---------- */
.bb-reveal{ position:absolute; inset:0; z-index:8; pointer-events:none; opacity:0; transition: opacity .4s; }
.bb-root.revealed .bb-reveal{ opacity:1; }
.bb-root.revealed .bb-halo{ opacity:.9; }

.bb-rtitle{
  position:absolute; left:0; right:0; top:7%; text-align:center;
  font-size: clamp(13px,2.2vh,25px); font-weight:900;
  letter-spacing: clamp(3px,.8vw,11px);
  color:#fde047; text-shadow: 0 0 22px rgba(253,224,71,.85), 0 0 46px rgba(236,72,153,.6);
}
.bb-rtip{
  position:absolute; left:0; right:0; bottom:3%; text-align:center;
  font-size: clamp(9px,1.35vh,13px); color:#c4b5fd; letter-spacing:1px; opacity:.75;
}

.bb-cards{
  position:absolute; left:5%; right:5%; top:24%; bottom:13%;
  display:grid; justify-content:center; align-content:center;
}
.bb-card{
  position:relative; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:2px;
  border-radius: 12px 12px 7px 7px;
  overflow:hidden;
  background:
    linear-gradient(165deg, rgba(255,255,255,.28), rgba(255,255,255,.07) 36%, rgba(168,85,247,.24) 100%);
  border: 1.5px solid rgba(255,255,255,.52);
  box-shadow:
    inset 0 0 26px rgba(255,255,255,.16),
    0 12px 28px rgba(0,0,0,.5),
    0 0 26px rgba(236,72,153,.4);
  backdrop-filter: blur(3px);
}
.bb-root.revealed .bb-card{ animation: bbPop .52s cubic-bezier(.34,1.56,.64,1) backwards; }
.bb-card::before{
  content:''; position:absolute; top:-60%; left:-34%; width:38%; height:220%;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.45), rgba(255,255,255,0));
  transform: rotate(18deg); pointer-events:none;
}
.bb-card::after{
  content:''; position:absolute; left:50%; bottom:0; transform: translateX(-50%);
  width:54%; height:8%;
  border-radius: 0 0 7px 7px;
  background: linear-gradient(180deg, rgba(236,72,153,.6), rgba(124,58,237,.75));
}
.bb-card .em{ line-height:1; }
.bb-card .nm{
  font-weight:900; color:#fff; line-height:1.1; white-space:nowrap;
  text-shadow: 0 0 18px rgba(236,72,153,.95), 0 2px 7px rgba(0,0,0,.55);
}
.bb-card .id2{
  font-family: ui-monospace, Consolas, monospace; font-weight:800;
  color:#fde047; opacity:.92; white-space:nowrap;
}
@keyframes bbPop{ from{ opacity:0; transform: translateY(46px) scale(.72); } to{ opacity:1; transform:none; } }
`,
  body: `
<div class="bb-root" id="bb-root">
  <div class="bb-halo"></div>
  <div class="bb-stage">
    <div class="bb-bag" id="bb-bag">
      <div class="bb-top" id="bb-top">
        <div class="bb-mark">?</div>
        <div class="bb-saw"></div>
      </div>
      <div class="bb-bot" id="bb-bot">
        <div class="bb-band"></div>
        <div class="bb-mark m2">?</div>
        <div class="bb-brand">MYSTERY BOX</div>
      </div>
      <div class="bb-seam"></div>
      <div class="bb-tear" id="bb-tear"></div>
      <div class="bb-burst"></div>
      <div class="bb-hint" id="bb-hint">按住封条往右拖，可以自己撕开 →</div>
    </div>
  </div>
  <div class="bb-reveal" id="bb-reveal">
    <div class="bb-rtitle">✦ 本 轮 开 出 ✦</div>
    <div class="bb-cards" id="bb-cards" data-dyn></div>
    <div class="bb-rtip">按 空格 继续抽取 · Esc 收起</div>
  </div>
</div>`
};
