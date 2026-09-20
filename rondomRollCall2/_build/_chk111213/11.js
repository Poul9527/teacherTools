
/* ===== 内置默认名单（页面上的修改会通过「导出 HTML」直接填充到这里） ===== */
const DEFAULT_STUDENTS_RAW = "202401 陈晨\n202402 林子轩\n202403 王梓涵\n202404 李雨欣\n202405 张天宇\n202406 刘思齐\n202407 黄俊杰\n202408 杨博文\n202409 赵嘉欣\n202410 周子豪\n202411 吴佳琪\n202412 孙宇涵\n202413 徐浩然\n202414 朱梦瑶\n202415 郭宇轩\n202416 何语嫣\n202417 高若萱\n202418 罗博宇\n202419 郑泽宇\n202420 梁欣怡\n202421 谢梓桐\n202422 宋雨泽\n202423 唐子默\n202424 许博涵\n202425 韩雪儿\n202426 冯天逸\n202427 邓子墨\n202428 曹雨菲\n202429 彭子轩\n202430 曾俊杰\n202431 萧雅涵\n202432 田浩宇\n202433 董思源\n202434 袁梦洁\n202435 潘宇恒\n202436 于心怡\n202437 蒋明远\n202438 蔡雨桐\n202439 余泽楷\n202440 杜佳慧\n202441 叶子凡\n202442 程思琪\n202443 苏晨辉\n202444 魏梓琪\n202445 薛子轩";

window.THEME_ICON = "🎭";
window.THEME_SFX  = {"win":"gong"};
window.THEME_MUSIC = {"bpm":88,"root":45,"stepsPerBar":16,"chords":[[0,7,12,16],[5,12,15,19],[8,15,19,24],[7,14,17,21]],"pad":{"wave":"triangle","vol":0.06,"oct":1,"dur":1.06,"atk":0.62,"cut":2000},"bass":{"pat":[1,0,0,0,1,0,0,0],"oct":0,"vol":0.078,"wave":"sine","dur":5,"cut":300},"arp":{"pat":[0,2,1,3,4,3,1,2],"wave":"sine","vol":0.036,"oct":2,"dur":1.4},"drums":"lofi","drumVol":0.55,"swing":0.18,"reverb":0.4,"delay":0.34,"bells":true};

