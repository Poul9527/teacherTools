module.exports = {
  dir: '14-幸运金蛋大锤敲点名',
  title: '幸运金蛋大锤敲',
  badge: '砸金蛋欢庆版',
  icon: '🔨',
  accent: '#eab308',
  accent2: '#ef4444',
  color: '#1a0d05',
  historyTitle: '本轮砸出名单',
  desc: '红丝绒台面上摆满金光闪闪的幸运金蛋，一把黄金大锤在蛋阵上方凌空游走、越抡越快；锤落蛋碎的一刻，蛋壳四分五裂，金币与亮片漫天飞溅，屏幕跟着一颤，砸开的金蛋里蹦出被点到的同学。',
  tags: ['砸金蛋', '黄金大锤', '金币雨', '喜庆锣鼓'],
  musicNote: '中式喜庆锣鼓 + 五声宫调，热闹红火',

  music: {
    bpm: 118,
    root: 48,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 19], [2, 9, 14, 21], [4, 11, 16, 23], [-5, 2, 7, 14]],
    pad: { wave: 'triangle', vol: 0.058, oct: 1, dur: 1.0, atk: 0.48, cut: 2400 },
    bass: { pat: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0], oct: 0, vol: 0.085, wave: 'triangle', dur: 4, cut: 340 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'triangle', vol: 0.038, oct: 2, dur: 1.7 },
    drums: 'taiko',
    drumVol: 0.9,
    reverb: 0.5,
    delay: 0.3,
    bells: true
  },
  sfx: { win: 'gong' },

  css: `
:root{
  --accent:#eab308;
  --accent2:#ef4444;
  --bg: radial-gradient(circle at 50% 0%, #6b171b 0%, #2c0a08 52%, #130402 100%);
  --panel: rgba(40,10,6,.80);
  --border: rgba(234,179,8,.26);
  --glow: rgba(234,179,8,.55);
}

#egg-bg{ position:absolute; inset:0; width:100%; height:100%; }
.egg-scene{ position:absolute; inset:0; overflow:hidden; }

/* ---------- 红丝绒基座 ---------- */
.egg-base{ position:absolute; left:2%; right:2%; top:4%; bottom:4%; pointer-events:none; z-index:1; }
.egg-base .eb-back{
  position:absolute; inset:0; border-radius: 24px;
  background:
    radial-gradient(ellipse at 50% 22%, rgba(200,48,58,.52) 0%, rgba(122,17,27,.84) 42%, rgba(56,8,14,.95) 76%, rgba(24,3,7,1) 100%),
    repeating-linear-gradient(92deg, rgba(255,255,255,.05) 0 2px, rgba(0,0,0,.08) 2px 5px);
  box-shadow: inset 0 0 10vh rgba(0,0,0,.72), inset 0 1px 0 rgba(255,214,110,.26);
}
.egg-base .eb-top{
  position:absolute; left:4%; right:4%; top:-3%; height:22%;
  border-radius:50%;
  background: radial-gradient(ellipse, rgba(255,214,90,.30), rgba(255,214,90,0) 70%);
  filter: blur(8px);
}
.egg-base .eb-front{
  position:absolute; left:0; right:0; top:74%; bottom:0;
  clip-path: polygon(2.4% 0, 97.6% 0, 100% 100%, 0 100%);
  background:
    radial-gradient(ellipse at 50% 0%, rgba(190,34,48,.92) 0%, rgba(100,13,22,.97) 54%, rgba(34,4,9,1) 100%),
    repeating-linear-gradient(88deg, rgba(0,0,0,.18) 0 3px, rgba(255,255,255,.03) 3px 7px);
  box-shadow: inset 0 1.6vh 3vh rgba(0,0,0,.62);
  border-top: 1px solid rgba(234,179,8,.40);
}
.egg-base .eb-vig{
  position:absolute; inset:-8% -6% -4% -6%;
  background: radial-gradient(ellipse at 50% 34%, rgba(0,0,0,0) 42%, rgba(0,0,0,.60) 100%);
}

/* 每一排金蛋脚下都有一条丝绒长台面（由脚本按 autoFitGrid 的行高放置） */
.egg-shelves{ position:absolute; inset:0; pointer-events:none; z-index:1; }
.egg-shelf{
  position:absolute;
  border-radius:50% / 100% 100% 26% 26%;
  background: radial-gradient(ellipse at 50% 4%, rgba(255,222,124,.44) 0%, rgba(214,42,54,.76) 34%, rgba(112,14,24,.97) 74%, rgba(46,6,12,1) 100%);
  box-shadow:
    inset 0 0.6vh 2vh rgba(255,206,86,.30),
    inset 0 -1vh 2.6vh rgba(0,0,0,.72),
    0 0.6vh 3vh rgba(0,0,0,.55),
    0 0 4vh rgba(234,179,8,.22);
  border-top: 1px solid rgba(255,214,110,.50);
}

/* ---------- 金蛋阵列 ---------- */
.egg-field{
  position:absolute; left:3%; right:3%; top:6%; bottom:38%;
  align-content: end; z-index: 2;
}
.egg-cell{
  position:relative;
  display:flex; align-items:flex-end; justify-content:center;
  animation: eggFloat 4.2s ease-in-out infinite;
}
@keyframes eggFloat{
  0%,100%{ transform: translateY(0); }
  50%{ transform: translateY(-4%); }
}
.egg-cell .eshadow{
  position:absolute; left:12%; right:12%; bottom:2%; height:9%;
  border-radius:50%;
  background: radial-gradient(ellipse, rgba(0,0,0,.72), rgba(0,0,0,0) 72%);
}
.egg{
  position:relative;
  width:60px; height:76px; font-size:76px;
  border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
  background:
    radial-gradient(circle at 34% 24%, #fffdf0 0%, #ffe98a 14%, #f7c948 36%, #d99a08 61%, #9c6603 83%, #6b4401 100%);
  box-shadow:
    inset -0.09em -0.13em 0.19em rgba(92,56,0,.62),
    inset 0.07em 0.08em 0.15em rgba(255,255,255,.55),
    0 0.09em 0.19em rgba(0,0,0,.55),
    0 0 0.26em rgba(234,179,8,.48);
  transition: transform .18s cubic-bezier(.34,1.56,.64,1), filter .18s, box-shadow .22s;
}
.egg::before{
  content:''; position:absolute; left:21%; top:12%; width:27%; height:18%;
  border-radius:50%; transform: rotate(-18deg);
  background: radial-gradient(ellipse, rgba(255,255,255,.96), rgba(255,255,255,0) 72%);
}
.egg .en{
  position:absolute; left:0; right:0; top:57%; text-align:center;
  font-size:.15em; font-weight:900; letter-spacing:1px;
  color: rgba(96,58,0,.70);
  text-shadow: 0 1px 0 rgba(255,255,255,.30);
}
.egg-field.rolling .egg{ filter: brightness(1.12); }
.egg-field.rolling .egg-cell{ animation-duration: 1.1s; }

.egg-cell.lit .egg{
  transform: scale(1.08);
  filter: brightness(1.18);
  box-shadow:
    inset -0.09em -0.13em 0.19em rgba(92,56,0,.55),
    inset 0.08em 0.09em 0.18em rgba(255,255,255,.7),
    0 0.09em 0.19em rgba(0,0,0,.5),
    0 0 0.42em rgba(255,238,140,.95);
}
.egg-cell.won .egg{
  transform: scale(1.14);
  filter: brightness(1.25);
  box-shadow:
    inset -0.09em -0.13em 0.19em rgba(92,56,0,.5),
    inset 0.09em 0.10em 0.20em rgba(255,255,255,.8),
    0 0 0.55em rgba(255,224,102,1),
    0 0 1.2em rgba(239,68,68,.75);
}
.egg-cell.dim{ opacity:.30; }
.egg.cracked{ animation: eggCrack .44s cubic-bezier(.3,.9,.4,1) forwards; }
@keyframes eggCrack{
  0%{ transform: scale(1.08); filter: brightness(2.4); }
  32%{ transform: scale(1.18) rotate(-4deg); filter: brightness(1.7); }
  100%{ transform: scale(.70) rotate(5deg); opacity:0; filter: brightness(1); }
}

/* 蛋壳碎片 */
.shard{
  position:absolute; left:50%; top:50%; pointer-events:none;
  border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
  background: linear-gradient(140deg, #fffbe0, #f2c22a 46%, #d99a08 72%, #8a5a02 100%);
  box-shadow: inset 0 0 0.4em rgba(120,70,0,.65), 0 0 0.5em rgba(255,224,102,.8);
  animation: shardFly .95s cubic-bezier(.16,.66,.4,1) forwards;
}
@keyframes shardFly{
  0%{ transform: translate(-50%,-50%) rotate(0deg) scale(1); opacity:1; }
  100%{
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(var(--rot)) scale(.5);
    opacity:0;
  }
}

/* ---------- 黄金大锤 ---------- */
.gold-hammer{
  position:absolute; left:0; top:0; z-index:24; pointer-events:none;
  transform-origin: 50% 96%;
  opacity:0; transition: opacity .18s, transform .1s linear;
}
.gold-hammer.on{ opacity:1; }
.gold-hammer .hm-handle{
  position:absolute; left:43%; top:32%; width:14%; bottom:0;
  border-radius:0.5vh;
  background: linear-gradient(90deg, #60380d, #c98b3a 42%, #7a4a18 78%, #4a2a08);
  box-shadow: inset 0 0 6px rgba(0,0,0,.7);
}
.gold-hammer .hm-head{
  position:absolute; left:0; right:0; top:0; height:38%;
  border-radius: 12% / 30%;
  background: linear-gradient(160deg, #fffbe0 0%, #ffe98a 18%, #f2c22a 40%, #c98b06 66%, #8a5a02 100%);
  border: 1px solid rgba(255,238,150,.75);
  box-shadow: 0 0 2.4vh rgba(234,179,8,.85), inset 0 -0.6vh 1.4vh rgba(90,54,0,.55);
}
.gold-hammer .hm-head::after{
  content:''; position:absolute; left:12%; right:12%; top:14%; height:18%;
  border-radius:50%;
  background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(255,255,255,0));
}

/* ---------- 揭晓面板 ---------- */
.ge-reveal{
  position:absolute; inset:0; z-index:60;
  display:none; align-items:center; justify-content:center;
  padding: 2vh 3vw;
  background: radial-gradient(ellipse at 50% 50%, rgba(66,10,10,.68), rgba(12,3,2,.90));
  backdrop-filter: blur(3px);
}
.ge-reveal.active{ display:flex; }
.ge-panel{
  position:relative; max-width:96%; max-height:100%;
  display:flex; flex-direction:column; align-items:center;
  gap: clamp(6px,1.4vh,16px);
  padding: clamp(14px,2.6vh,32px) clamp(18px,3.4vw,56px);
  border-radius: 22px; overflow:hidden;
  background: linear-gradient(180deg, rgba(62,11,11,.96), rgba(22,4,4,.97));
  border: 3px solid var(--accent);
  box-shadow:
    0 0 6vh rgba(234,179,8,.55),
    0 2.2vh 6vh rgba(0,0,0,.82),
    inset 0 0 5vh rgba(234,179,8,.14);
  animation: gePop .5s cubic-bezier(.34,1.56,.64,1) .40s backwards;
}
.ge-panel::before{
  content:''; position:absolute; left:-40%; top:-70%; width:180%; height:120%;
  background: linear-gradient(100deg, rgba(255,236,150,0) 34%, rgba(255,236,150,.16) 50%, rgba(255,236,150,0) 66%);
  animation: geSheen 3.2s linear infinite;
}
@keyframes geSheen{ 0%{ transform: translateX(-30%); } 100%{ transform: translateX(30%); } }
@keyframes gePop{ from{ opacity:0; transform: scale(.66) rotate(-2deg); } to{ opacity:1; transform:none; } }
.ge-ribbon{
  font-size: clamp(11px,1.85vh,17px); font-weight:900; letter-spacing:4px;
  color:#ffe98a; text-shadow: 0 0 2.2vh rgba(234,179,8,.9);
  animation: popIn .4s backwards;
}
.ge-names{ display:flex; flex-wrap:wrap; gap: clamp(8px,1.6vw,26px); justify-content:center; align-items:flex-end; }
.ge-one{ text-align:center; animation: geRise .62s cubic-bezier(.34,1.56,.64,1) backwards; }
.ge-one .gid{
  font-family: ui-monospace, Consolas, monospace;
  font-size: clamp(11px,1.7vh,16px); color:#fca5a5; font-weight:800; opacity:.9;
}
.ge-one .gnm{
  font-size: clamp(32px,8.8vh,92px); font-weight:900; line-height:1.06; letter-spacing:4px;
  background: linear-gradient(180deg,#fffbe8 8%,#ffe07a 48%,#e0a10a 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 2.4vh rgba(234,179,8,.85));
}
@keyframes geRise{ from{ opacity:0; transform: translateY(26px) scale(.8); } to{ opacity:1; transform:none; } }
.ge-tip{ font-size: clamp(10px,1.5vh,13px); color:#b98a6a; letter-spacing:1px; }
`,

  body: `
<canvas id="egg-bg"></canvas>
<div class="egg-scene" id="egg-scene">
  <div class="egg-base">
    <div class="eb-back"></div>
    <div class="eb-top"></div>
    <div class="eb-front"></div>
    <div class="eb-vig"></div>
  </div>
  <div class="egg-shelves" id="egg-shelves"></div>
  <div class="egg-field fit-grid" id="egg-field" data-dyn></div>
  <div class="gold-hammer" id="gold-hammer">
    <div class="hm-handle"></div>
    <div class="hm-head"></div>
  </div>
</div>
<div class="ge-reveal" id="ge-reveal">
  <div class="ge-panel">
    <div class="ge-ribbon">🔨 金 蛋 破 壳 · 幸 运 降 临 🔨</div>
    <div class="ge-names" id="ge-names" data-dyn></div>
    <div class="ge-tip">按 空格 继续砸蛋 · 按 Esc 收起</div>
  </div>
</div>`
};
