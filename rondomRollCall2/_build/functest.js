/* ==========================================================================
   课堂随机点名 v2 · 功能端到端验证
   用法： node _build/functest.js [主题文件夹名前缀，默认 01]
   覆盖：内置名单 / 手动修改 / 逗号与Tab解析 / 只写姓名自动编号 /
         导入导出 / 导出内嵌名单的 HTML 并重新打开 / 1~6人抽取 / 不重复抽取
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { launch, openPage, findBrowser, goto, sleep } = require('./cdp');

const ROOT = path.resolve(__dirname, '..');
const ARG = process.argv[2] || '01';

(ARG === '--all' ? runAllRoundTrip() : runFullSuite(ARG))
  .catch(e => { console.error('测试脚本出错：', e); process.exit(2); });

/* ---------------------------------------------------------------------- *
 *  全主题「导出内嵌名单的 HTML → 重新打开」往返检查
 *  能抓出「导出时被 data-dyn 清掉、重开后主题 DOM 建不起来」这类问题
 * ---------------------------------------------------------------------- */
async function runAllRoundTrip() {
  const browser = await findBrowser();
  if (!browser) { console.error('找不到 Chrome / Edge'); process.exit(1); }

  const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d\d-/.test(d.name))
    .map(d => d.name).sort();

  const { proc, dir: profile } = await launch(browser);
  const tmp = [];
  let pass = 0, fail = 0;

  try {
    for (const d of dirs) {
      const page = path.join(ROOT, d, 'index.html');
      let line = '  ' + d.slice(0, 2) + ' ' + d.slice(3);
      try {
        const a = await openPage();
        await goto(a.cdp, page);
        const before = await a.cdp.json(
          'JSON.stringify({n:TC.students.length,nodes:document.querySelectorAll(".tc-stage *").length,err:window.__tcError})');
        if (before.err) throw new Error('原始页面 JS 报错: ' + before.err);

        const html = await a.cdp.eval('TC.buildExportHtml(TC.formatText(TC.students))');
        await a.close();
        if (typeof html !== 'string' || html.length < 5000) throw new Error('导出内容异常');

        const f = path.join(os.tmpdir(), 'tc-rt-' + d.slice(0, 2) + '-' + Date.now() + '.html');
        fs.writeFileSync(f, html, 'utf8');
        tmp.push(f);

        const b = await openPage();
        await goto(b.cdp, f);
        const after = await b.cdp.json(
          'JSON.stringify({n:TC.students.length,nodes:document.querySelectorAll(".tc-stage *").length,err:window.__tcError})');
        await b.close();

        const probs = [];
        if (after.err) probs.push('重开后 JS 报错: ' + after.err);
        if (after.n !== before.n) probs.push('名单人数 ' + before.n + '→' + after.n);
        if (after.nodes < before.nodes * 0.75) probs.push('舞台节点 ' + before.nodes + '→' + after.nodes);

        if (probs.length) { fail++; console.log(line + '  ✗ ' + probs.join(' ; ')); }
        else { pass++; console.log(line + '  ✓ 往返正常（名单 ' + after.n + ' 人，舞台 ' + after.nodes + ' 节点）'); }
      } catch (e) {
        fail++; console.log(line + '  ✗ ' + e.message);
      }
    }
  } finally {
    proc.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) { }
    tmp.forEach(f => { try { fs.unlinkSync(f); } catch (_) { } });
  }

  console.log('\n────────────────────────────────');
  console.log('通过 ' + pass + ' 套，失败 ' + fail + ' 套');
  process.exit(fail ? 1 : 0);
}

/* ---------------------------------------------------------------------- *
 *  单主题完整功能测试
 * ---------------------------------------------------------------------- */
async function runFullSuite(PREFIX) {
const dir = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name.startsWith(PREFIX + '-'))
  .map(d => d.name)[0];
if (!dir) { console.error('找不到主题文件夹 ' + PREFIX + '-*'); process.exit(1); }
const PAGE = path.join(ROOT, dir, 'index.html');