/* ==========================================================================
   课堂随机点名 v2 · 页面内核运行时
   由构建脚本注入到每个模板，模板只需提供 stageInit / stageStartRoll /
   stageStopRoll / onResetHook 等钩子。
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  0. 小工具
   * ------------------------------------------------------------------ */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const toastWrap = document.createElement('div');
  toastWrap.className = 'tc-toast-wrap';
  document.body.appendChild(toastWrap);

  function toast(msg, ms) {
    const el = document.createElement('div');
    el.className = 'tc-toast';
    el.textContent = msg;
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, ms || 2200);
  }

  /* 自定义确认框（替代原生 confirm，不打断音频） */
  function confirmBox(msg, onOk, okText) {
    const bd = document.createElement('div');
    bd.className = 'tc-modal-backdrop active';
    bd.innerHTML =
      '<div class="tc-modal" style="max-width:420px;">' +
      '<div class="tc-modal-head"><h3 class="tc-modal-title">请确认</h3></div>' +
      '<p class="tc-modal-tip" style="font-size:14px;color:#e2e8f0;"></p>' +
      '<div class="tc-modal-foot" style="justify-content:flex-end;">' +
      '<div><button class="btn-sub" data-no>取消</button>' +
      '<button class="btn-primary" data-yes></button></div></div></div>';
    bd.querySelector('.tc-modal-tip').textContent = msg;
    bd.querySelector('[data-yes]').textContent = okText || '确认';
    document.body.appendChild(bd);
    const close = () => bd.remove();
    bd.querySelector('[data-no]').onclick = close;
    bd.addEventListener('click', e => { if (e.target === bd) close(); });
    bd.querySelector('[data-yes]').onclick = () => { close(); onOk && onOk(); };
  }

  /* ------------------------------------------------------------------ *
   *  1. 自适应网格：保证 N 个元素在舞台内完整排布，绝不出屏
   * ------------------------------------------------------------------ */
  function autoFitGrid(el, n, opt) {
    if (!el || !n) return;
    opt = opt || {};
    const gap = opt.gap || 10;
    const ratio = opt.ratio || 1.25;   // 单元格 高/宽 比
    const minW = opt.minW || 54;
    const maxW = opt.maxW || 260;
    const maxH = opt.maxH || 9999;
    const pad = opt.pad || 4;

    const W = el.clientWidth - pad * 2;
    const H = el.clientHeight - pad * 2;
    if (W <= 0 || H <= 0) return;

    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols);
      const cw = (W - gap * (cols - 1)) / cols;
      const ch = (H - gap * (rows - 1)) / rows;
      if (cw <= 0 || ch <= 0) continue;
      const needH = cw * ratio;
      const size = Math.min(cw, ch / ratio);
      const fits = ch >= needH;
      const score = size - (fits ? 0 : 1000) + (cw <= maxW ? 0 : -500);
      if (!best || score > best.score) best = { cols, cw, ch, score, fits };
    }
    if (!best) return;
    const cw = clamp(best.cw, 30, maxW);
    const ch = clamp(Math.min(best.ch, cw * ratio), 26, maxH);
    el.style.gridTemplateColumns = 'repeat(' + best.cols + ', ' + cw.toFixed(2) + 'px)';
    el.style.gridAutoRows = ch.toFixed(2) + 'px';
    el.style.gap = gap + 'px';
    el.dataset.cols = best.cols;
    el.dataset.cw = cw.toFixed(1);
    el.dataset.ch = ch.toFixed(1);
    return { cols: best.cols, cw, ch };
  }

  /* ------------------------------------------------------------------ *
   *  2. 音频引擎：每套主题独立 BGM + 三段式场景音效
   *     点名前 → Risers/倒数；摇人时 → 加速脉冲；抽中时 → 号角庆典
   * ------------------------------------------------------------------ */
  const Music = (function () {
    let ctx = null, master, comp, revNode, revGain, dlyNode, dlyGain, noiseBuf = null;
    let muted = false, bgmOn = false, fast = false;
    let step = 0, nextTime = 0, timer = null, intensity = 0;

    /* 主题音乐配置（由模板注入 window.THEME_MUSIC） */
    const DEF = {
      bpm: 96,
      root: 45,                 // A2
      stepsPerBar: 16,
      chords: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-5, -2, 2]],
      pad: { wave: 'sawtooth', vol: 0.030, oct: 0, dur: 0.99, atk: 0.35, cut: 1500 },
      bass: { pat: [1, 0, 0, 0, 1, 0, 1, 0], oct: 1, vol: 0.085, wave: 'triangle', dur: 0.6, cut: 420 },
      arp: { pat: [0, 2, 4, 7, 4, 2, 0, 2], wave: 'triangle', vol: 0.045, oct: 2, dur: 0.5 },
      lead: null,
      drums: 'none',
      drumVol: 1,
      swing: 0,
      reverb: 0.32,
      delay: 0.16,
      bells: true
    };
    const M = (function () {
      const src = window.THEME_MUSIC || {};
      const out = Object.assign({}, DEF);
      Object.keys(src).forEach(k => {
        out[k] = (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]))
          ? Object.assign({}, DEF[k] || {}, src[k]) : src[k];
      });
      return out;
    })();

    const midi = m => 440 * Math.pow(2, (m - 69) / 12);

    function getCtx() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.9;
        comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 26;
        comp.ratio.value = 5;
        comp.attack.value = 0.004;
        comp.release.value = 0.22;
        master.connect(comp);
        comp.connect(ctx.destination);

        /* 混响：程序生成脉冲响应，营造空间氛围感 */
        revNode = ctx.createConvolver();
        revNode.buffer = makeIR(ctx, 2.6, 2.6);
        revGain = ctx.createGain();
        revGain.gain.value = M.reverb;
        revNode.connect(revGain);
        revGain.connect(master);

        /* 立体延迟 */
        dlyNode = ctx.createDelay(1.0);
        dlyNode.delayTime.value = 60 / M.bpm * 0.75;
        dlyGain = ctx.createGain();
        dlyGain.gain.value = M.delay;
        dlyNode.connect(dlyGain);
        dlyGain.connect(dlyNode);
        dlyGain.connect(master);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function makeIR(c, seconds, decay) {
      const rate = c.sampleRate, len = Math.floor(rate * seconds);
      const buf = c.createBuffer(2, len, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
        }
      }
      return buf;
    }

    function noise(c) {
      if (!noiseBuf) {
        const len = Math.floor(c.sampleRate * 1.2);
        noiseBuf = c.createBuffer(1, len, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      return noiseBuf;
    }

    /* ---- 基础音色 ---- */
    function env(g, t, a, d, peak, sus) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.setTargetAtTime(sus === undefined ? 0.0001 : sus, t + a, d);
    }

    function tone(freq, t, dur, vol, wave, dest, opt) {
      if (!ctx || muted) return;
      opt = opt || {};
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = wave || 'triangle';
      o.frequency.setValueAtTime(freq, t);
      if (opt.glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.glide), t + dur);
      if (opt.detune) o.detune.setValueAtTime(opt.detune, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + (opt.atk || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = o;
      if (opt.cut) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(opt.cut, t);
        if (opt.cutTo) f.frequency.exponentialRampToValueAtTime(opt.cutTo, t + dur);
        o.connect(f); node = f;
      }
      node.connect(g);
      g.connect(dest || master);
      o.start(t); o.stop(t + dur + 0.05);
    }

    function bell(freq, t, dur, vol) {
      if (!ctx || muted) return;
      const car = ctx.createOscillator(), mod = ctx.createOscillator();
      const mg = ctx.createGain(), g = ctx.createGain();
      car.type = 'sine'; car.frequency.value = freq;
      mod.type = 'sine'; mod.frequency.value = freq * 2.76;
      mg.gain.setValueAtTime(freq * 1.6, t);
      mg.gain.exponentialRampToValueAtTime(1, t + dur * 0.5);
      mod.connect(mg); mg.connect(car.frequency);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      car.connect(g); g.connect(master);
      if (revNode) g.connect(revNode);
      mod.start(t); car.start(t);
      mod.stop(t + dur + 0.05); car.stop(t + dur + 0.05);
    }

    function kick(t, vol) {
      if (!ctx || muted) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.11);
      g.gain.setValueAtTime(vol * 0.34, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.19);
    }
    function sub(t, vol) {
      if (!ctx || muted) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(90, t);
      o.frequency.exponentialRampToValueAtTime(30, t + 0.5);
      g.gain.setValueAtTime(vol * 0.4, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.7);
    }
    function snare(t, vol) {
      if (!ctx || muted) return;
      const n = ctx.createBufferSource(); n.buffer = noise(ctx);
      n.playbackRate.value = 1;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1100;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      n.connect(f); f.connect(g); g.connect(master);
      if (revNode) g.connect(revNode);
      n.start(t); n.stop(t + 0.16);
    }
    function clap(t, vol) {
      if (!ctx || muted) return;
      for (let i = 0; i < 3; i++) {
        const n = ctx.createBufferSource(); n.buffer = noise(ctx);
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1600;
        const g = ctx.createGain();
        const tt = t + i * 0.011;
        g.gain.setValueAtTime(vol * 0.16, tt);
        g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.09);
        n.connect(f); f.connect(g); g.connect(master);
        n.start(tt); n.stop(tt + 0.1);
      }
    }
    function hat(t, vol, open) {
      if (!ctx || muted) return;
      const n = ctx.createBufferSource(); n.buffer = noise(ctx);
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
      const g = ctx.createGain();
      const d = open ? 0.24 : 0.035;
      g.gain.setValueAtTime(vol * 0.09, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t); n.stop(t + d + 0.02);
    }
    function shaker(t, vol) {
      if (!ctx || muted) return;
      const n = ctx.createBufferSource(); n.buffer = noise(ctx);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * 0.07, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t); n.stop(t + 0.09);
    }
    function tom(t, freq, vol) {
      if (!ctx || muted) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + 0.2);
      g.gain.setValueAtTime(vol * 0.24, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.3);
    }
    function crash(t, vol) {
      if (!ctx || muted) return;
      const n = ctx.createBufferSource(); n.buffer = noise(ctx);
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.22, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      n.connect(f); f.connect(g); g.connect(master);
      if (revNode) g.connect(revNode);
      n.start(t); n.stop(t + 1.15);
    }
    function riser(t, dur, vol) {
      if (!ctx || muted) return;
      const n = ctx.createBufferSource(); n.buffer = noise(ctx); n.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3.5;
      f.frequency.setValueAtTime(240, t);
      f.frequency.exponentialRampToValueAtTime(7200, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * 0.22, t + dur * 0.92);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
      n.connect(f); f.connect(g); g.connect(master);
      if (revNode) g.connect(revNode);
      n.start(t); n.stop(t + dur + 0.15);
      /* 音高同步上扬的哨音，增强紧张感 */
      tone(420, t, dur, vol * 0.05, 'sawtooth', master, { glide: 2400, cut: 3000, cutTo: 6000 });
    }
    function whoosh(t, dur, vol) {
      if (!ctx || muted) return;
      const n = ctx.createBufferSource(); n.buffer = noise(ctx); n.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.6;
      f.frequency.setValueAtTime(3800, t);
      f.frequency.exponentialRampToValueAtTime(320, t + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol * 0.2, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t); n.stop(t + dur + 0.05);
    }
    function gong(t, vol) {
      if (!ctx || muted) return;
      const base = 96;
      [1, 2.02, 2.98, 4.1, 5.43, 6.8].forEach((mul, i) => {
        tone(base * mul, t + i * 0.006, 2.4 - i * 0.2, vol * (0.10 / (1 + i * 0.75)), 'sine', master);
      });
      const n = ctx.createBufferSource(); n.buffer = noise(ctx);
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 0.1, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      n.connect(f); f.connect(g); g.connect(master);
      n.start(t); n.stop(t + 0.85);
    }
    function choir(freq, t, dur, vol) {
      [0, 7, 12, 16].forEach((iv, i) => {
        tone(freq * Math.pow(2, iv / 12), t, dur, vol * (0.05 - i * 0.007), 'sawtooth', master,
          { detune: (i - 1.5) * 9, atk: 0.22, cut: 1100 + i * 260 });
      });
    }

    /* ---- 鼓组：按风格驱动 ---- */
    function drums(s, t, spb) {
      const P = M.stepsPerBar;
      const v = M.drumVol;
      switch (M.drums) {
        case 'four':
          if (s % 4 === 0) kick(t, v);
          if (s % 8 === 4) snare(t, v);
          if (s % 2 === 0) hat(t, v, s % 8 === 6);
          break;
        case 'waltz':
          if (s === 0) { kick(t, v); crash(t, v * 0.5); }
          if (s === Math.round(P / 3)) snare(t, v * 0.7);
          if (s % Math.round(P / 3) === 0) hat(t, v, true);
          else if (s % 2 === 0) hat(t, v, false);
          break;
        case 'swing': {
          const sw = M.swing || 0.18;
          if (s === 0 || s === Math.round(P * 0.62)) kick(t, v);
          if (s === Math.round(P / 4) || s === Math.round(P * 0.75)) snare(t, v);
          if (s % 2 === 0) hat(t + (s % 4 === 2 ? spb * sw : 0), v, false);
          if (s === 0) crash(t, v * 0.4);
          break;
        }
        case 'rock':
          if (s === 0 || s === 6 || s === 8 || s === 14) kick(t, v);
          if (s === 4 || s === 12) snare(t, v * 1.1);
          if (s % 2 === 0) hat(t, v, s === 6 || s === 14);
          if (s === 0) crash(t, v * 0.6);
          break;
        case 'march':
          if (s === 0 || s === 8) kick(t, v);
          if (s % 4 === 2) snare(t, v * 0.85);
          if (s >= 12 && s % 2 === 0) snare(t, v * 0.5);
          if (s % 8 === 6) tom(t, 200, v * 0.6);
          break;
        case 'trap':
          if (s === 0 || s === 6 || s === 10) kick(t, v);
          if (s === 8) snare(t, v);
          if (s % 2 === 0) hat(t, v, false);
          if (s === 7 || s === 15) { hat(t + spb * 0.5, v * 0.7, false); hat(t + spb * 0.75, v * 0.5, false); }
          break;
        case 'lofi':
          if (s === 0 || s === 10) kick(t, v * 0.85);
          if (s === 4 || s === 12) snare(t, v * 0.55);
          if (s % 2 === 0) hat(t, v * 0.45, false);
          break;
        case 'heart':
          if (s === 0) { kick(t, v * 1.15); sub(t, v * 0.9); }
          if (s === 3) kick(t, v * 0.55);
          if (s === 8) { kick(t, v * 0.85); sub(t, v * 0.6); }
          if (s === 11) kick(t, v * 0.4);
          break;
        case 'shaker':
          if (s % 2 === 0) shaker(t, v);
          if (s === 0) kick(t, v * 0.7);
          if (s === 8) clap(t, v * 0.8);
          break;
        case 'taiko':
          if (s % 4 === 0) { kick(t, v * 1.2); tom(t, 130, v); }
          if (s === 6 || s === 14) tom(t, 175, v * 0.8);
          if (s === 10) tom(t, 155, v * 0.7);
          break;
        case 'clap':
          if (s === 0 || s === 10) kick(t, v);
          if (s % 8 === 4) clap(t, v);
          if (s % 2 === 0) hat(t, v * 0.8, false);
          break;
        default: break;
      }
    }

    /* ---- 调度器（前瞻式，节奏稳） ---- */
    function barIndex() { return Math.floor(step / M.stepsPerBar); }

    function scheduleStep(s, t) {
      const P = M.stepsPerBar;
      const spb = 60 / (M.bpm * (fast ? 1.42 : 1)) / (P / 4);
      const chord = M.chords[barIndex() % M.chords.length];
      const swingOff = (M.swing && s % 2 === 1) ? spb * M.swing : 0;

      if (M.drums && M.drums !== 'none') drums(s, t, spb);

      if (s % P === 0) {
        /* Pad 铺底和声：氛围感来源 */
        const p = M.pad;
        chord.forEach(iv => {
          tone(midi(M.root + iv + 12 * p.oct), t, spb * P * p.dur,
            p.vol * (1 + intensity * 0.5), p.wave, master,
            { atk: p.atk, cut: p.cut, detune: rand(-6, 6) });
        });
        if (revNode) { /* pad 已连 master，混响经 revGain 全局送出 */ }
      }

      /* Bass */
      const b = M.bass;
      if (b.pat && b.pat.length) {
        const bi = s % b.pat.length;
        if (b.pat[bi]) {
          tone(midi(M.root + b.oct * 12 + chord[0]), t, spb * (P / b.pat.length) * b.dur,
            b.vol * (1 + intensity * 0.6), b.wave, master, { cut: b.cut, atk: 0.01 });
        }
      }

      /* Arp 琶音 */
      const a = M.arp;
      if (a && a.pat && a.pat.length) {
        const unit = P / a.pat.length;
        if (s % unit === 0) {
          const deg = a.pat[Math.floor(s / unit) % a.pat.length];
          if (deg >= 0) {
            const note = M.root + 12 * a.oct + chord[deg % chord.length] + 12 * Math.floor(deg / chord.length);
            tone(midi(note), t + swingOff, spb * unit * a.dur, a.vol, a.wave, dlyNode || master,
              { cut: 4200, atk: 0.004 });
            if (M.bells && Math.random() < 0.16) bell(midi(note + 12), t + swingOff, 0.9, 0.02);
          }
        }
      }

      /* Lead 主旋律 */
      const ld = M.lead;
      if (ld && ld.pat && ld.pat.length) {
        const unit = P / ld.pat.length;
        if (s % unit === 0) {
          const deg = ld.pat[Math.floor(s / unit) % ld.pat.length];
          if (deg >= 0 && deg !== null) {
            const note = M.root + 12 * (ld.oct || 2) + chord[deg % chord.length]
              + 12 * Math.floor(deg / chord.length) + (ld.extra || 0);
            tone(midi(note), t + swingOff, spb * unit * (ld.dur || 0.85), ld.vol || 0.05,
              ld.wave || 'triangle', dlyNode || master, { atk: ld.atk || 0.02, cut: 5200 });
          }
        }
      }
    }

    function stepDur() {
      return 60 / (M.bpm * (fast ? 1.42 : 1)) / (M.stepsPerBar / 4);
    }

    function tick() {
      const c = getCtx();
      if (!c || !bgmOn) return;
      while (nextTime < c.currentTime + 0.25) {
        scheduleStep(step, Math.max(nextTime, c.currentTime + 0.02));
        nextTime += stepDur();
        step++;
      }
      timer = setTimeout(tick, 30);
    }

    function startBGM() {
      const c = getCtx();
      if (!c || bgmOn) return;
      bgmOn = true;
      step = 0;
      nextTime = c.currentTime + 0.08;
      tick();
    }
    function stopBGM() {
      bgmOn = false;
      if (timer) { clearTimeout(timer); timer = null; }
    }

    /* ---- 场景音效 A：点名前（Risers + 倒数） ---- */
    function sfxPrepare() {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      riser(t, 0.85, 1);
      [0, 0.34, 0.58, 0.74].forEach((off, i) => {
        bell(midi(72 + i * 4), t + off, 0.32, 0.055 + i * 0.012);
      });
      kick(t + 0.86, 1.15);
      sub(t + 0.86, 1.2);
      whoosh(t + 0.86, 0.45, 1.1);
    }

    /* ---- 场景音效 B：摇人中（加速脉冲） ---- */
    let rollTicks = 0;
    function sfxRoll(ratio) {
      const c = getCtx(); if (!c || muted) return;
      const t = c.currentTime;
      const r = clamp(ratio || 0, 0, 1);
      const f = 520 + r * 900 + rand(-40, 40);
      tone(f, t, 0.045, 0.055, 'square', master, { cut: 5200 });
      if (rollTicks % 4 === 0) tone(f * 2, t, 0.03, 0.028, 'triangle', master);
      if (rollTicks % 16 === 0) { tom(t, 150 + r * 90, 0.7); }
      if (rollTicks % 32 === 0) crash(t, 0.35 * (0.5 + r * 0.5));
      rollTicks++;
    }
    function sfxRollReset() { rollTicks = 0; }

    /* ---- 场景音效 C：抽中时（号角庆典） ---- */
    function sfxWin(flavor) {
      const c = getCtx(); if (!c) return;
      const t = c.currentTime;
      flavor = flavor || 'fanfare';
      kick(t, 1.3); sub(t, 1.25); crash(t, 1.05);

      if (flavor === 'gong') {
        gong(t, 1.2);
        setTimeout(() => { const cc = getCtx(); if (cc) gong(cc.currentTime, 0.7); }, 380);
      } else if (flavor === 'chime') {
        [0, 4, 7, 12, 16, 19, 24].forEach((iv, i) => {
          bell(midi(69 + iv), t + i * 0.055, 1.5, 0.075);
        });
      } else if (flavor === 'epic') {
        choir(midi(45), t, 2.2, 1.5);
        [0, 7, 12, 19].forEach((iv, i) => {
          tone(midi(45 + iv), t + 0.02 * i, 1.6, 0.075, 'sawtooth', master, { atk: 0.05, cut: 2600 });
        });
        [0, 0.12, 0.24].forEach((o, i) => tom(t + o, 90 + i * 25, 1.1));
      } else if (flavor === 'arcade') {
        [0, 4, 7, 12, 12, 19, 24].forEach((iv, i) => {
          tone(midi(72 + iv), t + i * 0.06, 0.16, 0.085, 'square', master, { cut: 6000 });
        });
        bell(midi(96), t + 0.45, 0.7, 0.06);
      } else {
        /* fanfare */
        [0, 4, 7, 12, 16, 19, 24].forEach((iv, i) => {
          tone(midi(60 + iv), t + i * 0.062, 0.85, 0.085, 'sawtooth', master,
            { atk: 0.012, cut: 3400, detune: rand(-5, 5) });
        });
      }
      /* 花瓣式高频闪烁 */
      for (let i = 0; i < 9; i++) {
        setTimeout(() => { const cc = getCtx(); if (cc) bell(midi(84 + randInt(0, 14)), cc.currentTime, 0.7, 0.035); },
          260 + i * 95);
      }
    }

    /* ---- 通用交互音 ---- */
    function sfxClick() {
      const c = getCtx(); if (!c || muted) return;
      tone(880, c.currentTime, 0.06, 0.05, 'triangle', master);
    }
    function sfxFlip() {
      const c = getCtx(); if (!c || muted) return;
      whoosh(c.currentTime, 0.18, 0.7);
      tone(1200, c.currentTime, 0.09, 0.04, 'triangle', master, { cut: 6000 });
    }

    function initAutoPlay() {
      const trigger = () => {
        if (!muted) startBGM();
        window.removeEventListener('pointerdown', trigger);
        window.removeEventListener('keydown', trigger);
        window.removeEventListener('touchstart', trigger);
      };
      window.addEventListener('pointerdown', trigger);
      window.addEventListener('keydown', trigger);
      window.addEventListener('touchstart', trigger);
    }

    return {
      init: getCtx,
      startBGM, stopBGM, initAutoPlay, sfxPrepare, sfxRoll, sfxRollReset,
      sfxWin, sfxClick, sfxFlip, riser, whoosh, bell, tone, midi, kick, sub, crash, gong, choir,
      setIntensity: v => { intensity = v; },
      setFast: v => { fast = !!v; dlyNode && (dlyNode.delayTime.value = 60 / (M.bpm * (v ? 1.42 : 1)) * 0.75); },
      toggleBGM: () => { if (bgmOn) { stopBGM(); return false; } else { startBGM(); return true; } },
      toggleMute: () => { muted = !muted; if (muted) stopBGM(); else startBGM(); return muted; },
      isMuted: () => muted,
      isPlaying: () => bgmOn,
      isFast: () => fast
    };
  })();

  /* ------------------------------------------------------------------ *
   *  3. 特效引擎：礼花 / 烟花 / 星光 / 冲击环 / 速度线 / 文字粒子 / 闪白
   * ------------------------------------------------------------------ */
  const FX = (function () {
    const cv = document.getElementById('fx-canvas');
    const ctx = cv.getContext('2d');
    const fv = document.getElementById('flash-canvas');
    const fctx = fv ? fv.getContext('2d') : null;
    let parts = [], raf = null, dpr = 1, flashA = 0, flashColor = '#fff';

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      [cv, fv].forEach(c => {
        if (!c) return;
        c.width = Math.floor(innerWidth * dpr);
        c.height = Math.floor(innerHeight * dpr);
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (fctx) fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener('resize', resize);
    resize();

    const PALETTE = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#fde047', '#22d3ee', '#ffffff'];

    function push(p) { parts.push(p); if (!raf) loop(); }
    function ensure() { if (!raf) loop(); }

    function confetti(x, y, n, colors) {
      const cl = colors || PALETTE;
      for (let i = 0; i < n; i++) {
        push({
          t: 'rect',
          x: x + rand(-60, 60), y: y + rand(-24, 24),
          vx: rand(-9, 9), vy: rand(-19, -4),
          w: rand(6, 15), h: rand(4, 10),
          rot: rand(0, 360), vrot: rand(-16, 16),
          g: 0.4, life: 1, decay: rand(0.006, 0.013), color: pick(cl)
        });
      }
    }

    function sparks(x, y, n, color) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(2, 13);
        push({
          t: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          r: rand(1.5, 4), g: 0.13, life: 1, decay: rand(0.014, 0.03),
          color: color || pick(PALETTE)
        });
      }
    }

    function stars(x, y, n, color) {
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(1, 7);
        push({
          t: 'star', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.5,
          r: rand(3, 7), rot: rand(0, 360), vrot: rand(-9, 9),
          g: 0.05, life: 1, decay: rand(0.008, 0.018), color: color || pick(PALETTE)
        });
      }
    }

    function ring(x, y, color, maxR, n) {
      for (let i = 0; i < (n || 2); i++) {
        push({ t: 'ring', x, y, r: 6 + i * 22, grow: 7 + i * 2.6, life: 1, decay: 0.03, lw: 4 - i, color: color || '#fff' });
      }
    }

    function textPop(text, x, y, color, size) {
      push({
        t: 'text', x, y, vx: rand(-1.2, 1.2), vy: -3.2, txt: text,
        r: size || 26, g: 0.02, life: 1, decay: 0.008,
        rot: rand(-9, 9), color: color || '#fff'
      });
    }

    function firework(x, y, color) {
      const c0 = color || pick(PALETTE);
      const c1 = pick(PALETTE);
      const n = randInt(46, 78);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rand(-0.06, 0.06);
        const sp = rand(3.5, 11) * (Math.random() < 0.35 ? 1.5 : 1);
        push({
          t: 'dot', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          r: rand(1.6, 3.6), g: 0.11, life: 1, decay: rand(0.011, 0.022),
          trail: true, color: Math.random() < 0.5 ? c0 : c1
        });
      }
      ring(x, y, c0, 60);
      flash(c0, 0.16);
    }

    function fireworksShow(count, ms) {
      count = count || 6;
      ms = ms || 1900;
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          firework(rand(innerWidth * 0.12, innerWidth * 0.88), rand(innerHeight * 0.1, innerHeight * 0.55));
        }, i * (ms / count) + rand(0, 120));
      }
    }

    function speedLines(dur, color) {
      const n = 34;
      for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(10, 30);
        push({
          t: 'line', x: innerWidth / 2, y: innerHeight / 2,
          vx: Math.cos(a) * sp * 3, vy: Math.sin(a) * sp * 3,
          len: rand(30, 110), life: 1, decay: 0.1,
          color: color || 'rgba(255,255,255,.75)'
        });
      }
      ensure();
      setTimeout(() => { }, dur);
    }

    function emojiBurst(x, y, chars, n) {
      chars = chars || ['⭐', '✨', '🎉', '💫', '🌟'];
      n = n || 14;
      for (let i = 0; i < n; i++) {
        const a = rand(-Math.PI, 0), sp = rand(3, 11);
        push({
          t: 'text', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          txt: pick(chars), r: rand(18, 40), g: 0.24, life: 1, decay: 0.01,
          rot: rand(-30, 30), color: '#fff'
        });
      }
    }

    function shockwave() {
      const cx = innerWidth / 2, cy = innerHeight * 0.45;
      for (let i = 0; i < 3; i++) ring(cx, cy, '#ffffff', 0, 1);
      speedLines(400);
    }

    function flash(color, alpha) {
      flashColor = color || '#fff';
      flashA = alpha === undefined ? 0.32 : alpha;
    }

    function shake(power) {
      const d = document.documentElement;
      d.style.setProperty('--shake-p', power || 1);
      document.body.classList.remove('screen-shake');
      void document.body.offsetWidth;
      document.body.classList.add('screen-shake');
      setTimeout(() => document.body.classList.remove('screen-shake'), 420);
    }

    function loop() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (fctx) {
        fctx.clearRect(0, 0, innerWidth, innerHeight);
        if (flashA > 0.002) {
          fctx.globalAlpha = flashA;
          fctx.fillStyle = flashColor;
          fctx.fillRect(0, 0, innerWidth, innerHeight);
          fctx.globalAlpha = 1;
          flashA *= 0.82;
        } else flashA = 0;
      }

      const H = innerHeight;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += p.g || 0;
        p.vx *= 0.995;
        p.life -= p.decay;
        if (p.t === 'ring') p.r += p.grow;
        if (p.rot !== undefined) p.rot += p.vrot || 0;

        if (p.life <= 0 || p.y > H + 120) { parts.splice(i, 1); continue; }

        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.save();
        ctx.translate(p.x, p.y);
        if (p.rot) ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;

        switch (p.t) {
          case 'rect':
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            break;
          case 'dot':
            ctx.shadowBlur = p.trail ? 12 : 6;
            ctx.shadowColor = p.color;
            ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.284); ctx.fill();
            ctx.shadowBlur = 0;
            break;
          case 'star': {
            ctx.shadowBlur = 14; ctx.shadowColor = p.color;
            ctx.beginPath();
            for (let k = 0; k < 5; k++) {
              const a1 = (k * 4 * Math.PI) / 5 - Math.PI / 2;
              const a2 = ((k * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
              ctx.lineTo(Math.cos(a1) * p.r, Math.sin(a1) * p.r);
              ctx.lineTo(Math.cos(a2) * p.r * 0.42, Math.sin(a2) * p.r * 0.42);
            }
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur = 0;
            break;
          }
          case 'ring':
            ctx.lineWidth = p.lw;
            ctx.globalAlpha = Math.max(0, p.life) * 0.85;
            ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.284); ctx.stroke();
            break;
          case 'text':
            ctx.font = '900 ' + p.r + 'px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(0,0,0,.6)';
            ctx.fillText(p.txt, 0, 0);
            ctx.shadowBlur = 0;
            break;
          case 'line':
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 0);
            ctx.lineTo(-p.vx * 1.6, -p.vy * 1.6); ctx.stroke();
            break;
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      if (parts.length) raf = requestAnimationFrame(loop);
      else { raf = null; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }

    function clear() { parts = []; ctx.clearRect(0, 0, innerWidth, innerHeight); }

    return {
      confetti, sparks, stars, ring, textPop, firework, fireworksShow,
      speedLines, emojiBurst, shockwave, flash, shake, clear,
      center: () => ({ x: innerWidth / 2, y: innerHeight * 0.45 })
    };
  })();

  /* ------------------------------------------------------------------ *
   *  4. 名单数据层
   * ------------------------------------------------------------------ */
  const PKEY = 'CLASSROOM_ROLLCALL_V2_STUDENTS';
  const PKEY_V1 = 'CLASSROOM_ROLLCALL_STUDENTS_GLOBAL';
  /* 构建时会注入 const DEFAULT_STUDENTS_RAW = "..."（同一 script 作用域，不挂 window） */
  const DEFAULT_RAW = (typeof DEFAULT_STUDENTS_RAW !== 'undefined' && DEFAULT_STUDENTS_RAW)
    || '01 张三\n02 李四';

  let studentList = [], remainPool = [], historyList = [];
  let rolling = false;

  function parseText(t) {
    if (!t || !t.trim()) return [];
    return t.split(/\r?\n/).map((line, idx) => {
      const tr = line.trim();
      if (!tr || tr.charAt(0) === '#') return null;
      const pts = tr.split(/[\s,，、\t;；]+/).filter(Boolean);
      if (pts.length >= 2) return { id: pts[0], name: pts.slice(1).join(' ') };
      return { id: String(idx + 1).padStart(2, '0'), name: pts[0] || '' };
    }).filter(s => s && s.name);
  }
  function formatText(list) { return list.map(s => s.id + ' ' + s.name).join('\n'); }

  function readSaved() {
    let raw = localStorage.getItem(PKEY);
    if (!raw || !raw.trim()) raw = localStorage.getItem(PKEY_V1);
    return raw && raw.trim() ? raw : '';
  }

  function loadStudents() {
    const saved = readSaved();
    studentList = parseText(saved || DEFAULT_RAW);
    if (!studentList.length) studentList = parseText(DEFAULT_RAW);
    resetPool(true);
  }

  function saveStudents(raw) {
    try { localStorage.setItem(PKEY, raw); localStorage.setItem(PKEY_V1, raw); } catch (e) { }
  }

  function resetPool(silent) {
    remainPool = studentList.slice();
    historyList = [];
    updateStats();
    renderHistory();
    if (!silent && typeof onResetHook === 'function') onResetHook();
  }

  function updateStats() {
    const a = document.getElementById('stat-total');
    if (a) a.textContent = studentList.length;
    const b = document.getElementById('stat-remain');
    if (b) b.textContent = remainPool.length;
    const c = document.getElementById('stat-called');
    if (c) c.textContent = historyList.length;
  }

  function getCount() {
    const el = document.getElementById('sel-count');
    return clamp(parseInt(el && el.value) || 1, 1, 6);
  }
  function noRepeat() {
    const el = document.getElementById('chk-norepeat');
    return el ? el.checked : true;
  }

  function pickWinners() {
    const usePool = noRepeat();
    let pool = usePool ? remainPool : studentList;
    if (!pool.length) {
      toast('本轮所有同学都点过一遍啦，已自动开启新一轮 🔄');
      resetPool(true);
      pool = usePool ? remainPool : studentList;
    }
    const n = Math.min(getCount(), pool.length);
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const chosen = arr.slice(0, n);
    chosen.forEach(c => {
      if (usePool) {
        const i = remainPool.findIndex(s => s.id === c.id && s.name === c.name);
        if (i > -1) remainPool.splice(i, 1);
      }
      historyList.push(c);
    });
    updateStats();
    return chosen;
  }

  /* ---- 历史记录条 ---- */
  function renderHistory() {
    const track = document.getElementById('themed-history-list');
    if (!track) return;
    track.innerHTML = '';
    if (!historyList.length) {
      const e = document.createElement('div');
      e.className = 'history-empty';
      e.textContent = '还没有抽取记录，按空格或点击下方按钮开始吧 ~';
      track.appendChild(e);
      return;
    }
    historyList.slice().reverse().forEach(w => addHistoryPill(w, track, false));
  }
  function addHistoryPill(w, track, prepend) {
    if (!track) track = document.getElementById('themed-history-list');
    if (!track) return;
    const empty = track.querySelector('.history-empty');
    if (empty) empty.remove();
    const pill = document.createElement('div');
    pill.className = 'hist-pill';
    pill.innerHTML = '<span>' + (window.THEME_ICON || '🎯') + '</span>' +
      '<span class="id-tag" style="opacity:.75">' + w.id + '</span> <b>' + w.name + '</b>';
    if (typeof themedPillStyle === 'function') themedPillStyle(pill);
    if (prepend === false) track.appendChild(pill); else track.prepend(pill);
    track.scrollLeft = 0;
  }
  function pushHistory(winners) {
    winners.forEach(w => addHistoryPill(w, null, true));
  }

  /* ------------------------------------------------------------------ *
   *  5. 开始 / 停止
   * ------------------------------------------------------------------ */
  const btnStart = document.getElementById('btn-start');
  const btnIcon = document.getElementById('btn-icon');
  const btnText = document.getElementById('btn-text');
  const ORIG_ICON = btnIcon ? btnIcon.textContent : '▶';
  const ORIG_TEXT = btnText ? btnText.textContent : '开始点名';

  function setBtn(stop) {
    if (!btnStart) return;
    btnStart.classList.toggle('stop', stop);
    if (btnIcon) btnIcon.textContent = stop ? '⏹' : ORIG_ICON;
    if (btnText) btnText.textContent = stop ? '停止点名' : ORIG_TEXT;
  }

  function startRolling() {
    if (!studentList.length) { toast('请先在【名单管理】里添加学生名单 📝'); return; }
    rolling = true;
    setBtn(true);
    Music.setFast(true);
    Music.setIntensity(1);
    Music.sfxPrepare();          // 场景音效 A：点名前
    Music.sfxRollReset();
    FX.shockwave();
    if (typeof stageStartRoll === 'function') stageStartRoll();
  }

  function stopRolling() {
    rolling = false;
    setBtn(false);
    Music.setFast(false);
    Music.setIntensity(0);
    const winners = pickWinners();
    if (typeof stageStopRoll === 'function') stageStopRoll(winners);
    if (typeof revealWinners === 'function') revealWinners(winners);
    else defaultReveal(winners);
    Music.sfxWin(window.THEME_SFX && window.THEME_SFX.win);
    pushHistory(winners);
    /* 抽中特效：礼花 + 多层烟花 + 星光 */
    const c = FX.center();
    FX.confetti(c.x, c.y, 130);
    FX.sparks(c.x, c.y, 40, '#ffffff');
    FX.stars(c.x, c.y, 26);
    FX.ring(c.x, c.y);
    FX.fireworksShow(4, 1500);
    FX.flash('#ffffff', 0.3);
    FX.shake(1);
  }

  function toggleRoll() { rolling ? stopRolling() : startRolling(); }

  if (btnStart) btnStart.addEventListener('click', toggleRoll);

  /* ---- 通用揭晓浮层（未自定义 revealWinners 的模板走这里） ---- */
  function defaultReveal(winners) {
    let box = document.getElementById('tc-reveal');
    if (!box) {
      box = document.createElement('div');
      box.id = 'tc-reveal';
      box.className = 'tc-reveal';
      box.innerHTML = '<div class="tc-reveal-title">🎉 恭喜以下同学被点到 🎉</div><div class="tc-reveal-cards"></div>';
      (document.querySelector('.tc-stage') || document.body).appendChild(box);
    }
    const cards = box.querySelector('.tc-reveal-cards');
    cards.innerHTML = '';
    winners.forEach((w, i) => {
      const d = document.createElement('div');
      d.className = 'tc-reveal-card';
      d.style.animationDelay = (i * 0.09) + 's';
      d.innerHTML = '<div class="rc-id id-tag">' + w.id + '</div><div class="rc-name">' + w.name + '</div>';
      cards.appendChild(d);
    });
    box.classList.add('active');
  }
  function clearReveal() {
    const box = document.getElementById('tc-reveal');
    if (box) box.classList.remove('active');
    if (typeof stageClearReveal === 'function') stageClearReveal();
  }

  /* ------------------------------------------------------------------ *
   *  6. 键盘与按钮
   * ------------------------------------------------------------------ */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (p && p.catch) p.catch(() => { });
    } else if (document.exitFullscreen) document.exitFullscreen().catch(() => { });
  }

  window.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.code === 'Escape') e.target.blur();
      return;
    }
    const modalOpen = $$('.tc-modal-backdrop.active').length > 0;
    if (e.code === 'Space' || e.code === 'Enter') {
      if (modalOpen) return;
      e.preventDefault();
      toggleRoll();
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault(); toggleFullscreen();
    } else if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      confirmBox('确认重置本轮抽取记录吗？（学生名单不会被修改）', () => {
        resetPool(false);
        clearReveal();
        FX.clear();
        Music.sfxClick();
        toast('已重置本轮记录 🔄');
      }, '重置');
    } else if (e.key >= '1' && e.key <= '6') {
      const sel = document.getElementById('sel-count');
      if (sel && !modalOpen) { sel.value = e.key; toast('每次抽取 ' + e.key + ' 人'); Music.sfxClick(); }
    } else if (e.key === 'm' || e.key === 'M') {
      const btn = document.getElementById('btn-sound');
      if (btn) btn.click();
    } else if (e.key === 'h' || e.key === 'H') {
      const btn = document.getElementById('btn-manage');
      if (btn) btn.click();
    } else if (e.code === 'Escape') {
      $$('.tc-modal-backdrop.active').forEach(m => m.classList.remove('active'));
      clearReveal();
    }
  });

  const btnFs = document.getElementById('btn-fullscreen');
  if (btnFs) btnFs.addEventListener('click', toggleFullscreen);

  const btnBgm = document.getElementById('btn-bgm');
  if (btnBgm) btnBgm.addEventListener('click', () => {
    const on = Music.toggleBGM();
    btnBgm.textContent = on ? '🎵 氛围音: 开' : '🎵 氛围音: 关';
    btnBgm.classList.toggle('off', !on);
  });
  const btnSound = document.getElementById('btn-sound');
  if (btnSound) btnSound.addEventListener('click', () => {
    const m = Music.toggleMute();
    btnSound.textContent = m ? '🔇 音效: 关' : '🔊 音效: 开';
    btnSound.classList.toggle('off', m);
    if (btnBgm) {
      btnBgm.textContent = (!m && Music.isPlaying()) ? '🎵 氛围音: 开' : '🎵 氛围音: 关';
      btnBgm.classList.toggle('off', m || !Music.isPlaying());
    }
  });

  const selCount = document.getElementById('sel-count');
  if (selCount) selCount.addEventListener('change', () => { Music.sfxClick(); toast('每次抽取 ' + selCount.value + ' 人'); });

  /* ------------------------------------------------------------------ *
   *  7. 名单管理弹窗：导入 / 导出 / 手动编辑 / 打包进 HTML
   * ------------------------------------------------------------------ */
  const modal = document.getElementById('modal-manage');
  const txtInput = document.getElementById('txt-input');

  function openModal() {
    if (txtInput) txtInput.value = formatText(studentList);
    if (modal) modal.classList.add('active');
    Music.sfxClick();
  }
  const btnManage = document.getElementById('btn-manage');
  if (btnManage) btnManage.addEventListener('click', openModal);
  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', () => modal.classList.remove('active'));
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });

  const btnSave = document.getElementById('btn-save-list');
  if (btnSave) btnSave.addEventListener('click', () => {
    const text = (txtInput.value || '').trim();
    if (!text) { toast('名单内容不能为空！'); return; }
    const list = parseText(text);
    if (!list.length) { toast('没有解析到有效名单，请检查格式'); return; }
    saveStudents(text);
    studentList = list;
    resetPool(true);
    clearReveal();
    if (typeof onResetHook === 'function') onResetHook();
    modal.classList.remove('active');
    toast('已保存 ' + list.length + ' 位同学，全部模板同步生效 ✅');
    Music.sfxClick();
  });

  const btnRestore = document.getElementById('btn-restore-default');
  if (btnRestore) btnRestore.addEventListener('click', () => {
    confirmBox('确认恢复为本页面内置的默认名单吗？', () => {
      localStorage.removeItem(PKEY);
      localStorage.removeItem(PKEY_V1);
      studentList = parseText(DEFAULT_RAW);
      saveStudents(DEFAULT_RAW);
      if (txtInput) txtInput.value = DEFAULT_RAW;
      resetPool(true);
      clearReveal();
      if (typeof onResetHook === 'function') onResetHook();
      modal.classList.remove('active');
      toast('已恢复默认名单（' + studentList.length + ' 人）');
    }, '恢复默认');
  });

  const fileInput = document.getElementById('file-input');
  const btnImport = document.getElementById('btn-import-txt');
  if (btnImport) btnImport.addEventListener('click', () => fileInput && fileInput.click());
  if (fileInput) fileInput.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const raw = String(evt.target.result || '').replace(/^\uFEFF/, '');
      const list = parseText(raw);
      if (!list.length) { toast('文件里没读到有效名单，请检查格式'); return; }
      saveStudents(raw);
      studentList = list;
      resetPool(true);
      clearReveal();
      if (typeof onResetHook === 'function') onResetHook();
      if (txtInput) txtInput.value = formatText(list);
      toast('已导入【' + f.name + '】共 ' + list.length + ' 人，已同步生效 ✅');
      Music.sfxClick();
    };
    reader.readAsText(f, 'utf-8');
    fileInput.value = '';
  });

  const btnExport = document.getElementById('btn-export-txt');
  if (btnExport) btnExport.addEventListener('click', () => {
    download('班级名单.txt', (txtInput && txtInput.value) ? txtInput.value : formatText(studentList));
    toast('名单已导出为 班级名单.txt 💾');
  });

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: (mime || 'text/plain') + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }

  /* 把当前名单直接打包进一份新的 HTML（导入/修改的内容直接填充到 html） */
  const btnExportHtml = document.getElementById('btn-export-html');
  if (btnExportHtml) btnExportHtml.addEventListener('click', () => {
    const raw = (txtInput && txtInput.value.trim()) ? txtInput.value.trim() : formatText(studentList);
    exportHtmlWith(raw);
  });

  function exportHtmlWith(raw) {
    download('点名系统-名单已内嵌.html', buildExportHtml(raw), 'text/html');
    toast('已导出一份「名单已内嵌」的 HTML，可直接分发给学生机 ✅', 3200);
  }

  /* 返回一份「名单已写死在源码里」的完整 HTML 字符串 */
  function buildExportHtml(raw) {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('[data-dyn]').forEach(el => { el.innerHTML = ''; });
    clone.querySelectorAll('[data-fitsize]').forEach(el => {
      el.style.gridTemplateColumns = ''; el.style.gridAutoRows = ''; el.style.gap = '';
    });
    clone.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
    clone.querySelectorAll('.screen-shake,.hopping,.flipped,.rolling,.on,.picked,.lit,.open,.cracked')
      .forEach(el => el.classList.remove('screen-shake', 'hopping', 'flipped', 'rolling', 'on', 'picked', 'lit', 'open', 'cracked'));
    clone.querySelectorAll('textarea').forEach(t => { t.textContent = ''; });
    clone.querySelectorAll('select').forEach(s => {
      const d = s.querySelector('option[selected]');
      s.value = d ? d.value : (s.options[0] && s.options[0].value) || '';
      Array.from(s.options).forEach(o => o.removeAttribute('selected'));
      if (d) d.setAttribute('selected', 'selected');
    });
    clone.querySelectorAll('input[type=checkbox]').forEach(i => {
      i.checked = i.hasAttribute('checked');
      i.removeAttribute('data-checked');
      if (i.checked) i.setAttribute('checked', 'checked'); else i.removeAttribute('checked');
    });
    const bt = clone.querySelector('#btn-text'); if (bt) bt.textContent = ORIG_TEXT;
    const bi = clone.querySelector('#btn-icon'); if (bi) bi.textContent = ORIG_ICON;
    const bs = clone.querySelector('#btn-start'); if (bs) bs.classList.remove('stop');
    const b1 = clone.querySelector('#btn-bgm'); if (b1) { b1.textContent = '🎵 氛围音: 开'; b1.classList.remove('off'); }
    const b2 = clone.querySelector('#btn-sound'); if (b2) { b2.textContent = '🔊 音效: 开'; b2.classList.remove('off'); }

    let html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const marker = /(const DEFAULT_STUDENTS_RAW = ")([^"]*)(";)/;
    if (marker.test(html)) {
      html = html.replace(marker, (m, p1, p2, p3) => p1 + raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + p3);
    }
    return html;
  }

  /* ------------------------------------------------------------------ *
   *  8. 跨标签页同步 + 尝试读取同目录 班级名单.txt
   * ------------------------------------------------------------------ */
  window.addEventListener('storage', e => {
    if (e.key === PKEY && e.newValue && e.newValue.trim()) {
      studentList = parseText(e.newValue);
      resetPool(true);
      clearReveal();
      if (typeof onResetHook === 'function') onResetHook();
      toast('名单已从其它页面同步更新 ✅');
    }
  });

  window.addEventListener('focus', () => {
    const saved = readSaved();
    if (saved && formatText(studentList) !== formatText(parseText(saved))) {
      studentList = parseText(saved);
      resetPool(true);
      clearReveal();
      if (typeof onResetHook === 'function') onResetHook();
    }
  });

  function tryLocalTxt() {
    if (readSaved()) return;                       // 已有用户数据，不覆盖
    if (!location.protocol.startsWith('http')) return; // file:// 下浏览器禁止读取，静默跳过
    fetch('班级名单.txt', { cache: 'no-store' })
      .then(r => r.ok ? r.text() : null)
      .then(t => {
        if (!t) return;
        const list = parseText(t);
        if (!list.length) return;
        studentList = list;
        saveStudents(t);
        resetPool(true);
        if (typeof onResetHook === 'function') onResetHook();
      })
      .catch(() => { });
  }

  /* ------------------------------------------------------------------ *
   *  9. 启动
   * ------------------------------------------------------------------ */
  let booted = false;
  function boot() {
    if (booted) return;
    booted = true;
    loadStudents();
    Music.initAutoPlay();
    if (typeof stageInit === 'function') stageInit();
    setTimeout(tryLocalTxt, 300);

    /* 舞台尺寸变化时重排主题网格 */
    let rt = null;
    const relayout = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (typeof stageLayout === 'function') stageLayout();
        const box = document.querySelector('.fit-grid');
        if (box && box._relayout) box._relayout();
      }, 120);
    };
    window.addEventListener('resize', relayout);
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(relayout);
      const stage = document.querySelector('.tc-stage');
      if (stage) ro.observe(stage);
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
  if (document.readyState !== 'loading') boot();

  /* ------------------------------------------------------------------ *
   *  10. 对外暴露给模板脚本
   * ------------------------------------------------------------------ */
  window.TC = {
    $, $$, rand, randInt, pick, clamp, toast, confirmBox, autoFitGrid,
    Music, SoundFX: Music, FX,
    get students() { return studentList; },
    get remain() { return remainPool; },
    get history() { return historyList; },
    get rolling() { return rolling; },
    pickWinners, resetPool, pushHistory, clearReveal, defaultReveal,
    setBtn, toggleRoll, download, parseText, formatText,
    buildExportHtml, exportHtmlWith,
    isNoRepeat: noRepeat, getCount
  };
})();


