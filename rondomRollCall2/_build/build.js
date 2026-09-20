/* ==========================================================================
   课堂随机点名 v2 · 构建脚本
   用法： node _build/build.js
   产物：
     01-xxx/index.html + 操作手册.txt + 班级名单.txt  （15 套）
     index.html + 操作手册.txt + 班级名单.txt          （合集入口）
   ========================================================================== */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const B = __dirname;

const coreCss = fs.readFileSync(path.join(B, 'css', 'core.css'), 'utf8');
const coreJs = fs.readFileSync(path.join(B, 'js', 'core.js'), 'utf8');
const defaultRoster = fs.readFileSync(path.join(B, 'default-roster.txt'), 'utf8').replace(/\r\n/g, '\n').trim();

const THEMES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'
].map(id => {
  const mf = path.join(B, 'themes', id + '.js');
  const sf = path.join(B, 'themes', id + '.stage.js');
  if (!fs.existsSync(mf) || !fs.existsSync(sf)) {
    console.warn('  ! 跳过尚未完成的主题 ' + id);
    return null;
  }
  const meta = require(mf);
  meta.id = id;
  meta.stage = fs.readFileSync(sf, 'utf8');
  return meta;
}).filter(Boolean);

/* -------------------------------------------------------------------------- */
/*  工具                                                                       */
/* -------------------------------------------------------------------------- */
const jsStr = s => JSON.stringify(s);                    // 安全转义为 JS 双引号字符串
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function assertSafe(name, code) {
  if (/<\/script/i.test(code)) throw new Error('[' + name + '] 代码里含有 </script，会截断页面');
  if (/<script/i.test(code)) throw new Error('[' + name + '] 代码里含有 <script，请移除');
}

