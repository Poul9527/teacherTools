module.exports = {
  dir: '02-幸运大转盘点名',
  title: '幸运大转盘',
  badge: '经典转盘版',
  icon: '🎡',
  accent: '#f59e0b',
  accent2: '#ef4444',
  color: '#1a0f04',
  historyTitle: '本轮中奖名单',
  desc: '七彩扇形在聚光灯下越转越快，外圈跑马灯噼啪乱闪，红指针在名字之间飞速掠过。转速渐缓，指针颤巍巍咬住一个扇区——金色纸屑炸满全场，中奖同学的名字在转盘中央腾空而起。',
  tags: ['大转盘', '跑马灯', '指针', '狂欢节'],
  musicNote: '马戏团 3/4 拍圆舞曲：锯齿波手风琴铺底 + 明亮琶音，热闹喧腾',

  music: {
    bpm: 138,
    root: 55,
    stepsPerBar: 12,
    chords: [[0, 4, 7, 12], [5, 9, 12, 17], [2, 5, 9, 14], [7, 11, 14, 19]],
    pad: { wave: 'sawtooth', vol: 0.032, oct: 1, dur: 1.06, atk: 0.50, cut: 1600 },
    bass: { pat: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], oct: 0, vol: 0.080, wave: 'triangle', dur: 3.6, cut: 500 },
    arp: { pat: [0, 2, 1, 3, 4, 3], wave: 'sawtooth', vol: 0.030, oct: 2, dur: 1.5 },
    lead: { pat: [4, 2, 3, 5], wave: 'triangle', vol: 0.040, oct: 2, dur: 1.4, extra: 0 },
    drums: 'waltz',
    drumVol: 0.62,
    swing: 0,
    reverb: 0.44,
    delay: 0.22,
    bells: true
  },
  sfx: { win: 'fanfare' },

  css: `
:root{
  --accent:#f59e0b;
  --accent2:#ef4444;
  --bg: radial-gradient(circle at 50% 0%, #4a1c05 0%, #250e02 46%, #0c0400 100%);
  --panel: rgba(26,15,4,.82);
  --border: rgba(245,158,11,.28);
  --glow: rgba(245,158,11,.55);
}

.wheel-stage{ position:absolute; inset:0; overflow:hidden; }

/* 顶部狂欢节彩条帐篷 */
.wheel-stage::before{
  content:''; position:absolute; left:-4%; right:-4%; top:0;
  height: clamp(9px,2.2vh,20px);
  background: repeating-linear-gradient(90deg, #ef4444 0 30px, #fef3c7 30px 60px);
  border-radius: 0 0 60% 60% / 0 0 100% 100%;
  opacity:.5; box-shadow: 0 8px 26px rgba(0,0,0,.55);
  pointer-events:none;
}
/* 中央聚光灯 */
.wheel-stage::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(circle at 50% 46%, rgba(245,158,11,.20), rgba(239,68,68,.07) 42%, transparent 66%);
}

.wheel-box{
  position:absolute; left:50%; top:50%;
  width: min(72vh, 56vw); height: min(72vh, 56vw);
  transform: translate(-50%,-50%);
}
.wheel-cv{ display:block; width:100%; height:100%; }

/* 红色三角指针 */
.wheel-ptr{
  position:absolute; left:50%; top:-3%;
  width:0; height:0; transform: translateX(-50%);
  border-left: clamp(8px,1.45vh,17px) solid transparent;
  border-right: clamp(8px,1.45vh,17px) solid transparent;
  border-top: clamp(18px,3.8vh,42px) solid #ef4444;
  filter: drop-shadow(0 4px 12px rgba(239,68,68,.95)) drop-shadow(0 0 3px rgba(255,255,255,.8));
  z-index:4;
}

/* 转盘中心轴帽 */
.wheel-hub{
  position:absolute; left:50%; top:50%; transform: translate(-50%,-50%);
  width:20%; height:20%; border-radius:50%;
  background: radial-gradient(circle at 34% 28%, #fff7ed, #f59e0b 44%, #b45309 100%);
  border: 2px solid rgba(255,255,255,.6);
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 0 30px rgba(245,158,11,.8), inset 0 -5px 12px rgba(0,0,0,.4);
  font-weight:900; color:#3b1a02; z-index:3;
  font-size: clamp(10px,1.75vh,19px); letter-spacing:1px;
  text-align:center; line-height:1.1;
}

/* 指针当前咬住的名字读数条 */
.wheel-readout{
  position:absolute; left:50%; bottom: clamp(2px,.6vh,10px);
  transform: translateX(-50%);
  max-width: 72%;
  padding: clamp(3px,.7vh,9px) clamp(12px,2vw,30px);
  border-radius: 40px;
  background: linear-gradient(135deg, rgba(245,158,11,.26), rgba(239,68,68,.22));
  border: 2px solid rgba(245,158,11,.78);
  box-shadow: 0 0 26px rgba(245,158,11,.45);
  font-size: clamp(13px,2.5vh,26px);
  font-weight: 900; letter-spacing: 3px; color: #fef3c7;
  text-shadow: 0 0 14px rgba(245,158,11,.9);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  z-index: 5;
}

/* ---------- 中奖揭晓浮层 ---------- */
.wl-reveal{
  position:absolute; inset:0; z-index:60;
  display:none; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(5px,1.1vh,13px);
  background: radial-gradient(circle at 50% 48%, rgba(74,28,5,.93), rgba(12,4,0,.95));
  backdrop-filter: blur(3px);
}
.wl-reveal.active{ display:flex; }
.wl-label{
  font-size: clamp(11px,1.85vh,16px); letter-spacing:5px; font-weight:900;
  color:#fbbf24; text-shadow: 0 0 20px rgba(245,158,11,.9);
  animation: popIn .4s backwards;
}
.wl-names{
  width: min(92vw, 1080px);
  height: min(46vh, 400px);
  position: relative;
}
.wl-one{
  position:relative; overflow:hidden;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: 2px; border-radius: 16px;
  background: linear-gradient(160deg, rgba(245,158,11,.20), rgba(120,40,4,.42));
  border: 3px solid #f59e0b;
  box-shadow: 0 0 34px rgba(245,158,11,.6), inset 0 0 24px rgba(239,68,68,.22);
  animation: wlRise .58s cubic-bezier(.34,1.56,.64,1) backwards;
}
.wl-one .wid{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(10px,1.6vh,15px); color:#fde68a; font-weight:900; opacity:.9;
}
.wl-one .wnm{
  font-size: clamp(24px,6.4vh,64px);
  font-weight:900; line-height:1.06; letter-spacing:3px;
  background: linear-gradient(180deg,#ffffff 10%,#fde68a 52%,#f59e0b 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 22px rgba(245,158,11,.85));
  white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis;
}
@keyframes wlRise{ from{ opacity:0; transform: translateY(24px) scale(.8) rotate(-4deg); } to{ opacity:1; transform:none; } }
.wl-tip{ font-size: clamp(10px,1.5vh,13px); color:#a8825c; letter-spacing:1px; }
`,

  body: `
<div class="wheel-stage" id="wheel-stage">
  <div class="wheel-box" id="wheel-box">
    <canvas class="wheel-cv" id="wheel-cv"></canvas>
    <div class="wheel-ptr" id="wheel-ptr"></div>
    <div class="wheel-hub" id="wheel-hub">点名</div>
  </div>
  <div class="wheel-readout" id="wheel-readout">准备转动</div>
</div>
<div class="wl-reveal" id="wl-reveal">
  <div class="wl-label">🎡 转 盘 锁 定 的 幸 运 儿 🎡</div>
  <div class="wl-names fit-grid" id="wl-names" data-dyn></div>
  <div class="wl-tip">按 空格 继续抽取 · 按 Esc 收起</div>
</div>`
};