/* ===== 主题舞台脚本：聚光灯黑板剧场 ===== */
/* ── 聚光灯黑板剧场 · 舞台脚本 ─────────────────────────────────────── */

var spRoot = TC.$('#sp-root');
var spChalk = TC.$('#sp-chalk');
var spHead = TC.$('#sp-head');
var beamL = TC.$('#sp-beam-l');
var beamR = TC.$('#sp-beam-r');

var spCells = [];
var spRollTimer = null;
var spFocus = false;
var spT = 0;
var spRaf = null;
var spMaxLen = 3;

/* ---------- 背景：粉笔灰光尘 ---------- */
var spDust = TC.$('#sp-dust'), dctx = spDust ? spDust.getContext('2d') : null;
var spMotes = [];

function spResize() {
  if (!spDust || !dctx) return;
  var w = spDust.parentElement.clientWidth, h = spDust.parentElement.clientHeight;
  if (w <= 0 || h <= 0) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  spDust.width = Math.floor(w * dpr);
  spDust.height = Math.floor(h * dpr);
  dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  var n = Math.round(w * h / 24000);
  spMotes = [];
  for (var i = 0; i < n; i++) {
    spMotes.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.5 + Math.random() * 1.7,
      vx: (Math.random() - 0.5) * 0.20,
      vy: -0.04 - Math.random() * 0.24,
      ph: Math.random() * 6.28,
      sp: 0.006 + Math.random() * 0.022
    });
  }
}

