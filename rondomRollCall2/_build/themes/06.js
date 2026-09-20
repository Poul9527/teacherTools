module.exports = {
  dir: '06-欢乐扭蛋机点名',
  title: '欢乐扭蛋机',
  badge: '童趣扭蛋版',
  icon: '🎁',
  accent: '#f43f5e',
  accent2: '#fbbf24',
  color: '#2a0a14',
  historyTitle: '本轮开出名单',
  desc: '一台超大卡通扭蛋机立在舞台中央，玻璃球仓里装满彩色双色小蛋，每颗蛋上都写着一个名字。开始摇动时小蛋疯狂翻滚碰撞、旋钮呼呼转动；停下后一颗金色特制蛋从出蛋口滚出，落到舞台中央啪地炸开，礼花与星星一起飞散。',
  tags: ['扭蛋', '物理弹跳', '金色特制蛋', '童趣'],
  musicNote: '明亮大调，112 BPM 拍手节奏 + 短促跳跃的铃铛琶音，轻快童趣',

  music: {
    bpm: 112,
    root: 55,
    stepsPerBar: 16,
    chords: [[0, 4, 7, 11], [2, 5, 9, 12], [-3, 4, 7, 12], [0, 4, 9, 14]],
    pad: { wave: 'triangle', vol: 0.055, oct: 1, dur: 1.02, atk: 0.35, cut: 2600 },
    bass: { pat: [1, 0, 0, 1, 0, 0, 1, 0], oct: 0, vol: 0.080, wave: 'triangle', dur: 3, cut: 540 },
    arp: { pat: [0, 1, 2, 3, 2, 1, 0, 2], wave: 'sine', vol: 0.042, oct: 2, dur: 0.5 },
    lead: { pat: [4, 3, 2, 1, 2, 3, 4, -1], wave: 'triangle', vol: 0.030, oct: 2, dur: 0.8, extra: 0, atk: 0.02 },
    drums: 'clap',
    drumVol: 0.50,
    reverb: 0.44,
    delay: 0.26,
    bells: true
  },
  sfx: { win: 'chime' },

  css: `
:root{
  --accent:#f43f5e;
  --accent2:#fbbf24;
  --bg: radial-gradient(circle at 50% 30%, #4a1226 0%, #2a0a14 52%, #140309 100%);
  --panel: rgba(42,10,20,.84);
  --border: rgba(244,63,94,.28);
  --glow: rgba(244,63,94,.55);
}

.gg-scene{ position:absolute; inset:0; z-index:3; }

/* ── 糖果背景光斑 ── */
.gg-dots{
  position:absolute; inset:0; z-index:1; pointer-events:none; opacity:.5;
  background-image:
    radial-gradient(circle at 12% 18%, rgba(251,191,36,.30) 0 6px, rgba(0,0,0,0) 7px),
    radial-gradient(circle at 86% 26%, rgba(244,63,94,.32) 0 8px, rgba(0,0,0,0) 9px),
    radial-gradient(circle at 22% 82%, rgba(56,189,248,.24) 0 7px, rgba(0,0,0,0) 8px),
    radial-gradient(circle at 74% 88%, rgba(251,191,36,.22) 0 9px, rgba(0,0,0,0) 10px);
}
.gg-floor{
  position:absolute; left:0; right:0; bottom:0; height: clamp(28px,7vh,64px); z-index:1; pointer-events:none;
  background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,.55));
}

/* ── 扭蛋机本体 ── */
.gg-machine{
  position:absolute; left:50%; top:1.2%; transform: translateX(-50%);
  z-index:6; display:flex; flex-direction:column; align-items:center;
  filter: drop-shadow(0 16px 30px rgba(0,0,0,.62));
}
.gg-hat{
  width: min(11vh,7.4vw,94px); height: min(11vh,7.4vw,94px);
  border-radius: 50%; margin-bottom: -7%; position:relative; z-index:4;
  background: radial-gradient(circle at 36% 30%, #fff6d8, #fbbf24 46%, #b45309 100%);
  border: 3px solid rgba(255,255,255,.45);
}
.gg-dome{
  position:relative; z-index:3;
  width: min(30vh, 21vw, 266px); height: min(30vh, 21vw, 266px);
  border-radius: 50%; overflow:hidden;
  border: 4px solid rgba(255,255,255,.34);
  background: radial-gradient(circle at 34% 26%, rgba(255,255,255,.30), rgba(190,230,255,.10) 42%, rgba(255,255,255,.03) 62%, rgba(20,6,14,.14) 100%);
  box-shadow: inset -10px -14px 40px rgba(120,180,255,.22), inset 10px 12px 30px rgba(255,255,255,.14), 0 0 32px rgba(244,63,94,.30);
}
#gg-ball{ position:absolute; inset:0; width:100%; height:100%; display:block; }
.gg-shine{
  position:absolute; left:12%; top:7%; width:34%; height:23%; border-radius:50%;
  background: linear-gradient(180deg, rgba(255,255,255,.62), rgba(255,255,255,0));
  transform: rotate(-24deg); pointer-events:none;
}
.gg-machine.on .gg-dome{ animation: ggRattle .13s linear infinite; }
@keyframes ggRattle{
  0%{ transform: translate(0,0) rotate(0deg); }
  25%{ transform: translate(-2px,1px) rotate(-.7deg); }
  50%{ transform: translate(2px,-1px) rotate(.6deg); }
  75%{ transform: translate(-1px,-2px) rotate(-.4deg); }
  100%{ transform: translate(0,0) rotate(0deg); }
}

.gg-body{
  position:relative; z-index:2; margin-top: -3.5%;
  width: min(31vh, 21.6vw, 274px);
  padding: clamp(6px,1.2vh,12px) clamp(8px,1.1vw,14px) clamp(8px,1.5vh,16px);
  border-radius: 16px 16px 26px 26px;
  background: linear-gradient(180deg,#f43f5e 0%,#be123c 44%,#7f1d1d 100%);
  border: 3px solid rgba(255,255,255,.30);
  box-shadow: inset 0 6px 14px rgba(255,255,255,.22), inset 0 -10px 22px rgba(0,0,0,.38), 0 14px 30px rgba(0,0,0,.5);
  display:flex; flex-direction:column; align-items:center; gap: clamp(4px,.9vh,10px);
}
.gg-plate{
  width:100%; text-align:center; border-radius:8px; padding: clamp(2px,.45vh,6px) 0;
  background: linear-gradient(180deg,#fff7e0,#fcd34d);
  color:#7f1d1d; font-weight:900; letter-spacing:2px;
  font-size: clamp(9px,1.6vh,15px);
  box-shadow: inset 0 -2px 0 rgba(180,83,9,.45);
}
.gg-row{ width:100%; display:flex; align-items:center; justify-content:flex-start; gap: clamp(6px,1vw,12px); }
.gg-knob{
  position:relative; flex:0 0 auto;
  width: min(9vh,6vw,70px); height: min(9vh,6vw,70px);
  border-radius:50%;
  background: conic-gradient(#fff3c4,#f59e0b,#b45309,#fbbf24,#fff3c4);
  border: 3px solid rgba(255,255,255,.5);
  box-shadow: 0 5px 12px rgba(0,0,0,.45), inset 0 0 12px rgba(120,53,15,.55);
}
.gg-knob i{
  position:absolute; left:50%; top:50%; width:64%; height:10%;
  transform: translate(-50%,-50%) rotate(28deg);
  border-radius:4px; background: linear-gradient(180deg,#7f1d1d,#450a0a);
}
.gg-knob.on{ animation: ggSpin .42s linear infinite; }
@keyframes ggSpin{ from{ transform: rotate(0deg); } to{ transform: rotate(360deg); } }
.gg-slot{
  position:relative; flex:1 1 auto; height: min(7.4vh,5vw,60px);
  border-radius: 8px 8px 14px 14px; overflow:hidden;
  background: linear-gradient(180deg,#2a0a14,#12040a);
  box-shadow: inset 0 5px 12px rgba(0,0,0,.88), 0 1px 0 rgba(255,255,255,.18);
  display:flex; align-items:center; justify-content:center;
}
.gg-slot span{
  width: 68%; height: 56%; border-radius: 50% 50% 46% 46%;
  background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0));
  box-shadow: inset 0 0 10px rgba(0,0,0,.6);
}
.gg-chute{
  width: 56%; height: clamp(5px,1.2vh,14px); margin-top: -2px;
  border-radius: 0 0 12px 12px;
  border: 2px solid rgba(255,255,255,.22); border-top:none;
  background: linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,0));
}

/* ── 金色特制蛋 ── */
.gg-gold{
  position:absolute; left:0; top:0; z-index:20; display:none;
  align-items:center; justify-content:center;
  width: min(14vh,9.4vw,104px); height: min(17vh,11.4vw,126px);
  border-radius: 50% 50% 48% 48% / 58% 58% 42% 42%;
  background: radial-gradient(circle at 34% 26%, #fffbeb, #fcd34d 38%, #f59e0b 68%, #b45309 100%);
  border: 3px solid rgba(255,255,255,.78);
  box-shadow: 0 0 30px rgba(251,191,36,.85), 0 10px 22px rgba(0,0,0,.5), inset -6px -8px 18px rgba(146,64,14,.5);
  transform: translate(-50%,-50%);
}
.gg-gold.show{ display:flex; }
.gg-gold b{
  font-size: clamp(11px,2.2vh,24px); font-weight:900; color:#7f1d1d;
  text-shadow: 0 1px 0 rgba(255,255,255,.65);
  white-space:nowrap; max-width:96%; overflow:hidden;
}

/* ── 揭晓浮层 ── */
.gg-reveal{
  position:absolute; inset:0; z-index:60; display:none;
  background: radial-gradient(circle at 50% 50%, rgba(58,12,28,.92), rgba(16,3,9,.96));
  backdrop-filter: blur(3px);
}
.gg-reveal.active{ display:block; }
.gg-rv-label{
  position:absolute; left:0; right:0; top: clamp(4px,2vh,22px); text-align:center;
  font-size: clamp(11px,1.9vh,17px); font-weight:900;
  letter-spacing: clamp(2px,.8vw,7px); color:#fcd34d;
  text-shadow: 0 0 20px rgba(251,191,36,.9);
}
.gg-rv-tip{
  position:absolute; left:0; right:0; bottom: clamp(3px,1.2vh,12px); text-align:center;
  font-size: clamp(10px,1.38vh,13px); color:#b98a95; letter-spacing:1px;
}
#gg-rv-box{
  position:absolute; left:2.5%; right:2.5%;
  top: clamp(28px,7.8vh,70px); bottom: clamp(20px,5vh,42px);
  display:grid; justify-content:center; align-content:center;
}
.gg-card{
  position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(1px,.5vh,6px); border-radius: 18px; overflow:hidden;
  border: 2px solid rgba(251,191,36,.85);
  background: linear-gradient(165deg, rgba(244,63,94,.34), rgba(251,191,36,.20) 62%, rgba(42,10,20,.92));
  box-shadow: 0 0 26px rgba(244,63,94,.40), inset 0 0 24px rgba(251,191,36,.14);
  animation: ggCardIn .55s cubic-bezier(.34,1.56,.64,1) backwards;
}
.gg-card .gc-egg{ font-size: clamp(13px,2.9vh,32px); line-height:1; }
.gg-card .gc-nm{
  font-weight:900; color:#fff; line-height:1.12;
  text-shadow: 0 0 18px rgba(251,191,36,.85);
  white-space:nowrap; max-width:96%; overflow:hidden;
}
.gg-card .gc-id{ font-size: clamp(9px,1.4vh,14px); color:#fcd34d; letter-spacing:1px; }
@keyframes ggCardIn{ from{ opacity:0; transform: translateY(22px) scale(.74) rotate(-4deg); } to{ opacity:1; transform:none; } }
`,

  body: `
<div class="gg-dots"></div>
<div class="gg-floor"></div>

<div class="gg-scene" id="gg-scene">
  <div class="gg-machine" id="gg-machine">
    <div class="gg-hat"></div>
    <div class="gg-dome" id="gg-dome">
      <canvas id="gg-ball"></canvas>
      <div class="gg-shine"></div>
    </div>
    <div class="gg-body">
      <div class="gg-plate">欢 乐 扭 蛋 机</div>
      <div class="gg-row">
        <div class="gg-knob" id="gg-knob"><i></i></div>
        <div class="gg-slot" id="gg-slot"><span></span></div>
      </div>
      <div class="gg-chute"></div>
    </div>
  </div>

  <div class="gg-gold" id="gg-gold"><b id="gg-gold-nm">?</b></div>

  <div class="gg-reveal" id="gg-reveal">
    <div class="gg-rv-label">🎉 扭 蛋 开 奖 · 本 轮 中 选 🎉</div>
    <div class="gg-rv-box" id="gg-rv-box" data-dyn></div>
    <div class="gg-rv-tip">按 空格 继续抽取 · 按 Esc 收起</div>
  </div>
</div>`
};
