module.exports = {
  dir: '08-刮刮乐盲盒点名',
  title: '刮刮乐盲盒',
  badge: '刮刮金券版',
  icon: '🪙',
  accent: '#eab308',
  accent2: '#f59e0b',
  color: '#1a1405',
  historyTitle: '本轮刮出名单',
  desc: '一张烫金彩票端端正正摆在桌面，银灰色闪粉涂层底下，压着今天要被点到的名字。摇人时一枚金币来回刮擦沙沙作响，涂层被一点点刮开；停下的一瞬间残余涂层清脆碎裂，金光迸射，中奖同学从金券正中浮现，连卡片边角都在发亮。',
  tags: ['刮刮乐', '金币刮擦', '金券', '盲盒'],
  musicNote: '轻快爵士放克，三角波琶音 + Lofi 鼓组，带摇摆律动',

  music: {
    bpm: 104,
    root: 48,
    stepsPerBar: 16,
    chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [2, 5, 9, 12], [7, 11, 14, 17]],
    pad: { wave: 'sine', vol: 0.052, oct: 1, dur: 1.06, atk: 0.60, cut: 2100 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 1, 0], oct: 0, vol: 0.082, wave: 'triangle', dur: 5, cut: 340 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'triangle', vol: 0.040, oct: 2, dur: 1.15 },
    lead: { pat: [-1, 2, -1, 3, -1, 1, -1, 0], wave: 'triangle', vol: 0.030, oct: 3, dur: 0.75, atk: 0.03 },
    drums: 'lofi',
    drumVol: 0.5,
    swing: 0.2,
    reverb: 0.42,
    delay: 0.28,
    bells: true
  },
  sfx: { win: 'fanfare' },

  css: `
:root{
  --accent:#eab308;
  --accent2:#f59e0b;
  --bg: radial-gradient(circle at 50% 6%, #3d2d07 0%, #1e1706 44%, #0a0703 100%);
  --panel: rgba(30,22,5,.82);
  --border: rgba(234,179,8,.26);
  --glow: rgba(234,179,8,.55);
}
#sc-bg{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }

.sc-wrap{
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(4px,.9vh,12px);
}

/* ---------- 彩票本体 ---------- */
.sc-card{
  position:relative;
  padding: clamp(5px,.95vh,10px);
  border-radius: clamp(12px,1.9vh,22px);
  background: linear-gradient(135deg,#fde68a 0%,#a16207 20%,#fcd34d 40%,#854d0e 60%,#fde68a 80%,#a16207 100%);
  box-shadow: 0 0 0 1px rgba(255,255,255,.25) inset, 0 22px 60px rgba(0,0,0,.8), 0 0 54px rgba(234,179,8,.26);
  transition: box-shadow .3s;
}
.sc-card.won{ box-shadow: 0 0 0 1px rgba(255,255,255,.4) inset, 0 22px 60px rgba(0,0,0,.8), 0 0 90px rgba(253,224,71,.85); }
.sc-inner{
  position:relative; overflow:hidden;
  border-radius: clamp(8px,1.3vh,15px);
  background:#fdf8e6;
}

.sc-face{
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:space-between;
  padding: 6% 5.5%; text-align:center;
  background:
    repeating-linear-gradient(45deg, rgba(180,83,9,.055) 0 7px, rgba(0,0,0,0) 7px 14px),
    radial-gradient(circle at 50% 44%, #fffdf4 0%, #fdf4d6 46%, #f5e2a9 100%);
  overflow:hidden;
}
.sc-face::before{
  content:''; position:absolute; left:50%; top:50%; width:62%; height:62%;
  transform:translate(-50%,-50%); border-radius:50%;
  border:2px dashed rgba(180,83,9,.20);
  pointer-events:none;
}
.sc-face::after{
  content:'¥'; position:absolute; right:4%; bottom:2%;
  font-size: 46%; font-weight:900; color: rgba(180,83,9,.10);
  pointer-events:none;
}
.sc-top{ display:flex; align-items:center; gap:.4em; font-weight:900; color:#92400e; letter-spacing:.08em; position:relative; z-index:2; }
.sc-top .sc-logo{ font-size:1.25em; }
.sc-brand{ white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sc-prize{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.12em; flex:1; min-height:0; width:100%; position:relative; z-index:2; }
.sc-prize-label{ font-weight:800; color:#b45309; letter-spacing:.34em; opacity:.9; }
.sc-prize-id{ color:#a16207; }
.sc-prize-name{
  font-weight:900; line-height:1.08; letter-spacing:.06em;
  background: linear-gradient(180deg,#7c2d12 0%,#b45309 34%,#f59e0b 62%,#78350f 100%);
  -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
  filter: drop-shadow(0 2px 0 rgba(255,255,255,.55));
  max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.sc-card.won .sc-prize-name{
  background: linear-gradient(180deg,#b45309 0%,#facc15 40%,#fff7cc 58%,#b45309 100%);
  -webkit-background-clip:text; background-clip:text;
  filter: drop-shadow(0 0 14px rgba(253,224,71,.9));
}
.sc-bottom{
  display:flex; align-items:center; justify-content:space-between; width:100%;
  font-family: ui-monospace, Consolas, monospace; font-weight:800;
  color:#a16207; opacity:.85; position:relative; z-index:2;
}

/* ---------- 银灰闪粉涂层 ---------- */
#sc-coat{
  position:absolute; inset:0; width:100%; height:100%;
  display:block; cursor: crosshair;
}

/* ---------- 金币光标 ---------- */
.sc-coin{
  position:absolute; left:0; top:0;
  display:flex; align-items:center; justify-content:center;
  pointer-events:none; z-index:6;
  filter: drop-shadow(0 0 12px rgba(253,224,71,.95)) drop-shadow(0 3px 5px rgba(0,0,0,.55));
  transition: opacity .25s;
}
.sc-coin-i{ display:block; animation: coinSpin 1.15s linear infinite; }
@keyframes coinSpin{ 0%{ transform: rotateY(0deg); } 100%{ transform: rotateY(360deg); } }

/* 金光迸射 */
.sc-burst{
  position:absolute; inset:-30%; z-index:7; pointer-events:none; opacity:0;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.95) 0%, rgba(253,224,71,.75) 16%, rgba(234,179,8,.28) 36%, rgba(234,179,8,0) 64%);
}
.sc-burst.on{ animation: scBurst .75s ease-out forwards; }
@keyframes scBurst{
  0%{ opacity:0; transform: scale(.35); }
  22%{ opacity:1; transform: scale(1); }
  100%{ opacity:0; transform: scale(1.5); }
}

/* ---------- 提示 / 进度 ---------- */
.sc-hint{
  font-weight:700; color:#fcd34d; opacity:.78; letter-spacing:.06em;
  text-align:center; max-width:94%; padding:0 8px;
}
.sc-meter{
  position:relative; width: min(62%, 520px); height: clamp(6px,1vh,10px);
  border-radius:99px; background: rgba(255,255,255,.10);
  border:1px solid rgba(234,179,8,.32); overflow:hidden;
  display:flex; align-items:center;
}
.sc-meter i{
  display:block; height:100%; width:0%; border-radius:99px;
  background: linear-gradient(90deg,#a16207,#facc15,#fde68a);
  box-shadow: 0 0 14px rgba(250,204,21,.9);
  transition: width .12s linear;
}
.sc-meter span{
  position:absolute; right:8px; top:50%; transform:translateY(-50%);
  font-family: ui-monospace, Consolas, monospace; font-weight:800;
  color:#fde68a; text-shadow: 0 1px 4px #000;
}

/* ---------- 小票揭晓 ---------- */
.sc-reveal{
  position:absolute; left:50%; bottom: clamp(2px,.6vh,10px); transform:translateX(-50%);
  width: min(94%, 900px); z-index:70; display:none;
  padding: clamp(5px,.8vh,9px) clamp(8px,1.2vw,16px) clamp(6px,1vh,10px);
  background: linear-gradient(180deg,#fffdf5,#f6ecd0);
  border-radius: 4px 4px 10px 10px;
  box-shadow: 0 -2px 0 rgba(0,0,0,.12) inset, 0 14px 40px rgba(0,0,0,.7), 0 0 34px rgba(234,179,8,.35);
  animation: receiptIn .5s cubic-bezier(.34,1.56,.64,1);
}
.sc-reveal::before{
  content:''; position:absolute; left:0; right:0; top:-6px; height:7px;
  background: radial-gradient(circle at 6px 7px, rgba(0,0,0,0) 5.6px, #fffdf5 5.8px) repeat-x;
  background-size: 12px 8px;
}
.sc-reveal.active{ display:block; }
@keyframes receiptIn{ from{ opacity:0; transform:translateX(-50%) translateY(38px); } to{ opacity:1; transform:translateX(-50%) translateY(0); } }
.sc-rc-head{
  text-align:center; font-weight:900; color:#92400e; letter-spacing:.3em;
  font-size: clamp(10px,1.45vh,13px); padding-bottom:3px;
  border-bottom:1px dashed rgba(146,64,14,.45);
}
.sc-rc-list{ display:grid; justify-content:center; align-content:center; height: clamp(38px,6.4vh,58px); margin: 3px 0; }
.sc-rc-item{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:1px; border-radius:7px; padding:2px 4px; overflow:hidden;
  background: linear-gradient(180deg,rgba(234,179,8,.20),rgba(234,179,8,.05));
  border:1px dashed rgba(146,64,14,.5);
  animation: popIn .34s cubic-bezier(.34,1.56,.64,1) backwards;
}
.sc-rc-item .sc-rc-id{ color:#a16207; opacity:.85; }
.sc-rc-item .sc-rc-nm{ color:#7c2d12; font-weight:900; white-space:nowrap; max-width:100%; overflow:hidden; text-overflow:ellipsis; }
.sc-rc-foot{
  text-align:center; font-family: ui-monospace, Consolas, monospace;
  color:#a16207; opacity:.7; font-size: clamp(9px,1.25vh,11px); letter-spacing:.06em;
}
`,

  body: `
<canvas id="sc-bg"></canvas>
<div class="sc-wrap" id="sc-wrap">
  <div class="sc-card" id="sc-card">
    <div class="sc-inner" id="sc-inner">
      <div class="sc-face" id="sc-face">
        <div class="sc-top"><span class="sc-logo">🪙</span><span class="sc-brand">幸运刮刮卡 · LUCKY SCRATCH</span></div>
        <div class="sc-prize">
          <div class="sc-prize-label" id="sc-plabel">恭 喜 中 奖 同 学</div>
          <div class="sc-prize-id id-tag" id="sc-pid">--</div>
          <div class="sc-prize-name" id="sc-pname">？ ？ ？</div>
        </div>
        <div class="sc-bottom"><span>NO. 0000 0000 0000</span><span>¥ 1,000,000</span></div>
      </div>
      <canvas id="sc-coat"></canvas>
      <div class="sc-coin" id="sc-coin"><span class="sc-coin-i">🪙</span></div>
      <div class="sc-burst" id="sc-burst"></div>
    </div>
  </div>
  <div class="sc-hint" id="sc-hint">按住鼠标在卡片上刮一刮 · 或直接按空格开始点名</div>
  <div class="sc-meter"><i id="sc-bar"></i><span id="sc-pct">0%</span></div>
</div>
<div class="sc-reveal" id="sc-reveal">
  <div class="sc-rc-head">✦ 本 轮 刮 出 名 单 ✦</div>
  <div class="sc-rc-list" id="sc-rc-list" data-dyn></div>
  <div class="sc-rc-foot">凭此券向老师兑换今日的幸运 · 按 Esc 收起</div>
</div>`
};