function spDustLoop() {
  if (!spDust || !dctx) return;
  var w = spDust.clientWidth, h = spDust.clientHeight;
  if (w <= 0 || h <= 0) return;
  dctx.clearRect(0, 0, w, h);
  var hot = spRoot && spRoot.classList.contains('rolling');
  var boost = hot ? 1.9 : 1;
  for (var i = 0; i < spMotes.length; i++) {
    var m = spMotes[i];
    m.ph += m.sp;
    m.x += m.vx + Math.sin(m.ph) * 0.16;
    m.y += m.vy;
    if (m.y < -12) { m.y = h + 10; m.x = Math.random() * w; }
    if (m.x < -12) m.x = w + 10;
    if (m.x > w + 12) m.x = -10;
    var a = (0.10 + Math.abs(Math.sin(m.ph)) * 0.34) * boost;
    if (a > 0.92) a = 0.92;
    dctx.fillStyle = 'rgba(253,246,220,' + a.toFixed(2) + ')';
    dctx.beginPath();
    dctx.arc(m.x, m.y, m.r * (hot ? 1.25 : 1), 0, 6.284);
    dctx.fill();
  }
}

/* ---------- 追光灯光锥 ---------- */
function spBeamLoop() {
  if (!beamL || !beamR || !spRoot) return;
  var w = spRoot.clientWidth || 1;
  if (spRoot.classList.contains('rolling')) {
    var k = spT * 0.058;
    var amp = w * 0.165;
    var d = Math.sin(k) * amp;
    var rot = Math.cos(k) * 5.5;
    beamL.style.transform = 'translateX(' + d.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';
    beamR.style.transform = 'translateX(' + (-d).toFixed(1) + 'px) rotate(' + (-rot).toFixed(2) + 'deg)';
  } else if (!spFocus) {
    var d2 = Math.sin(spT * 0.0075) * w * 0.028;
    beamL.style.transform = 'translateX(' + d2.toFixed(1) + 'px)';
    beamR.style.transform = 'translateX(' + (-d2).toFixed(1) + 'px)';
  }
}