let pass = 0, fail = 0;
function check(name, ok, extra) {
  if (ok) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

  const browser = await findBrowser();
  if (!browser) { console.error('找不到 Chrome / Edge'); process.exit(1); }
  console.log('测试页面：' + dir + '/index.html\n');

  const { proc, dir: profile } = await launch(browser);
  let exportedFile = null;

  try {
    /* ---------- 1. 内置名单 ---------- */
    console.log('【1】内置名单与首屏状态');
    let { cdp, close } = await openPage();
    await goto(cdp, PAGE);
    let s = await cdp.json('JSON.stringify({n:TC.students.length, total:document.getElementById("stat-total").textContent, first:TC.students[0].id+" "+TC.students[0].name, cls:document.querySelectorAll(".tc-stage *").length})');
    check('默认名单载入 45 人', s.n === 45, '实际 ' + s.n);
    check('状态栏同步显示 45', s.total === '45', '实际 ' + s.total);
    check('名单内容来自内置 HTML', s.first === '202401 陈晨', '实际 ' + s.first);
    check('主题舞台已渲染', s.cls > 6, '舞台节点数 ' + s.cls);

    /* ---------- 2. 抽取人数 1~6 ---------- */
    console.log('\n【2】一次抽取 1~6 人 + 不重复抽取');
    let counts = await cdp.json(`(function(){
      var out=[];
      for (var k=1;k<=6;k++){
        document.getElementById('sel-count').value=String(k);
        TC.resetPool(true);
        var w=TC.pickWinners();
        var uniq={}; w.forEach(function(x){uniq[x.id]=1;});
        out.push({k:k,got:w.length,uniq:Object.keys(uniq).length,remain:TC.remain.length});
      }
      return JSON.stringify(out);
    })()`);
    check('抽出人数与选择一致', counts.every(c => c.got === c.k), JSON.stringify(counts.map(c => c.k + '→' + c.got)));
    check('同一次内不出现重复学生', counts.every(c => c.uniq === c.k));
    check('不重复模式下剩余池同步减少', counts.every(c => c.remain === 45 - c.k));

    /* ---------- 3. 名单格式解析 ---------- */
    console.log('\n【3】名单格式容错');
    let p = await cdp.json(`JSON.stringify({
      space: TC.parseText("202401 张三"),
      comma: TC.parseText("202401,张三"),
      cncomma: TC.parseText("202401，张三"),
      tab: TC.parseText("202401\\t张三"),
      noid: TC.parseText("张三"),
      comment: TC.parseText("# 高二(3)班\\n202401 张三"),
      nameWithSpace: TC.parseText("202401 欧阳 娜娜"),
      empty: TC.parseText("")
    })`);
    check('空格分隔', p.space.length === 1 && p.space[0].name === '张三');
    check('英文逗号分隔', p.comma.length === 1 && p.comma[0].id === '202401');
    check('中文逗号分隔', p.cncomma.length === 1 && p.cncomma[0].name === '张三');
    check('Tab 分隔（Excel 导出）', p.tab.length === 1 && p.tab[0].name === '张三');
    check('只写姓名自动编号', p.noid.length === 1 && p.noid[0].id === '01' && p.noid[0].name === '张三');
    check('# 注释行被忽略', p.comment.length === 1 && p.comment[0].id === '202401');
    check('复姓含空格姓名完整保留', p.nameWithSpace[0].name === '欧阳 娜娜', p.nameWithSpace[0].name);
    check('空文本返回空数组', p.empty.length === 0);

    /* ---------- 4. 手动修改名单并保存 ---------- */
    console.log('\n【4】页面手动修改名单 → 保存并应用');
    const custom = '9001 赵一鸣\n9002 钱二丫\n9003 孙三石\n9004 李四喜\n9005 周五福\n9006 吴六顺\n9007 郑七安';
    await cdp.eval(`(function(){
      document.getElementById('btn-manage').click();
      document.getElementById('txt-input').value = ${JSON.stringify(custom)};
      document.getElementById('btn-save-list').click();
    })()`);
    await sleep(300);
    s = await cdp.json(`JSON.stringify({
      n: TC.students.length,
      total: document.getElementById('stat-total').textContent,
      modalClosed: !document.getElementById('modal-manage').classList.contains('active'),
      stored: (localStorage.getItem('CLASSROOM_ROLLCALL_V2_STUDENTS')||'').indexOf('9001 赵一鸣') > -1,
      storedV1: (localStorage.getItem('CLASSROOM_ROLLCALL_STUDENTS_GLOBAL')||'').indexOf('9001 赵一鸣') > -1,
      stage: document.querySelectorAll('.tc-stage *').length
    })`);
    check('名单已更新为 7 人', s.n === 7, '实际 ' + s.n);
    check('状态栏同步', s.total === '7');
    check('保存后弹窗自动关闭', s.modalClosed);
    check('已写入 localStorage（v2 键）', s.stored);
    check('已同步写入 v1 键（老版本模板也能读到）', s.storedV1);
    check('舞台按新名单重建', s.stage > 6, '节点数 ' + s.stage);

    /* ---------- 5. 导出内嵌名单的 HTML ---------- */
    console.log('\n【5】导出一份「名单已内嵌」的 HTML 并重新打开');
    const html = await cdp.eval(`TC.buildExportHtml(TC.formatText(TC.students))`);
    check('导出内容非空', typeof html === 'string' && html.length > 5000, '长度 ' + (html && html.length));
    check('导出的是完整文档', /^<!DOCTYPE html>/.test(html) && /<\/html>\s*$/.test(html));
    check('名单已写入 DEFAULT_STUDENTS_RAW', html.indexOf('9001 \\\\u8d75') > -1 || html.indexOf('9001 赵一鸣') > -1);
    check('导出后没有残留的揭晓态', html.indexOf('tc-reveal active') === -1 && html.indexOf('gx-reveal active') === -1);
    check('导出后动态容器已清空', !/data-dyn[^>]*>\s*<div class="hist-pill/.test(html));

    exportedFile = path.join(os.tmpdir(), 'tc-exported-' + Date.now() + '.html');
    fs.writeFileSync(exportedFile, html, 'utf8');

    const t2 = await openPage();
    await goto(t2.cdp, exportedFile);
    const s2 = await t2.cdp.json(`JSON.stringify({
      n: TC.students.length,
      first: TC.students[0].id + ' ' + TC.students[0].name,
      total: document.getElementById('stat-total').textContent,
      nodes: document.querySelectorAll('.tc-stage *').length,
      bgm: typeof TC.Music.isPlaying === 'function'
    })`);
    check('导出的 HTML 双击打开即带自定义名单', s2.n === 7, '实际 ' + s2.n);
    check('导出的 HTML 名单内容正确', s2.first === '9001 赵一鸣', s2.first);
    check('导出的 HTML 主题正常渲染', s2.nodes > 6, '节点数 ' + s2.nodes);

    /* 模拟抽取一次，确认导出的文件功能完好 */
    await t2.cdp.eval('TC.toggleRoll()');
    await sleep(900);
    await t2.cdp.eval('TC.toggleRoll()');
    await sleep(1200);
    const s3 = await t2.cdp.json(`JSON.stringify({
      called: document.getElementById('stat-called').textContent,
      pills: document.querySelectorAll('.hist-pill').length,
      err: window.__tcError || null
    })`);
    check('导出的 HTML 能正常抽取', s3.called === '1', '已抽 ' + s3.called);
    check('历史记录条已生成', s3.pills === 1, '胶囊数 ' + s3.pills);
    await t2.close();

    /* ---------- 6. 跨标签页同步 ---------- */
    console.log('\n【6】跨标签页名单同步');
    const t3 = await openPage();
    await goto(t3.cdp, PAGE);
    const s4 = await t3.cdp.json('JSON.stringify({n:TC.students.length, first:TC.students[0].name})');
    check('新开的页面直接读到同一份名单', s4.n === 7 && s4.first === '赵一鸣', s4.n + '人/' + s4.first);
    await t3.close();

    await close();
  } finally {
    proc.kill();
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (_) { }
    if (exportedFile) { try { fs.unlinkSync(exportedFile); } catch (_) { } }
  }

  console.log('\n────────────────────────────────');
  console.log('通过 ' + pass + ' 项，失败 ' + fail + ' 项');
  process.exit(fail ? 1 : 0);
}