/* -------------------------------------------------------------------------- */
/*  单页 HTML 模板                                                             */
/* -------------------------------------------------------------------------- */
function buildPage(t) {
  assertSafe(t.id + '.stage', t.stage);
  assertSafe(t.id + '.body', t.body);
  assertSafe(t.id + '.css', t.css);

  const music = JSON.stringify(t.music || {}, null, 0);
  const sfx = JSON.stringify(t.sfx || { win: 'fanfare' });
  const title = t.title + ' - 课堂随机点名';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover">
<meta name="theme-color" content="${t.color || '#0b1120'}">
<title>${esc(title)}</title>
<style>
${coreCss}
/* ===== 主题样式：${esc(t.title)} ===== */
${t.css}
</style>
</head>
<body>

<canvas id="fx-canvas"></canvas>
<canvas id="flash-canvas"></canvas>

<header class="tc-header">
  <div class="brand">
    <span class="brand-icon">${t.icon}</span>
    <span class="brand-title">${esc(t.title)}</span>
    <span class="brand-badge">${esc(t.badge)}</span>
  </div>
  <div class="header-actions">
    <button class="btn-icon" id="btn-bgm" title="背景氛围音乐开关">🎵 氛围音: 开</button>
    <button class="btn-icon" id="btn-sound" title="全部音效开关">🔊 音效: 开</button>
    <button class="btn-icon" id="btn-manage" title="修改 / 导入 / 导出名单（快捷键 H）">📝 名单管理</button>
    <button class="btn-icon" id="btn-fullscreen" title="全屏（快捷键 F）">⛶ 全屏</button>
  </div>
</header>

<div class="tc-status">
  <div>全班 <span class="stat-val" id="stat-total">0</span> 人</div>
  <div>待抽 <span class="stat-val" id="stat-remain">0</span> 人</div>
  <div>已抽 <span class="stat-val" id="stat-called">0</span> 人</div>
  <label title="开启后本轮内不会重复点到同一位同学">
    <input type="checkbox" id="chk-norepeat" checked>
    <span>不重复抽取</span>
  </label>
  <div>
    <span>每次抽取</span>
    <select id="sel-count" class="sel-count" title="可选择一次抽出 1~6 人（快捷键 1~6）">
      <option value="1" selected>1 人</option>
      <option value="2">2 人</option>
      <option value="3">3 人</option>
      <option value="4">4 人</option>
      <option value="5">5 人</option>
      <option value="6">6 人</option>
    </select>
  </div>
</div>

<main class="tc-main">
  <div class="tc-stage">
${t.body}
  </div>

  <div class="control-panel">
    <button class="btn-main-action" id="btn-start">
      <span id="btn-icon">▶</span>
      <span id="btn-text">开始点名</span>
    </button>
    <div class="hint-keys">
      <span><span class="kbd">空格</span> 开始/停止</span>
      <span><span class="kbd">1~6</span> 抽取人数</span>
      <span><span class="kbd">R</span> 重置本轮</span>
      <span><span class="kbd">F</span> 全屏</span>
      <span><span class="kbd">H</span> 名单管理</span>
      <span><span class="kbd">M</span> 静音</span>
    </div>
  </div>
</main>

<div class="tc-history">
  <div class="history-title-box"><span>${t.icon}</span><span>${esc(t.historyTitle || '本轮已点名单')}</span></div>
  <div class="history-track" id="themed-history-list" data-dyn></div>
</div>

<div class="tc-modal-backdrop" id="modal-manage">
  <div class="tc-modal">
    <div class="tc-modal-head">
      <h3 class="tc-modal-title">📝 班级学生名单设置</h3>
      <button class="tc-modal-close" id="modal-close" title="关闭">&times;</button>
    </div>
    <p class="tc-modal-tip">
      <b>格式</b>：<code>学号 姓名</code>，每行一位同学，例如 <code>202401 张三</code>。<br>
      学号与姓名之间用<b>空格</b>、<b>逗号</b>或 <b>Tab</b> 分隔都可以；以 <code>#</code> 开头的行会被忽略。<br>
      保存后本机全部 15 套模板会<b>自动同步生效</b>；也可以导出后改用记事本编辑，再点「导入 txt」。
    </p>
    <textarea id="txt-input" spellcheck="false" placeholder="202401 张三&#10;202402 李四&#10;202403 王五"></textarea>
    <div class="tc-modal-foot">
      <div>
        <input type="file" id="file-input" accept=".txt,text/plain" style="display:none">
        <button class="btn-sub" id="btn-import-txt">📂 导入 txt</button>
        <button class="btn-sub" id="btn-export-txt">💾 导出 txt</button>
        <button class="btn-sub" id="btn-export-html" title="导出后名单直接内嵌在网页里，换电脑打开也不会丢">📦 导出 HTML(名单已内嵌)</button>
      </div>
      <div>
        <button class="btn-sub" id="btn-restore-default">恢复默认</button>
        <button class="btn-primary" id="btn-save-list">保存并应用</button>
      </div>
    </div>
  </div>
</div>

<script>
/* ===== 内置默认名单（页面上的修改会通过「导出 HTML」直接填充到这里） ===== */
const DEFAULT_STUDENTS_RAW = ${jsStr(defaultRoster)};

window.THEME_ICON = ${jsStr(t.icon)};
window.THEME_SFX  = ${sfx};
window.THEME_MUSIC = ${music};

${coreJs}

/* ===== 主题舞台脚本：${esc(t.title)} ===== */
${t.stage}
</script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/*  合集入口页                                                                 */
/* -------------------------------------------------------------------------- */
function buildIndex() {
  const cards = THEMES.map(t => `
      <a class="tool-card" href="./${encodeURI(t.dir)}/index.html" style="--accent:${t.accent};--accent2:${t.accent2 || t.accent}">
        <div class="card-top">
          <div class="card-icon">${t.icon}</div>
          <div class="card-meta">
            <h3>${esc(t.title)}</h3>
            <span>${esc(t.badge)}</span>
          </div>
        </div>
        <p class="card-desc">${esc(t.desc)}</p>
        <div class="card-tags">${(t.tags || []).map(x => '<em>' + esc(x) + '</em>').join('')}</div>
        <span class="btn-open">进入点名 →</span>
      </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>课堂随机点名 · 15 款趣味主题合集</title>
<style>
:root{
  --bg1:#141b34; --bg2:#070b14;
  --text:#f8fafc; --dim:#94a3b8;
  --border:rgba(255,255,255,.13);
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  min-height:100vh;
  background:radial-gradient(1100px 620px at 50% -8%,#1e1b4b 0%,#0d1224 55%,#05080f 100%) fixed;
  color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif;
  padding:clamp(16px,3.2vh,40px) clamp(14px,3vw,40px) 40px;
}
.wrap{max-width:1320px;margin:0 auto}
header{text-align:center;margin-bottom:clamp(16px,3vh,34px)}
h1{
  font-size:clamp(24px,4.2vh,42px);font-weight:900;letter-spacing:1px;
  background:linear-gradient(135deg,#fff,#c7d2fe 55%,#7dd3fc);
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;
  margin-bottom:8px;
}
.sub{font-size:clamp(12px,1.7vh,15px);color:var(--dim);line-height:1.7;max-width:860px;margin:0 auto 16px}
.bar{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.btn{
  border:none;border-radius:12px;padding:clamp(9px,1.5vh,14px) clamp(18px,2.6vw,32px);
  font-size:clamp(13px,1.8vh,16px);font-weight:800;cursor:pointer;font-family:inherit;
  background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;
  box-shadow:0 8px 24px rgba(79,70,229,.4);transition:.2s cubic-bezier(.34,1.56,.64,1);
}
.btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
.btn.ghost{background:rgba(255,255,255,.08);border:1px solid var(--border);box-shadow:none}
.chips{display:flex;justify-content:center;flex-wrap:wrap;gap:8px;margin-bottom:clamp(18px,3vh,32px)}
.chips span{
  font-size:clamp(11px,1.5vh,13px);color:#cbd5e1;background:rgba(255,255,255,.06);
  border:1px solid var(--border);padding:5px 13px;border-radius:16px;font-weight:700;
}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(250px,24vw,330px),1fr));gap:clamp(12px,1.6vw,20px)}
.tool-card{
  display:flex;flex-direction:column;gap:10px;text-decoration:none;color:inherit;
  background:rgba(255,255,255,.045);border:1.5px solid var(--border);border-radius:18px;
  padding:clamp(14px,2vh,22px);transition:.24s cubic-bezier(.34,1.56,.64,1);position:relative;overflow:hidden;
}
.tool-card::before{
  content:'';position:absolute;inset:0;opacity:0;transition:.24s;
  background:radial-gradient(420px 180px at 22% 0%,color-mix(in srgb,var(--accent) 28%,transparent),transparent 70%);
}
.tool-card:hover{transform:translateY(-5px);border-color:var(--accent);box-shadow:0 16px 40px rgba(0,0,0,.55)}
.tool-card:hover::before{opacity:1}
.card-top{display:flex;align-items:center;gap:12px;position:relative}
.card-icon{
  width:clamp(42px,5.4vh,54px);height:clamp(42px,5.4vh,54px);border-radius:13px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;font-size:clamp(22px,3vh,30px);
  background:color-mix(in srgb,var(--accent) 20%,transparent);border:1px solid var(--accent);
}
.card-meta h3{font-size:clamp(15px,2vh,18px);font-weight:800;margin-bottom:3px}
.card-meta span{font-size:11px;font-weight:700;color:var(--accent);border:1px solid var(--accent);padding:1px 7px;border-radius:9px}
.card-desc{font-size:clamp(12px,1.6vh,13.5px);color:var(--dim);line-height:1.6;position:relative;flex:1}
.card-tags{display:flex;flex-wrap:wrap;gap:5px;position:relative}
.card-tags em{font-style:normal;font-size:10.5px;color:#cbd5e1;background:rgba(255,255,255,.07);padding:2px 8px;border-radius:8px}
.btn-open{
  text-align:center;font-weight:800;font-size:clamp(12px,1.7vh,14px);letter-spacing:1px;
  padding:clamp(8px,1.2vh,12px);border-radius:11px;position:relative;
  background:rgba(255,255,255,.07);border:1.5px solid var(--border);transition:.2s;
}
.tool-card:hover .btn-open{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 18px color-mix(in srgb,var(--accent) 45%,transparent)}
footer{margin-top:44px;text-align:center;font-size:clamp(12px,1.6vh,13.5px);color:var(--dim);line-height:2}
kbd{background:rgba(255,255,255,.14);padding:2px 7px;border-radius:5px;font-family:ui-monospace,Consolas,monospace;color:#f1f5f9;font-weight:700}
.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.82);backdrop-filter:blur(10px);z-index:99;display:none;align-items:center;justify-content:center;padding:20px}
.modal-backdrop.active{display:flex}
.modal{background:#0f172a;border:1.5px solid var(--border);border-radius:18px;width:100%;max-width:660px;max-height:92vh;padding:clamp(14px,2.4vh,24px);display:flex;flex-direction:column;gap:12px}
.modal h3{font-size:clamp(15px,2vh,18px);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);padding-bottom:9px}
.modal h3 button{background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;line-height:1}
.modal p{font-size:clamp(11.5px,1.5vh,13px);color:var(--dim);line-height:1.6}
.modal code{background:rgba(255,255,255,.1);padding:1px 5px;border-radius:4px;color:#a5b4fc}
.modal textarea{
  width:100%;min-height:150px;flex:1;background:rgba(0,0,0,.45);border:1px solid var(--border);
  border-radius:10px;color:#fff;padding:10px 12px;font-size:13px;line-height:1.55;
  font-family:ui-monospace,Consolas,monospace;outline:none;resize:none;
}
.modal textarea:focus{border-color:#6366f1}
.mfoot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;border-top:1px solid var(--border);padding-top:10px}
.mfoot>div{display:flex;gap:8px;flex-wrap:wrap}
.btn-sub{background:rgba(255,255,255,.09);border:1px solid var(--border);color:#fff;padding:6px 13px;border-radius:8px;cursor:pointer;font-size:12.5px;font-family:inherit}
.btn-sub:hover{background:rgba(255,255,255,.2)}
.btn-primary{background:linear-gradient(135deg,#6366f1,#7c3aed);border:none;color:#fff;font-weight:800;padding:6px 20px;border-radius:8px;cursor:pointer;font-size:12.5px;font-family:inherit}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>课堂随机点名 · 15 款趣味主题</h1>
    <p class="sub">
      15 套风格迥异的点名玩法，每一套都可独立使用；在这里改一次名单，<b>全部 15 套自动同步生效</b>。<br>
      每套内置独立氛围 BGM，点名前的倒数、摇人时的脉冲、抽中时的号角庆典层次分明。
    </p>
    <div class="bar">
      <button class="btn" id="btn-manage">📝 班级名单管理（改一次，15 套全生效）</button>
      <button class="btn ghost" id="btn-txt">💾 导出一份名单 txt 备用</button>
    </div>
    <div class="chips">
      <span>✨ 15 款独立视觉主题</span>
      <span>🎲 一次可选 1~6 人</span>
      <span>🎵 每套独立氛围 BGM</span>
      <span>📂 TXT 名单导入 / 导出</span>
      <span>💻 14 寸笔记本到大屏全覆盖</span>
      <span>🚀 双击即用，免安装</span>
    </div>
  </header>

  <div class="grid">
${cards}
  </div>

  <footer>
    <p>💡 先点上方【📝 班级名单管理】把名单粘贴进去保存，再挑一套喜欢的主题进去点名即可。</p>
    <p>通用快捷键：<kbd>空格</kbd> 开始/停止 · <kbd>1~6</kbd> 抽取人数 · <kbd>R</kbd> 重置本轮 · <kbd>F</kbd> 全屏 · <kbd>H</kbd> 名单管理 · <kbd>M</kbd> 静音</p>
  </footer>
</div>

<div class="modal-backdrop" id="modal-manage">
  <div class="modal">
    <h3>📝 班级名单管理 <button id="modal-close">&times;</button></h3>
    <p>
      格式：<code>学号 姓名</code>，每行一位同学，例如 <code>202401 张三</code>（空格 / 逗号 / Tab 分隔均可）。<br>
      保存后本机全部 15 套模板自动同步生效。
    </p>
    <textarea id="txt-input" spellcheck="false"></textarea>
    <div class="mfoot">
      <div>
        <input type="file" id="file-input" accept=".txt,text/plain" style="display:none">
        <button class="btn-sub" id="btn-import-txt">📂 导入 txt</button>
        <button class="btn-sub" id="btn-export-txt">💾 导出 txt</button>
      </div>
      <div>
        <button class="btn-sub" id="btn-restore-default">恢复默认</button>
        <button class="btn-primary" id="btn-save-list">保存并应用</button>
      </div>
    </div>
  </div>
</div>

<script>
const DEFAULT_STUDENTS_RAW = ${jsStr(defaultRoster)};
const PKEY = 'CLASSROOM_ROLLCALL_V2_STUDENTS';
const PKEY_V1 = 'CLASSROOM_ROLLCALL_STUDENTS_GLOBAL';

const modal = document.getElementById('modal-manage');
const txtInput = document.getElementById('txt-input');
const fileInput = document.getElementById('file-input');

function parseText(t){
  if(!t || !t.trim()) return [];
  return t.split(/\\r?\\n/).map(function(line, idx){
    var tr = line.trim();
    if(!tr || tr.charAt(0) === '#') return null;
    var pts = tr.split(/[\\s,，、\\t;；]+/).filter(Boolean);
    if(pts.length >= 2) return { id: pts[0], name: pts.slice(1).join(' ') };
    return { id: String(idx+1).padStart(2,'0'), name: pts[0] || '' };
  }).filter(function(s){ return s && s.name; });
}
function formatText(list){ return list.map(function(s){ return s.id + ' ' + s.name; }).join('\\n'); }

function toast(msg){
  var el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;left:50%;top:80px;transform:translateX(-50%);z-index:999;'+
    'background:rgba(15,23,42,.97);border:1.5px solid #6366f1;color:#fff;padding:10px 22px;'+
    'border-radius:12px;font-size:14px;font-weight:700;box-shadow:0 10px 30px rgba(0,0,0,.6);max-width:86vw;text-align:center';
  document.body.appendChild(el);
  setTimeout(function(){ el.style.transition='.3s'; el.style.opacity='0'; setTimeout(function(){el.remove();},320); }, 2200);
}

function readSaved(){
  var raw = localStorage.getItem(PKEY);
  if(!raw || !raw.trim()) raw = localStorage.getItem(PKEY_V1);
  return raw && raw.trim() ? raw : '';
}
function saveStudents(raw){
  try{ localStorage.setItem(PKEY, raw); localStorage.setItem(PKEY_V1, raw); }catch(e){}
}

function openModal(){
  txtInput.value = readSaved() || DEFAULT_STUDENTS_RAW;
  modal.classList.add('active');
}
document.getElementById('btn-manage').onclick = openModal;
document.getElementById('modal-close').onclick = function(){ modal.classList.remove('active'); };
modal.addEventListener('click', function(e){ if(e.target === modal) modal.classList.remove('active'); });

document.getElementById('btn-save-list').onclick = function(){
  var text = txtInput.value.trim();
  if(!text){ toast('名单内容不能为空！'); return; }
  var list = parseText(text);
  if(!list.length){ toast('没有解析到有效名单，请检查格式'); return; }
  saveStudents(text);
  modal.classList.remove('active');
  toast('已保存 ' + list.length + ' 位同学，15 套点名模板全部同步生效 ✅');
};
document.getElementById('btn-restore-default').onclick = function(){
  if(!confirm('确认恢复为内置默认名单吗？')) return;
  localStorage.removeItem(PKEY); localStorage.removeItem(PKEY_V1);
  saveStudents(DEFAULT_STUDENTS_RAW);
  txtInput.value = DEFAULT_STUDENTS_RAW;
  toast('已恢复默认名单（' + parseText(DEFAULT_STUDENTS_RAW).length + ' 人）');
};
document.getElementById('btn-import-txt').onclick = function(){ fileInput.click(); };
fileInput.addEventListener('change', function(e){
  var f = e.target.files && e.target.files[0];
  if(!f) return;
  var reader = new FileReader();
  reader.onload = function(evt){
    var raw = String(evt.target.result || '').replace(/^\\uFEFF/, '');
    var list = parseText(raw);
    if(!list.length){ toast('文件里没读到有效名单，请检查格式'); return; }
    saveStudents(raw);
    txtInput.value = formatText(list);
    toast('已导入【' + f.name + '】共 ' + list.length + ' 人 ✅');
  };
  reader.readAsText(f, 'utf-8');
  fileInput.value = '';
});

function download(name, text){
  var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
}
document.getElementById('btn-export-txt').onclick = function(){
  download('班级名单.txt', txtInput.value.trim() || readSaved() || DEFAULT_STUDENTS_RAW);
  toast('名单已导出 💾');
};
document.getElementById('btn-txt').onclick = function(){
  if(!readSaved()){ openModal(); toast('请先确认名单内容，再点「导出 txt」'); return; }
  download('班级名单.txt', readSaved());
  toast('名单已导出 💾');
};
</script>
</body>
</html>
`;
}

/* -------------------------------------------------------------------------- */
/*  操作手册                                                                   */
/* -------------------------------------------------------------------------- */
function buildManual(t) {
  const L = [];
  L.push('══════════════════════════════════════════════════════════');
  L.push('  ' + t.title + '  ·  使用操作手册');
  L.push('  主题编号：' + t.id + '    风格：' + t.badge);
  L.push('══════════════════════════════════════════════════════════');
  L.push('');
  L.push('【这个文件夹里有什么】');
  L.push('  index.html    ← 双击这个文件就能开始点名（推荐 Chrome / Edge 打开）');
  L.push('  班级名单.txt  ← 你的学生名单，可直接用记事本打开修改');
  L.push('  操作手册.txt  ← 就是本文件');
  L.push('');
  L.push('【主题特色】');
  L.push('  ' + t.desc);
  if (t.tags && t.tags.length) L.push('  关键词：' + t.tags.join(' · '));
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  一、三步开始点名');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  1. 双击 index.html，用 Chrome 或 Edge 打开（360 极速模式也可以）。');
  L.push('  2. 点右上角【📝 名单管理】，把学生名单粘进去，点【保存并应用】。');
  L.push('  3. 点下方大大的【开始点名】按钮（或直接按空格键）开始，再按一次停止并揭晓。');
  L.push('');
  L.push('  ※ 第一次打开请先随便点一下页面任意位置，浏览器才允许播放音乐。');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  二、快捷键（全 15 套通用）');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  空格 / 回车    开始点名 / 停止并揭晓');
  L.push('  1 ~ 6          快速设置「每次抽取几人」');
  L.push('  R              重置本轮记录（名单不会被删）');
  L.push('  F              全屏 / 退出全屏（上课建议全屏）');
  L.push('  H              打开名单管理');
  L.push('  M              一键静音 / 恢复声音');
  L.push('  Esc            关闭弹窗 / 收起揭晓结果');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  三、名单怎么改（三种方式，随便挑一种）');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  方式 A · 直接编辑 班级名单.txt');
  L.push('     用记事本打开本文件夹里的 班级名单.txt，按下面格式改好保存：');
  L.push('         202401 张三');
  L.push('         202402 李四');
  L.push('         202403 王五');
  L.push('     回到网页 → 【📝 名单管理】→【📂 导入 txt】→ 选中这个文件 → 完成。');
  L.push('');
  L.push('  方式 B · 在网页里手动输入 / 修改');
  L.push('     【📝 名单管理】里直接粘贴或一行行改，改完点【保存并应用】。');
  L.push('');
  L.push('  方式 C · 从 Excel 表格导入');
  L.push('     在 Excel 里整理成「学号 姓名」两列 → 另存为「文本文件(制表符分隔)(*.txt)」');
  L.push('     → 再用方式 A 导入。姓名和学号之间是 Tab 也能正确识别。');
  L.push('');
  L.push('  名单格式说明：');
  L.push('     · 每行一位同学，格式为「学号 姓名」；');
  L.push('     · 学号和姓名之间用 空格 / 逗号 / 顿号 / Tab 分隔都行；');
  L.push('     · 只写姓名不写学号也可以，系统会自动编号 01、02、03…；');
  L.push('     · 以 # 开头的行是注释，会被自动忽略，可以用来写「高二(3)班」这类备忘。');
  L.push('');
  L.push('  ★ 名单是存在浏览器里的，改一次，本机 15 套模板全部同步生效。');
  L.push('  ★ 换电脑或换浏览器后名单不会跟过去，这时用【📂 导入 txt】重新导入一次即可。');
  L.push('  ★ 想彻底带走名单：点【📦 导出 HTML(名单已内嵌)】，会生成一份名单已经写死在里面的');
  L.push('    网页，拷到任何电脑双击打开，名单都还在。');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  四、抽取规则');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  · 每次抽取人数：下拉框选 1~6 人，也可以直接按数字键 1~6。');
  L.push('  · 不重复抽取：勾上（默认）后，本轮内点过的同学不会再被点到；');
  L.push('    全班点完一轮会自动弹出提示并开启新一轮，不用手动重置。');
  L.push('    取消勾选则每次都可能重复点到同一位同学（适合反复抽同一批人）。');
  L.push('  · 底部横条会记录本轮已点到的同学，按 R 可清空重新开始。');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  五、声音与画面');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  🎵 氛围音  本主题专属的背景音乐（' + (t.musicNote || '根据主题氛围专门调配') + '），');
  L.push('             可随时开关。上课时调小电脑音量即可，不影响其它操作。');
  L.push('  🔊 音效    点名前的倒数蓄力音、摇人时的加速脉冲声、抽中时的庆典号角，');
  L.push('             三段声音层次分明，学生能清楚听出「要抽了 / 正在抽 / 抽中了」。');
  L.push('  关闭声音：按 M 键或点右上角【🔊 音效: 开】。');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  六、屏幕适配（14 寸笔记本已专门优化）');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  · 已按 1280×720 及以上的分辨率专门调校，14 寸笔记本（含 125%/150% 缩放）');
  L.push('    开箱即用，不会出现卡牌被切掉半张、按钮跑到屏幕外的情况。');
  L.push('  · 页面会自动按舞台可用空间重新排布元素，窗口拉大拉小都会自动重排。');
  L.push('  · 接到教室大屏 / 投影时，按 F 键全屏，效果最佳。');
  L.push('  · 如果浏览器缩放不是 100%，请按 Ctrl+0 恢复默认缩放。');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  七、常见问题');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  Q：没有声音？');
  L.push('  A：浏览器规定必须先有一次点击才允许播放声音。随便点一下页面，');
  L.push('     或按一下空格键即可。另请检查电脑音量、以及右上角是否为「音效: 开」。');
  L.push('');
  L.push('  Q：名单改了，另一套模板没变？');
  L.push('  A：请确认两次都是在同一个浏览器里打开的（例如都用 Chrome）。');
  L.push('     实在不行就在这套模板里重新【导入 txt】一次。');
  L.push('');
  L.push('  Q：一不小心点了「恢复默认」，我自己的名单没了？');
  L.push('  A：恢复默认只影响浏览器里存的名单，你的 班级名单.txt 文件不会被改动，');
  L.push('     重新导入一次即可。建议平时保留一份 班级名单.txt 作为底稿。');
  L.push('');
  L.push('  Q：能放到 U 盘 / 发给别人用吗？');
  L.push('  A：可以。整个文件夹拷走即可，无需安装任何软件、无需联网。');
  L.push('');
  L.push('  Q：投影到大屏后字太大或太小？');
  L.push('  A：按 Ctrl 加 + 或 Ctrl 加 - 微调浏览器缩放，或按 F 全屏后按显示器实际');
  L.push('     分辨率调整。页面本身会自适应，一般不需要手动调。');
  L.push('');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  八、同系列其它主题');
  L.push('──────────────────────────────────────────────────────────');
  L.push('  本系列共 15 套，均为独立网页，可单独使用也可打包成套：');
  const others = THEMES.filter(x => x.id !== t.id);
  others.forEach(x => L.push('    ' + x.id + '  ' + x.title + '（' + x.badge + '）'));
  L.push('');
  L.push('  需要切换主题时，直接打开对应文件夹里的 index.html 即可，');
  L.push('  名单是共用的，不用重新导入。');
  L.push('');
  L.push('══════════════════════════════════════════════════════════');
  L.push('  祝课堂气氛越来越好 🎉');
  L.push('══════════════════════════════════════════════════════════');
  return L.join('\r\n');
}