function spConverge() {
  if (!beamL || !beamR || !spRoot) return;
  var w = spRoot.clientWidth || 1;
  spFocus = true;
  var dx = w * 0.28;
  beamL.style.transform = 'translateX(' + dx.toFixed(1) + 'px) scaleX(.52)';
  beamR.style.transform = 'translateX(' + (-dx).toFixed(1) + 'px) scaleX(.52)';
}

function spReleaseBeams() {
  spFocus = false;
  if (beamL) beamL.style.transform = '';
  if (beamR) beamR.style.transform = '';
}

function spLoop() {
  spT++;
  spDustLoop();
  spBeamLoop();
  spRaf = requestAnimationFrame(spLoop);
}

/* ---------- 黑板粉笔字网格 ---------- */
function spMeasureMaxLen() {
  var list = TC.students, max = 1;
  for (var i = 0; i < list.length; i++) {
    var L = (list[i].name || '').length;
    if (L > max) max = L;
  }
  spMaxLen = Math.max(2, Math.min(6, max));
}

function spBuildChalk(n) {
  if (!spChalk) return;
  spChalk.innerHTML = '';
  spCells = [];
  for (var i = 0; i < n; i++) {
    var el = document.createElement('div');
    el.className = 'sp-cw';
    el.innerHTML = '<span class="ck"></span><span class="cb"></span><span class="cid id-tag"></span>';
    spChalk.appendChild(el);
    spCells.push(el);
  }
  spLayoutChalk();
}

