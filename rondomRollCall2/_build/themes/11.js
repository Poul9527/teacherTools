module.exports = {
  dir: '11-聚光灯黑板剧场点名',
  title: '聚光灯黑板剧场',
  badge: '复古黑板版',
  icon: '🎭',
  accent: '#14b8a6',
  accent2: '#f59e0b',
  color: '#0a1412',
  historyTitle: '本轮登台名单',
  desc: '实木边框的大黑板立在舞台正中，两束暖黄追光左右扫射。摇人时粉笔字在黑板上飞快翻页，喊停的一瞬两束光缓缓交汇成一点，粉笔伴着沙沙声一笔一划写出中选者的名字，粉笔灰在光柱里簌簌落下。',
  tags: ['黑板', '追光灯', '粉笔字', '剧场'],
  musicNote: 'Lo-Fi 爵士，三角波 Pad 铺底 + 摇摆鼓组，像午后教室的粉笔灰',

  music: {
    bpm: 88,
    root: 45,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 16], [5, 12, 15, 19], [8, 15, 19, 24], [7, 14, 17, 21]],
    pad: { wave: 'triangle', vol: 0.060, oct: 1, dur: 1.06, atk: 0.62, cut: 2000 },
    bass: { pat: [1, 0, 0, 0, 1, 0, 0, 0], oct: 0, vol: 0.078, wave: 'sine', dur: 5, cut: 300 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'sine', vol: 0.036, oct: 2, dur: 1.4 },
    drums: 'lofi',
    drumVol: 0.55,
    swing: 0.18,
    reverb: 0.40,
    delay: 0.34,
    bells: true
  },
  sfx: { win: 'gong' },

  css: `
:root{
  --accent:#14b8a6;
  --accent2:#f59e0b;
  --bg: radial-gradient(circle at 50% 0%, #17332d 0%, #0a1a17 48%, #040a09 100%);
  --panel: rgba(8,20,17,.84);
  --border: rgba(20,184,166,.24);
  --glow: rgba(245,158,11,.48);
}

/* ---------- 舞台 ---------- */
.sp-root{
  position:absolute; inset:0; overflow:hidden;
  background:
    radial-gradient(ellipse 72% 46% at 50% 108%, rgba(245,158,11,.16), transparent 72%),
    radial-gradient(ellipse 62% 42% at 50% -14%, rgba(20,184,166,.12), transparent 72%);
}
.sp-dust{ position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:2; }
.sp-floor{
  position:absolute; left:-6%; right:-6%; bottom:-3%; height:26%; z-index:1;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.30) 42%, rgba(0,0,0,.68) 100%);
  border-radius: 50% 50% 0 0 / 30% 30% 0 0;
}

/* 顶部吊灯 */
.sp-lamp{
  position:absolute; top:0; z-index:4;
  width: clamp(16px,3vh,30px); height: clamp(11px,2vh,20px);
  border-radius: 0 0 11px 11px;
  transform: translateX(-50%);
  background: linear-gradient(180deg,#3f3f46,#71717a 58%,#27272a);
  box-shadow: 0 0 22px rgba(253,230,138,.72), 0 0 64px rgba(253,230,138,.32);
}
.sp-lamp::before{
  content:''; position:absolute; left:50%; bottom:100%; width:2px;
  height: clamp(8px,3vh,26px);
  background: linear-gradient(180deg,#18181b,#3f3f46);
  transform: translateX(-50%);
}
.sp-lamp.l{ left:22%; }
.sp-lamp.r{ left:78%; }

/* 追光灯光锥 */
.sp-beam{
  position:absolute; top:0; height:100%; width:34%; z-index:6;
  pointer-events:none; opacity:.62;
  mix-blend-mode: screen;
  transform-origin: 50% 0%;
  will-change: transform;
  clip-path: polygon(46.5% 0%, 53.5% 0%, 100% 100%, 0% 100%);
  background: linear-gradient(180deg,
    rgba(253,230,138,.44) 0%,
    rgba(253,230,138,.21) 32%,
    rgba(253,230,138,.075) 64%,
    rgba(253,230,138,0) 100%);
  filter: blur(1.1px);
  transition: transform .72s cubic-bezier(.22,.9,.25,1), opacity .5s, filter .5s;
}
.sp-beam.l{ left:5%; }
.sp-beam.r{ right:5%; }
.sp-root.rolling .sp-beam{ transition: none; opacity:.82; filter: blur(.8px); }
.sp-root .sp-beam.hot{ opacity:.95; filter: blur(.5px); }

/* ---------- 黑板 ---------- */
.sp-board{
  position:absolute; left:50%; top:50%; transform: translate(-50%,-50%);
  width: min(88%, 1140px); height: min(74%, 620px);
  padding: clamp(11px,2.05vh,26px);
  border-radius: 7px; z-index:5;
  background:
    repeating-linear-gradient(92deg,
      rgba(0,0,0,.16) 0 2px, rgba(255,255,255,.075) 2px 5px,
      rgba(0,0,0,.05) 5px 8px, rgba(255,255,255,.045) 8px 12px),
    repeating-linear-gradient(3deg,
      rgba(0,0,0,.10) 0 3px, rgba(255,255,255,.05) 3px 8px),
    linear-gradient(158deg,#cf9a5c 0%,#9c6531 15%,#dcaa6e 34%,#8b5626 58%,#c48e52 82%,#8f5c2b 100%);
  box-shadow:
    inset 0 0 0 2px rgba(0,0,0,.42),
    inset 0 0 16px rgba(0,0,0,.40),
    0 0 0 6px rgba(58,34,14,.72),
    0 0 0 8px rgba(196,140,80,.48),
    0 26px 58px rgba(0,0,0,.72);
}
.sp-face{
  position:absolute; inset:0; border-radius:3px; overflow:hidden;
  background:
    radial-gradient(70% 52% at 26% 16%, rgba(255,255,255,.07), transparent 64%),
    radial-gradient(52% 42% at 78% 76%, rgba(255,255,255,.05), transparent 68%),
    repeating-linear-gradient(114deg, rgba(255,255,255,.014) 0 2px, transparent 2px 6px),
    linear-gradient(180deg,#24513f 0%,#17392e 54%,#102a23 100%);
  box-shadow: inset 0 0 58px rgba(0,0,0,.60), inset 0 0 0 3px rgba(74,52,28,.55);
}
.sp-face::after{
  content:''; position:absolute; inset:0; pointer-events:none;
  background:
    radial-gradient(38% 26% at 13% 80%, rgba(255,255,255,.05), transparent 72%),
    radial-gradient(30% 22% at 67% 28%, rgba(255,255,255,.038), transparent 72%),
    radial-gradient(22% 16% at 88% 52%, rgba(255,255,255,.030), transparent 72%);
  filter: blur(7px);
}

/* 黑板上方小标题 */
.sp-head{
  position:absolute; left:0; right:0; top: clamp(6px,1.7vh,22px);
  text-align:center; z-index:3;
  font-family:"KaiTi","STKaiti","Kaiti SC","楷体",serif;
  font-weight:700;
  font-size: clamp(12px,2.1vh,23px);
  letter-spacing: clamp(4px,.9vw,14px);
  color:#e2e8f0; opacity:.78;
  text-shadow: 0 0 6px rgba(255,255,255,.45), 1px 1px 0 rgba(255,255,255,.2);
  transition: opacity .3s, color .3s;
}
.sp-root.rolling .sp-head{ color:#fde68a; opacity:.95; }

/* 粉笔字网格（由 autoFitGrid 排布） */
.sp-chalk{
  position:absolute; inset: 16% 6.5% 12% 6.5%;
  display:grid; justify-content:center; align-content:center; z-index:3;
}
.sp-cw{
  position:relative; display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  gap: clamp(1px,.3vh,5px);
  overflow:hidden;
}
.sp-cw .ck{
  display:block; white-space:nowrap;
  font-family:"KaiTi","STKaiti","Kaiti SC","楷体",serif;
  font-weight:700; line-height:1.08;
  color:#f8fafc;
  text-shadow:
    0 0 5px rgba(255,255,255,.55),
    0 0 16px rgba(255,255,255,.20),
    1.5px 1.5px 0 rgba(255,255,255,.18);
  opacity:0;
}
.sp-cw .cb{
  display:block; width:74%; height:2px; border-radius:2px;
  background: linear-gradient(90deg, rgba(245,158,11,0), rgba(245,158,11,.9), rgba(245,158,11,0));
  transform: scaleX(0); transform-origin: 0 50%; opacity:0;
}
.sp-cw .cid{
  display:block; white-space:nowrap;
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(8px,1.25vh,13px); font-weight:800;
  color: rgba(20,184,166,.92); opacity:0; letter-spacing:.5px;
}
.sp-cw.rolling .ck{ opacity:.5; color:#cbd5e1; text-shadow:none; }
.sp-cw.won .ck{ animation: spChalk .66s cubic-bezier(.3,.72,.3,1) both; }
.sp-cw.won .cid{ animation: spFade .5s .42s ease-out both; }
.sp-cw.won .cb{ animation: spUnderline .55s .34s cubic-bezier(.3,.8,.3,1) both; }
@keyframes spChalk{
  from{ clip-path: inset(0 100% 0 0); opacity:.12; }
  to{ clip-path: inset(0 0 0 0); opacity:1; }
}
@keyframes spFade{ from{ opacity:0; } to{ opacity:.92; } }
@keyframes spUnderline{ from{ transform:scaleX(0); opacity:0; } to{ transform:scaleX(1); opacity:.95; } }

/* 粉笔槽 + 粉笔 */
.sp-tray{
  position:absolute; left:4%; right:4%; bottom:0; height: clamp(5px,.95vh,11px); z-index:4;
  border-radius: 3px;
  background: linear-gradient(180deg,#b07f47,#6a4020 60%,#3f2410);
  box-shadow: 0 3px 8px rgba(0,0,0,.6);
}
.sp-tray i{
  position:absolute; bottom:100%; height: clamp(3px,.6vh,7px); border-radius:4px;
  background: linear-gradient(180deg,#fff,#cbd5e1);
}
.sp-tray i.a{ left:12%; width: clamp(24px,4vw,52px); transform: rotate(-1deg); }
.sp-tray i.b{ left:30%; width: clamp(16px,2.6vw,34px); background: linear-gradient(180deg,#fde68a,#f59e0b); }
`,
  body: `
<div class="sp-root" id="sp-root">
  <canvas class="sp-dust" id="sp-dust"></canvas>
  <div class="sp-floor"></div>
  <div class="sp-lamp l"></div>
  <div class="sp-lamp r"></div>
  <div class="sp-beam l" id="sp-beam-l"></div>
  <div class="sp-beam r" id="sp-beam-r"></div>
  <div class="sp-board" id="sp-board">
    <div class="sp-face" id="sp-face">
      <div class="sp-head" id="sp-head">今 日 登 台</div>
      <div class="sp-chalk" id="sp-chalk" data-dyn></div>
      <div class="sp-tray"><i class="a"></i><i class="b"></i></div>
    </div>
  </div>
</div>`
};