/* -------------------------------------------------------------------------- */
/*  写出文件                                                                   */
/* -------------------------------------------------------------------------- */
function writeFiles() {
  let n = 0;
  THEMES.forEach(t => {
    const dir = path.join(ROOT, t.dir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), buildPage(t), 'utf8');
    fs.writeFileSync(path.join(dir, '操作手册.txt'), buildManual(t), 'utf8');
    fs.writeFileSync(path.join(dir, '班级名单.txt'), rosterFile(), 'utf8');
    n += 3;
    console.log('  ✓ ' + t.dir);
  });

  fs.writeFileSync(path.join(ROOT, 'index.html'), buildIndex(), 'utf8');
  fs.writeFileSync(path.join(ROOT, '操作手册.txt'), buildCollectionManual(), 'utf8');
  fs.writeFileSync(path.join(ROOT, '班级名单.txt'), rosterFile(), 'utf8');
  console.log('  ✓ 合集入口 index.html / 操作手册.txt / 班级名单.txt');
  console.log('\n共写出 ' + (n + 3) + ' 个文件。');
}

function rosterFile() {
  return [
    '# ============================================================',
    '#  班级学生名单   （用记事本编辑本文件，保存后在网页里点【📂 导入 txt】）',
    '# ------------------------------------------------------------',
    '#  格式： 每行一位同学，写法是  学号 姓名',
    '#  例如： 202401 张三',
    '#  学号与姓名之间用 空格 / 逗号 / Tab 分隔都可以。',
    '#  只写姓名不写学号也行，系统会自动编号 01、02、03…',
    '#  以 # 开头的行是注释，不会被当成学生。',
    '# ============================================================',
    '',
    defaultRoster,
    ''
  ].join('\r\n');
}