/* 先交给 autoFitGrid 算尺寸，再把列数收敛成能整除的均衡排布（行数只减不增，绝不会溢出） */
function spFit(n) {
  var r = TC.autoFitGrid(spChalk, n, {
    gap: Math.max(6, Math.min(16, spChalk.clientWidth / 120)),
    ratio: 0.40, minW: 84, maxW: 900, maxH: 250, pad: 4
  });
  if (!r || !n) return r;
  var rows = Math.ceil(n / r.cols);
  var lo = Math.ceil(n / rows);
  var best = r.cols;
  for (var c = r.cols; c >= lo; c--) {
    if (n % c === 0) { best = c; break; }
  }
  if (best !== r.cols) {
    spChalk.style.gridTemplateColumns = 'repeat(' + best + ', ' + r.cw.toFixed(2) + 'px)';
    spChalk.dataset.cols = best;
    r = { cols: best, cw: r.cw, ch: r.ch };
  }
  return r;
}

function spLayoutChalk() {
  if (!spChalk || !spCells.length) return;
  var r = spFit(spCells.length);
  if (r) spApplyFonts(r);
  return r;
}

/* 按格子尺寸与字数自适应字号：绝不写死 px，超出就缩到放得下 */
function spFitCell(cell, maxFs) {
  var t = cell.querySelector('.ck');
  if (!t) return;
  var bw = (cell.clientWidth || 1) - 2;
  var fs = Math.max(11, maxFs);
  t.style.fontSize = fs + 'px';
  var guard = 0;
  while (guard++ < 14 && t.getBoundingClientRect().width > bw && fs > 11) {
    fs = Math.max(11, fs - Math.max(1, Math.round(fs * 0.07)));
    t.style.fontSize = fs + 'px';
  }
}

