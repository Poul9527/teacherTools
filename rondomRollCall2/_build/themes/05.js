module.exports = {
  dir: '05-霓虹极速点名',
  title: '霓虹极速点名',
  badge: '霓虹极速版',
  icon: '⚡',
  accent: '#38bdf8',
  accent2: '#6366f1',
  color: '#050b1a',
  historyTitle: '本轮极速名单',
  desc: '霓虹网格隧道在屏幕深处无限延伸，舞台中央一块巨型名字显示器以每 45 毫秒一次的速度疯狂刷新。摇人时隧道骤然加速、光带呼啸掠过；停止后名字一路减速锁定，轰然放大发光，四周炸开电光火花。',
  tags: ['霓虹', '隧道', '极速锁定', 'EDM'],
  musicNote: 'EDM 四拍，128 BPM 锯齿 Pad 铺底 + 方波琶音与主旋律一路推进',

  music: {
    bpm: 128,
    root: 48,
    stepsPerBar: 16,
    chords: [[0, 7, 12, 19], [3, 10, 15, 22], [-2, 5, 10, 17], [-4, 3, 8, 15]],
    pad: { wave: 'sawtooth', vol: 0.052, oct: 1, dur: 1.02, atk: 0.55, cut: 2200 },
    bass: { pat: [1, 0, 1, 0, 1, 0, 1, 0], oct: 0, vol: 0.078, wave: 'sawtooth', dur: 3, cut: 460 },
    arp: { pat: [0, 2, 1, 3, 4, 3, 1, 2], wave: 'square', vol: 0.028, oct: 2, dur: 0.7 },
    lead: { pat: [0, 1, 2, 3, 2, 1, 0, -1], wave: 'square', vol: 0.034, oct: 2, dur: 1.2, extra: 0, atk: 0.01 },
    drums: 'four',
    drumVol: 0.55,
    reverb: 0.42,
    delay: 0.30,
    bells: false
  },
  sfx: { win: 'fanfare' },

  css: `
:root{
  --accent:#38bdf8;
  --accent2:#6366f1;
  --bg: radial-gradient(circle at 50% 44%, #0a1836 0%, #050b1a 56%, #01030a 100%);
  --panel: rgba(5,11,26,.84);
  --border: rgba(56,189,248,.24);
  --glow: rgba(56,189,248,.55);
}

#nx-tunnel{ position:absolute; inset:0; width:100%; height:100%; display:block; }
.nx-scan{
  position:absolute; inset:0; z-index:2; pointer-events:none;
  background: repeating-linear-gradient(0deg,
    rgba(56,189,248,.055) 0px, rgba(56,189,248,.055) 1px,
    rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px);
}
.nx-vig{
  position:absolute; inset:0; z-index:2; pointer-events:none;
  background: radial-gradient(circle at 50% 44%, rgba(0,0,0,0) 38%, rgba(1,3,10,.78) 100%);
}

/* ── 中央名字显示器 ── */
.nx-core{
  position:absolute; z-index:5; left:2%; right:2%; top:1.5%;
  bottom: clamp(46px, 11.6vh, 94px);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(2px, .7vh, 10px);
  text-align:center; pointer-events:none;
}
.nx-frame{
  position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
  width: min(94%, 1120px); height: min(78%, 92%);
  border:1px solid rgba(56,189,248,.20); border-radius: 20px;
  transition: border-color .3s, box-shadow .3s;
}
.nx-frame::before, .nx-frame::after{
  content:''; position:absolute; width: clamp(16px,3.2vh,40px); height: clamp(16px,3.2vh,40px);
  border: 2.5px solid var(--accent); filter: drop-shadow(0 0 8px var(--glow));
}
.nx-frame::before{ left:-2px; top:-2px; border-right:none; border-bottom:none; border-radius: 20px 0 0 0; }
.nx-frame::after{ right:-2px; bottom:-2px; border-left:none; border-top:none; border-radius: 0 0 20px 0; }
.nx-core.locked .nx-frame{
  border-color: var(--accent);
  box-shadow: 0 0 42px rgba(56,189,248,.45), inset 0 0 70px rgba(56,189,248,.10);
}

.nx-tag{
  font-size: clamp(8px, 1.3vh, 13px); font-weight:800; letter-spacing: clamp(3px,.9vw,8px);
  color: rgba(125,211,252,.72); text-transform: uppercase;
}
.nx-sid{
  font-size: clamp(12px, 2.1vh, 22px); color:#7dd3fc; letter-spacing: 2px; opacity:.92;
}
.nx-nm{
  font-size: clamp(40px, 13vh, 140px);
  font-weight: 900; line-height: 1.05;
  letter-spacing: clamp(1px,.7vh,9px);
  white-space: nowrap; max-width: 100%;
  background: linear-gradient(180deg, #ffffff 8%, #bae6fd 46%, #6366f1 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px rgba(56,189,248,.62));
}
.nx-core.locked .nx-nm{
  animation: nxLockIn .62s cubic-bezier(.22,1.4,.42,1) forwards;
  filter: drop-shadow(0 0 34px rgba(125,211,252,.95)) drop-shadow(0 0 84px rgba(99,102,241,.75));
}
@keyframes nxLockIn{
  0%{ transform: scale(.86); filter: brightness(2.6) drop-shadow(0 0 60px #ffffff); }
  46%{ transform: scale(1.17); }
  100%{ transform: scale(1.06); }
}
.nx-bar{
  width: min(58%, 560px); height: clamp(3px,.7vh,6px); margin-top: clamp(1px,.5vh,8px);
  border-radius: 99px; background: rgba(56,189,248,.15); overflow:hidden;
}
.nx-bar i{
  display:block; height:100%; width:0%; border-radius:99px;
  background: linear-gradient(90deg,#38bdf8,#818cf8,#e0f2fe);
  box-shadow: 0 0 14px rgba(56,189,248,.95);
}

/* ── 底部候场池 ── */
.nx-pool-tip{
  position:absolute; z-index:4; left: clamp(6px,1vw,18px); bottom: clamp(4px,.8vh,10px);
  width: clamp(56px, 8.6vw, 112px); height: clamp(32px, 9vh, 72px);
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px;
  border-radius: 10px; border:1px solid rgba(56,189,248,.32); background: rgba(56,189,248,.10);
  font-size: clamp(9px,1.22vh,12px); font-weight:800; color:#7dd3fc; letter-spacing:1px;
  white-space:nowrap;
}
.nx-pool-tip b{ font-size: clamp(12px,1.9vh,18px); color:#e0f2fe; line-height:1; }
.nx-pool{
  position:absolute; z-index:4;
  left: clamp(70px, 10.6vw, 142px); right: clamp(6px,1vw,18px);
  bottom: clamp(4px,.8vh,10px); height: clamp(32px, 9vh, 72px);
  display:grid; justify-content:center; align-content:center; gap:3px;
  overflow:hidden;
}
.nx-chip{
  display:flex; align-items:center; justify-content:center;
  border-radius: 6px; border:1px solid rgba(56,189,248,.20);
  background: rgba(56,189,248,.07); color:#cbd5e1; font-weight:700;
  overflow:hidden; white-space:nowrap;
  transition: transform .1s, background .1s, border-color .1s, color .1s;
}
.nx-chip.hot{
  background:#38bdf8; border-color:#e0f2fe; color:#04101f;
  box-shadow: 0 0 14px rgba(56,189,248,.95); transform: scale(1.07);
}
.nx-chip.dim{ opacity:.26; }
.nx-chip.won{
  background: linear-gradient(180deg,#fde047,#f59e0b); border-color:#fffbeb; color:#1a1200;
  box-shadow: 0 0 18px rgba(253,224,71,.9); opacity:1;
}

/* ── 揭晓浮层：横向大字卡片 ── */
.nx-reveal{
  position:absolute; inset:0; z-index:60; display:none;
  background: radial-gradient(circle at 50% 50%, rgba(6,14,36,.90), rgba(1,3,10,.96));
  backdrop-filter: blur(3px);
}
.nx-reveal.active{ display:block; }
.nx-rv-label{
  position:absolute; left:0; right:0; top: clamp(4px,2vh,22px); text-align:center;
  font-size: clamp(11px,1.9vh,17px); font-weight:900;
  letter-spacing: clamp(2px,.85vw,8px); color:#7dd3fc;
  text-shadow: 0 0 22px rgba(56,189,248,.92);
}
.nx-rv-tip{
  position:absolute; left:0; right:0; bottom: clamp(3px,1.2vh,12px); text-align:center;
  font-size: clamp(10px,1.38vh,13px); color:#64748b; letter-spacing:1px;
}
#nx-rv-box{
  position:absolute; left:2.5%; right:2.5%;
  top: clamp(28px, 7.8vh, 70px); bottom: clamp(20px, 5vh, 42px);
  display:grid; justify-content:center; align-content:center;
}
.nx-card{
  position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: clamp(1px,.4vh,5px); border-radius: 14px; overflow:hidden;
  border: 1.5px solid var(--accent);
  background: linear-gradient(150deg, rgba(56,189,248,.20), rgba(99,102,241,.10) 55%, rgba(4,10,26,.86));
  box-shadow: 0 0 26px rgba(56,189,248,.35), inset 0 0 22px rgba(56,189,248,.10);
  animation: nxCardIn .5s cubic-bezier(.34,1.56,.64,1) backwards;
}
.nx-card::before{
  content:''; position:absolute; left:0; top:0; bottom:0; width:4px;
  background: linear-gradient(180deg,#38bdf8,#6366f1);
}
.nx-card .nc-id{ font-size: clamp(9px,1.5vh,15px); color:#7dd3fc; letter-spacing:1px; }
.nx-card .nc-nm{
  font-size: clamp(20px,4.6vh,64px); font-weight:900; color:#fff; line-height:1.12;
  text-shadow: 0 0 22px rgba(56,189,248,.9);
  white-space:nowrap; max-width:96%; overflow:hidden;
}
@keyframes nxCardIn{ from{ opacity:0; transform: translateY(24px) scale(.84); } to{ opacity:1; transform:none; } }
`,

  body: `
<canvas id="nx-tunnel"></canvas>
<div class="nx-scan"></div>
<div class="nx-vig"></div>

<div class="nx-core" id="nx-core">
  <div class="nx-frame"></div>
  <div class="nx-tag">NEON ROLL CALL</div>
  <div class="nx-sid id-tag" id="nx-sid">NO.--</div>
  <div class="nx-nm" id="nx-nm">准备就绪</div>
  <div class="nx-bar"><i id="nx-bar-fill"></i></div>
</div>

<div class="nx-pool-tip"><span>候场池</span><b id="nx-pool-num">0</b></div>
<div class="nx-pool" id="nx-pool" data-dyn></div>

<div class="nx-reveal" id="nx-reveal">
  <div class="nx-rv-label">⚡ 极 速 锁 定 · 本 轮 中 选 ⚡</div>
  <div class="nx-rv-box" id="nx-rv-box" data-dyn></div>
  <div class="nx-rv-tip">按 空格 继续抽取 · 按 Esc 收起</div>
</div>`
};