function buildCollectionManual() {
  const L = [];
  L.push('══════════════════════════════════════════════════════════');
  L.push('  课堂随机点名 · 15 款趣味主题合集  ·  使用操作手册');
  L.push('══════════════════════════════════════════════════════════');
  L.push('');
  L.push('【怎么开始】');
  L.push('  1. 双击根目录的 index.html（推荐 Chrome / Edge）。');
  L.push('  2. 点【📝 班级名单管理】，粘贴名单，点【保存并应用】。');
  L.push('  3. 在 15 张卡片里挑一套，点【进入点名】即可。');
  L.push('');
  L.push('【15 套主题一览】');
  THEMES.forEach(t => {
    L.push('  ' + t.id + '  ' + t.title + '（' + t.badge + '）');
    L.push('      文件夹：' + t.dir);
    L.push('      ' + t.desc);
    L.push('');
  });
  L.push('【名单是共用的】');
  L.push('  在根目录改一次名单，15 套模板全部自动同步生效；');
  L.push('  在任意一套模板里改，其它 14 套也一样会同步。');
  L.push('  名单存在浏览器本地，换电脑时请用【📂 导入 txt】重新导入，');
  L.push('  或用各模板里的【📦 导出 HTML(名单已内嵌)】把名单写进网页带走。');
  L.push('');
  L.push('【通用快捷键】');
  L.push('  空格 / 回车  开始 / 停止     1~6  抽取人数   R  重置本轮');
  L.push('  F  全屏        H  名单管理     M  静音       Esc  关闭弹窗');
  L.push('');
  L.push('【屏幕适配】');
  L.push('  全部 15 套均按 14 寸笔记本（1280×720 起）专项调校，');
  L.push('  元素会跟随舞台空间自动重排，不会出现被裁切的情况。');
  L.push('  投影到教室大屏时按 F 全屏效果最佳。');
  L.push('');
  L.push('【声音】');
  L.push('  每套主题都有专属氛围 BGM，并区分三种场景音效：');
  L.push('    点名前 → 上升蓄力 + 倒数提示音');
  L.push('    摇人时 → 不断加速的脉冲节奏');
  L.push('    抽中时 → 号角庆典 + 掌声层');
  L.push('  所有声音均由浏览器实时合成，不依赖任何外部音频文件。');
  L.push('');
  L.push('【分发说明】');
  L.push('  每套主题的文件夹都可以整体拷走单独售卖/分发，');
  L.push('  内含 index.html + 班级名单.txt + 操作手册.txt 三个文件，无需联网。');
  L.push('');
  L.push('══════════════════════════════════════════════════════════');
  return L.join('\r\n');
}

console.log('开始构建课堂随机点名 v2 ...\n');
writeFiles();