function spApplyFonts(r) {
  for (var i = 0; i < spCells.length; i++) {
    var cell = spCells[i];
    var len = spMaxLen;
    var t = cell.querySelector('.ck');
    if (t && t.textContent) len = Math.max(1, Math.min(8, t.textContent.length));
    /* 字号同时受行高、格宽与字数约束，保证永远不出格 */
    var byH = r.ch * 0.60;
    var byW = r.cw * 1.72 / len;
    spFitCell(cell, Math.min(byH, byW));
    var cid = cell.querySelector('.cid');
    if (cid) cid.style.fontSize = Math.max(8, Math.round(Math.min(r.ch * 0.17, r.cw * 0.09))) + 'px';
  }
}

function spSetCellName(cell, s) {
  cell.querySelector('.ck').textContent = s.name;
  cell.querySelector('.cid').textContent = 'No.' + s.id;
}

/* ---------- 生命周期钩子 ---------- */
function stageInit() {
  spResize();
  spMeasureMaxLen();
  spBuildChalk(1);
  if (!spRaf) spLoop();
  window.addEventListener('resize', spResize);
}

function stageLayout() {
  spResize();
  spLayoutChalk();
}

function stageStartRoll() {
  if (!spRoot) return;
  spReleaseBeams();
  spRoot.classList.add('rolling');
  if (spHead) spHead.textContent = '正 在 抽 取';
  spMeasureMaxLen();
  spBuildChalk(TC.getCount());
  var list = TC.students;
  if (!list.length) return;
  var t0 = Date.now();
  var tick = 0;
  spRollTimer = setInterval(function () {
    tick++;
    var pr = Math.min(1, (Date.now() - t0) / 2800);
    /* ★ 摇人定时器里必须每次调用，节奏会随进度加急 */
    TC.Music.sfxRoll(pr);
    for (var i = 0; i < spCells.length; i++) {
      var c = spCells[i];
      c.classList.remove('won');
      c.classList.add('rolling');
      var s = list[Math.floor(Math.random() * list.length)];
      spSetCellName(c, s);
    }
    if (tick % 3 === 0) spLayoutChalk();
  }, 62);
}

