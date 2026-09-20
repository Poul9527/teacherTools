module.exports = {
  dir: '07-赛车竞速冲刺点名',
  title: '赛车竞速冲刺',
  badge: '极速赛车版',
  icon: '🏎️',
  accent: '#f97316',
  accent2: '#ef4444',
  color: '#140703',
  historyTitle: '本轮冲线名单',
  desc: '三条车道横贯舞台，三辆赛车并排轰鸣，车尾拖着一块高速翻转的名字牌。发车后赛道条纹呼啸后退，车身抖动、轮胎飞转、速度线不断掠过；冲线瞬间黑白方格旗挥动，终点线被撞得火花四溅，冠军名字定格在领奖台上。',
  tags: ['赛车', '三车道', '冲线', '领奖台'],
  musicNote: '摇滚驱动，140 BPM 密集贝斯 + 失真锯齿 Pad，速度感拉满',

  music: {
    bpm: 140,
    root: 45,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 19], [0, 7, 12, 19], [-5, 2, 7, 14], [-3, 4, 9, 16]],
    pad: { wave: 'sawtooth', vol: 0.050, oct: 1, dur: 1.02, atk: 0.50, cut: 2400 },
    bass: { pat: [1, 0, 1, 1, 1, 0, 1, 0], oct: 0, vol: 0.082, wave: 'sawtooth', dur: 3, cut: 520 },
    arp: { pat: [0, 1, 2, 3], wave: 'square', vol: 0.028, oct: 2, dur: 0.8 },
    lead: { pat: [3, 2, 1, 0, 1, 2, 3, -1], wave: 'sawtooth', vol: 0.032, oct: 2, dur: 1.0, extra: 0, atk: 0.02 },
    drums: 'rock',
    drumVol: 0.55,
    reverb: 0.38,
    delay: 0.28,
    bells: false
  },
  sfx: { win: 'arcade' },

  css: `
:root{
  --accent:#f97316;
  --accent2:#ef4444;
  --bg: radial-gradient(circle at 50% 74%, #3a1405 0%, #140703 58%, #070201 100%);
  --panel: rgba(20,7,3,.84);
  --border: rgba(249,115,22,.26);
  --glow: rgba(249,115,22,.55);
}

/* ── 路边掠过的速度光带 ── */
.rc-streaks{ position:absolute; inset:0; z-index:2; pointer-events:none; overflow:hidden; }
.rc-streaks::before, .rc-streaks::after{
  content:''; position:absolute; left:-100%; width:300%; height: 4.4%;
  background-image: repeating-linear-gradient(90deg,
    rgba(249,115,22,0) 0px, rgba(249,115,22,.55) 30px, rgba(249,115,22,0) 64px);
  animation: rcStreak .82s linear infinite;
}
.rc-streaks::before{ top: 5%; }
.rc-streaks::after{ bottom: 4%; animation-duration: .60s; }
@keyframes rcStreak{ from{ transform: translateX(0); } to{ transform: translateX(-64px); } }

/* ── 赛道 ── */
.rc-track{
  position:absolute; left:0; right:0; top:15%; height:70%; z-index:3;
  overflow:hidden;
  border-top: 2px solid rgba(249,115,22,.45);
  border-bottom: 2px solid rgba(249,115,22,.45);
  background: linear-gradient(180deg, #2b1206 0%, #1b0a04 52%, #120603 100%);
  box-shadow: inset 0 0 60px rgba(0,0,0,.75), 0 0 40px rgba(249,115,22,.18);
}
.rc-stripes{ position:absolute; inset:0; overflow:hidden; pointer-events:none; }
.rc-stripes::before{
  content:''; position:absolute; left:-100%; top:0; bottom:0; width:300%;
  background-image: repeating-linear-gradient(90deg,
    rgba(255,255,255,.055) 0px, rgba(255,255,255,.055) 3px,
    rgba(0,0,0,0) 3px, rgba(0,0,0,0) 46px);
  animation: rcScroll 1.05s linear infinite;
}
@keyframes rcScroll{ from{ transform: translateX(0); } to{ transform: translateX(-46px); } }

.rc-lane{ position:relative; height: 33.3333%; }
.rc-lane + .rc-lane::before{
  content:''; position:absolute; left:-100%; right:-100%; top:-2px; height:3px;
  background-image: repeating-linear-gradient(90deg,
    rgba(255,255,255,.40) 0px, rgba(255,255,255,.40) 22px,
    rgba(0,0,0,0) 22px, rgba(0,0,0,0) 44px);
  animation: rcDash .58s linear infinite;
}
@keyframes rcDash{ from{ transform: translateX(0); } to{ transform: translateX(-44px); } }

.rc-runner{
  position:absolute; left:0; top:50%; z-index:4;
  display:flex; align-items:center; gap: clamp(5px,.9vw,14px);
  transform: translateX(0) translateY(-50%);
  will-change: transform;
}
.rc-board{
  position:relative; flex:0 1 auto; min-width:0;
  width: min(30vh, 19vw, 232px); height: min(9vh, 5.6vw, 66px);
  display:flex; align-items:center; gap: clamp(4px,.7vw,10px);
  padding: 0 clamp(6px,1vw,14px);
  border-radius: 12px; overflow:hidden;
  border: 1.5px solid rgba(249,115,22,.75);
  background: linear-gradient(140deg, rgba(249,115,22,.26), rgba(20,7,3,.92));
  box-shadow: 0 0 18px rgba(249,115,22,.32), inset 0 0 16px rgba(249,115,22,.10);
}
.rc-board::after{
  content:''; position:absolute; left:0; right:0; top:0; height:2px;
  background: linear-gradient(90deg, rgba(249,115,22,0), rgba(253,186,116,.95), rgba(249,115,22,0));
}
.rc-bid{ flex:0 0 auto; font-size: clamp(8px,1.28vh,13px); color:#fdba74; }
.rc-bnm{
  flex:1 1 auto; min-width:0; font-weight:900; color:#fff; line-height:1.1;
  font-size: clamp(14px,3.2vh,36px);
  white-space:nowrap; overflow:hidden;
  text-shadow: 0 0 14px rgba(249,115,22,.85);
}

/* ── 赛车 ── */
.rc-car{ position:relative; flex:0 0 auto; width: min(19vh,12vw,140px); height: min(9vh,5.6vw,66px); }
.rc-chassis{
  position:absolute; left:0; right:0; bottom: 16%; height: 50%;
  border-radius: 32% 48% 18% 20% / 66% 74% 34% 34%;
  background: linear-gradient(180deg,#fb923c,#ea580c 48%,#9a3412 100%);
  box-shadow: inset 0 3px 0 rgba(255,255,255,.45), 0 6px 12px rgba(0,0,0,.5);
}
.rc-helm{
  position:absolute; left:33%; bottom: 58%; width: 25%; height: 32%;
  border-radius: 50% 50% 32% 32%;
  background: linear-gradient(180deg,#f8fafc,#94a3b8);
  box-shadow: inset 0 -2px 4px rgba(0,0,0,.35);
}
.rc-spoiler{
  position:absolute; right:-2%; bottom: 64%; width: 27%; height: 15%;
  border-radius: 3px; background: linear-gradient(180deg,#f1f5f9,#94a3b8);
  box-shadow: 0 2px 4px rgba(0,0,0,.45);
}
.rc-wheel{
  position:absolute; bottom: -4%; width: 30%; height: 30%; border-radius:50%;
  background: radial-gradient(circle at 50% 50%, #cbd5e1 0 20%, #334155 24% 100%);
  border: 2px solid #0f172a;
}
.rc-wheel::after{
  content:''; position:absolute; inset: 28%; border-radius:50%;
  border-top: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8;
}
.rc-w1{ left: 7%; }
.rc-w2{ right: 9%; }
.rc-runner.on .rc-wheel{ animation: rcWheel .20s linear infinite; }
.rc-runner.on .rc-car{ animation: rcShake .10s linear infinite; }
@keyframes rcWheel{ from{ transform: rotate(0deg); } to{ transform: rotate(360deg); } }
@keyframes rcShake{
  0%{ transform: translate(0,0); }
  33%{ transform: translate(-1px,-2px); }
  66%{ transform: translate(1px,1px); }
  100%{ transform: translate(0,0); }
}

/* ── 终点线 + 方格旗 ── */
.rc-finish{
  position:absolute; right:5.5%; top:0; bottom:0; width: min(3.4vh,2.4vw,28px); z-index:5;
  background-color:#0b0b0b;
  background-image:
    linear-gradient(45deg, #ffffff 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, #ffffff 75%),
    linear-gradient(45deg, #ffffff 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, #ffffff 75%);
  background-size: 16px 16px;
  background-position: 0 0, 8px 8px;
  box-shadow: 0 0 22px rgba(255,255,255,.45);
}
.rc-finish.hit{ animation: rcFinishHit .45s ease-out; }
@keyframes rcFinishHit{
  0%{ filter: brightness(3.4); box-shadow: 0 0 60px rgba(253,224,71,1); }
  100%{ filter: brightness(1); }
}
.rc-flag{
  position:absolute; right: 3.4%; top: 3%; z-index:6;
  height: 11%; display:flex; align-items:flex-start; gap:0;
}
.rc-flag i{
  width: clamp(2px,.4vw,5px); height:100%; border-radius:2px;
  background: linear-gradient(180deg,#e2e8f0,#64748b);
  box-shadow: 0 0 8px rgba(0,0,0,.6);
}
.rc-flag b{
  display:block; width: min(11vh,7vw,86px); height: 74%;
  margin-left:-1px; border-radius: 2px 6px 6px 2px;
  transform-origin: left center;
  background-color:#0b0b0b;
  background-image:
    linear-gradient(45deg, #ffffff 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, #ffffff 75%),
    linear-gradient(45deg, #ffffff 25%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 75%, #ffffff 75%);
  background-size: 14px 14px;
  background-position: 0 0, 7px 7px;
  animation: rcWave 1.15s ease-in-out infinite;
}
.rc-flag.on b{ animation-duration: .42s; box-shadow: 0 0 22px rgba(253,224,71,.9); }
@keyframes rcWave{
  0%{ transform: skewY(0deg) scaleX(1); }
  25%{ transform: skewY(-5deg) scaleX(.93); }
  50%{ transform: skewY(4deg) scaleX(1); }
  75%{ transform: skewY(-2deg) scaleX(.96); }
  100%{ transform: skewY(0deg) scaleX(1); }
}

/* ── 揭晓：领奖台 ── */
.rc-reveal{
  position:absolute; inset:0; z-index:60; display:none;
  background: radial-gradient(circle at 50% 46%, rgba(58,22,7,.92), rgba(10,3,1,.96));
  backdrop-filter: blur(3px);
}
.rc-reveal.active{ display:block; }
.rc-rv-label{
  position:absolute; left:0; right:0; top: clamp(4px,2vh,22px); text-align:center;
  font-size: clamp(11px,1.9vh,17px); font-weight:900;
  letter-spacing: clamp(2px,.8vw,7px); color:#fdba74;
  text-shadow: 0 0 20px rgba(249,115,22,.95);
}
.rc-rv-tip{
  position:absolute; left:0; right:0; bottom: clamp(3px,1.2vh,12px); text-align:center;
  font-size: clamp(10px,1.38vh,13px); color:#a1826f; letter-spacing:1px;
}
#rc-rv-box{
  position:absolute; left:2.5%; right:2.5%;
  top: clamp(28px,7.8vh,70px); bottom: clamp(20px,5vh,42px);
  display:grid; justify-content:center; align-content:center;
}
.rc-card{
  position:relative; display:flex; flex-direction:column; align-items:center; justify-content:flex-end;
  gap: clamp(1px,.4vh,5px); overflow:hidden; border-radius: 12px;
  padding-top: clamp(4px,1vh,12px);
  border: 1.5px solid rgba(249,115,22,.65);
  background: linear-gradient(180deg, rgba(20,7,3,.78), rgba(249,115,22,.14));
  box-shadow: 0 0 22px rgba(249,115,22,.28), inset 0 0 24px rgba(249,115,22,.08);
  animation: rcCardIn .5s cubic-bezier(.34,1.56,.64,1) backwards;
}
.rc-card .rc-medal{ font-size: clamp(13px,2.9vh,32px); line-height:1; }
.rc-card:first-child{ border-color:#fbbf24; box-shadow: 0 0 30px rgba(251,191,36,.5), inset 0 0 26px rgba(251,191,36,.12); }
.rc-card .rc-nm{
  font-weight:900; color:#fff; line-height:1.1;
  text-shadow: 0 0 16px rgba(249,115,22,.9);
  white-space:nowrap; max-width:96%; overflow:hidden;
}
.rc-card .rc-id{ font-size: clamp(9px,1.4vh,14px); color:#fdba74; }
.rc-card .rc-step{
  width:100%; margin-top:auto; flex:0 0 auto;
  display:flex; align-items:center; justify-content:center;
  background: linear-gradient(180deg, rgba(249,115,22,.46), rgba(120,53,15,.72));
  border-top: 2px solid rgba(253,186,116,.9);
  font-weight:900; color:#fff7ed; font-size: clamp(11px,2vh,20px);
}
@keyframes rcCardIn{ from{ opacity:0; transform: translateY(26px) scale(.82); } to{ opacity:1; transform:none; } }
`,

  body: `
<div class="rc-streaks"></div>

<div class="rc-track" id="rc-track">
  <div class="rc-stripes"></div>

  <div class="rc-lane">
    <div class="rc-runner">
      <div class="rc-board"><span class="rc-bid id-tag">NO.--</span><b class="rc-bnm">准备发车</b></div>
      <div class="rc-car">
        <i class="rc-wheel rc-w1"></i><i class="rc-wheel rc-w2"></i>
        <span class="rc-chassis"></span><span class="rc-helm"></span><span class="rc-spoiler"></span>
      </div>
    </div>
  </div>

  <div class="rc-lane">
    <div class="rc-runner">
      <div class="rc-board"><span class="rc-bid id-tag">NO.--</span><b class="rc-bnm">准备发车</b></div>
      <div class="rc-car">
        <i class="rc-wheel rc-w1"></i><i class="rc-wheel rc-w2"></i>
        <span class="rc-chassis"></span><span class="rc-helm"></span><span class="rc-spoiler"></span>
      </div>
    </div>
  </div>

  <div class="rc-lane">
    <div class="rc-runner">
      <div class="rc-board"><span class="rc-bid id-tag">NO.--</span><b class="rc-bnm">准备发车</b></div>
      <div class="rc-car">
        <i class="rc-wheel rc-w1"></i><i class="rc-wheel rc-w2"></i>
        <span class="rc-chassis"></span><span class="rc-helm"></span><span class="rc-spoiler"></span>
      </div>
    </div>
  </div>

  <div class="rc-finish" id="rc-finish"></div>
</div>

<div class="rc-flag" id="rc-flag"><i></i><b></b></div>

<div class="rc-reveal" id="rc-reveal">
  <div class="rc-rv-label">🏁 冲 线 颁 奖 · 本 轮 中 选 🏁</div>
  <div class="rc-rv-box" id="rc-rv-box" data-dyn></div>
  <div class="rc-rv-tip">按 空格 继续抽取 · 按 Esc 收起</div>
</div>`
};