function stageStopRoll(winners) {
  if (spRollTimer) { clearInterval(spRollTimer); spRollTimer = null; }
  if (spRoot) spRoot.classList.remove('rolling');
  if (spHead) spHead.textContent = '今 日 登 台';
  /* 两束追光缓缓交汇，聚焦黑板正中 */
  spConverge();
  if (beamL) beamL.classList.add('hot');
  if (beamR) beamR.classList.add('hot');
  setTimeout(function () {
    if (beamL) beamL.classList.remove('hot');
    if (beamR) beamR.classList.remove('hot');
  }, 1600);
  if (spChalk) {
    var r = spChalk.getBoundingClientRect();
    TC.FX.sparks(r.left + r.width / 2, r.top + r.height / 2, 26, '#e2e8f0');
  }
}

function revealWinners(winners) {
  if (!spChalk || !winners || !winners.length) return;
  /* 先按中选者人数重排粉笔字，再写入名字精确适配字号 */
  spBuildChalk(winners.length);
  for (var i = 0; i < spCells.length; i++) {
    spCells[i].classList.remove('rolling');
    spSetCellName(spCells[i], winners[i]);
  }
  spLayoutChalk();
  /* 一笔一划浮现 + 周围撒粉笔灰 */
  for (var k = 0; k < spCells.length; k++) {
    (function (cell, idx) {
      setTimeout(function () {
        cell.classList.add('won');
        var b = cell.getBoundingClientRect();
        var cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        TC.FX.sparks(cx, cy, 30, '#e2e8f0');
        TC.FX.sparks(cx, cy, 14, '#fde68a');
        var c = TC.Music.init();
        if (c) {
          /* 粉笔沙沙：短促高频噪声感颗粒 */
          TC.Music.tone(TC.Music.midi(86 + idx), c.currentTime, 0.10, 0.030, 'triangle');
          TC.Music.whoosh(c.currentTime, 0.22, 0.45);
        }
      }, idx * 190);
    })(spCells[k], k);
  }
}

function stageClearReveal() {
  if (spChalk) spChalk.innerHTML = '';
  spCells = [];
  if (spHead) spHead.textContent = '今 日 登 台';
  if (spRoot) spRoot.classList.remove('rolling');
  spReleaseBeams();
  spBuildChalk(1);
}

function onResetHook() {
  if (spRollTimer) { clearInterval(spRollTimer); spRollTimer = null; }
  if (spRoot) spRoot.classList.remove('rolling');
  spReleaseBeams();
  if (spHead) spHead.textContent = '今 日 登 台';
  if (spChalk) spChalk.innerHTML = '';
  spCells = [];
  spMeasureMaxLen();
  spBuildChalk(1);
}

function themedPillStyle(el) {
  el.style.background = 'rgba(20,184,166,.16)';
  el.style.border = '1px solid rgba(245,158,11,.55)';
  el.style.color = '#a7f3d0';
}

