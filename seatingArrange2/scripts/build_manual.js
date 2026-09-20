// Zero-dependency DOCX manual generator using pure OpenXML + PowerShell Compress-Archive
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = path.resolve(__dirname, '..');
const tempDir = path.join(workspaceDir, 'temp_docx_build');
const docxPath = path.join(workspaceDir, '班级座位表排座神器操作说明.docx');
const zipPath = path.join(workspaceDir, 'temp_doc.zip');

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', 'media'), { recursive: true });

// Copy screenshots
const shotChartSrc = path.join(workspaceDir, 'screenshot_seating_chart.png');
const shotEditorSrc = path.join(workspaceDir, 'screenshot_group_editor.png');
if (fs.existsSync(shotChartSrc)) {
  fs.copyFileSync(shotChartSrc, path.join(tempDir, 'word', 'media', 'image1.png'));
}
if (fs.existsSync(shotEditorSrc)) {
  fs.copyFileSync(shotEditorSrc, path.join(tempDir, 'word', 'media', 'image2.png'));
}

// [Content_Types].xml
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;
fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml, 'utf-8');

// _rels/.rels
const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), relsXml, 'utf-8');

// word/_rels/document.xml.rels
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image2.png"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRelsXml, 'utf-8');

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

function p(text, opts = {}) {
  const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : '';
  const before = opts.before !== undefined ? opts.before : 60;
  const after = opts.after !== undefined ? opts.after : 60;
  const size = opts.size || 21;
  const color = opts.color || '333333';
  const bold = opts.bold ? '<w:b/>' : '';

  return `<w:p>
    <w:pPr>
      ${align}
      <w:spacing w:before="${before}" w:after="${after}" w:line="360" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:eastAsia="Microsoft YaHei"/>
        ${bold}
        <w:color w:val="${color}"/>
        <w:sz w:val="${size}"/>
      </w:rPr>
      <w:t>${escapeXml(text)}</w:t>
    </w:r>
  </w:p>`;
}

function heading1(text) {
  return p(text, { size: 32, bold: true, color: '1e3a8a', before: 360, after: 140 });
}

function heading2(text) {
  return p(text, { size: 26, bold: true, color: '0369a1', before: 240, after: 100 });
}

function bullet(title, desc) {
  return `<w:p>
    <w:pPr>
      <w:spacing w:before="40" w:after="40" w:line="340" w:lineRule="auto"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:eastAsia="Microsoft YaHei"/>
        <w:b/>
        <w:color w:val="0f172a"/>
        <w:sz w:val="21"/>
      </w:rPr>
      <w:t>• ${escapeXml(title)}：</w:t>
    </w:r>
    <w:r>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei" w:eastAsia="Microsoft YaHei"/>
        <w:color w:val="334155"/>
        <w:sz w:val="21"/>
      </w:rPr>
      <w:t>${escapeXml(desc)}</w:t>
    </w:r>
  </w:p>`;
}

function imageDrawing(relId, imgId, name, widthEmu = 5400000, heightEmu = 3400000, caption = '') {
  return `<w:p>
    <w:pPr>
      <w:jc w:val="center"/>
      <w:spacing w:before="160" w:after="80"/>
    </w:pPr>
    <w:r>
      <w:drawing>
        <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
          <wp:extent cx="${widthEmu}" cy="${heightEmu}"/>
          <wp:effectExtent l="0" t="0" r="0" b="0"/>
          <wp:docPr id="${imgId}" name="${name}"/>
          <wp:cNvGraphicFramePr>
            <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
          </wp:cNvGraphicFramePr>
          <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:nvPicPr>
                  <pic:cNvPr id="${imgId}" name="${name}"/>
                  <pic:cNvPicPr/>
                </pic:nvPicPr>
                <pic:blipFill>
                  <a:blip r:embed="${relId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>
                  <a:stretch>
                    <a:fillRect/>
                  </a:stretch>
                </pic:blipFill>
                <pic:spPr>
                  <a:xfrm>
                    <a:off x="0" y="0"/>
                    <a:ext cx="${widthEmu}" cy="${heightEmu}"/>
                  </a:xfrm>
                  <a:prstGeom prst="rect">
                    <a:avLst/>
                  </a:prstGeom>
                </pic:spPr>
              </pic:pic>
            </a:graphicData>
          </a:graphic>
        </wp:inline>
      </w:drawing>
    </w:r>
  </w:p>
  ${caption ? p(`图：${caption}`, { align: 'center', size: 18, color: '64748b', before: 40, after: 160 }) : ''}`;
}

let docBody = '';

// Title
docBody += p('班级座位表排座神器 (离线纯前端旗舰版)', { align: 'center', size: 44, bold: true, color: '1e3a8a', before: 200, after: 80 });
docBody += p('全功能操作说明手册与功能实操指南', { align: 'center', size: 26, color: '64748b', before: 40, after: 240 });

// Attribute Table
docBody += `<w:tbl>
  <w:tblPr>
    <w:tblW w:w="5000" w:type="pct"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
      <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>${p('软件名称', { bold: true, align: 'center', size: 20 })}</w:tc>
    <w:tc>${p('班级座位表排座神器 (纯前端旗舰版)', { size: 20 })}</w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>${p('系统架构', { bold: true, align: 'center', size: 20 })}</w:tc>
    <w:tc>${p('纯前端 HTML5 / CSS3 / ES6 (离线无依赖)', { size: 20 })}</w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>${p('设计特色', { bold: true, align: 'center', size: 20 })}</w:tc>
    <w:tc>${p('契合小红书 buju.jpg 规格排布与平移', { size: 20 })}</w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>${p('合作学习', { bold: true, align: 'center', size: 20 })}</w:tc>
    <w:tc>${p('沉浸式课桌沙盘物理排布与S型成绩均衡分组', { size: 20 })}</w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>${p('排座策略', { bold: true, align: 'center', size: 20 })}</w:tc>
    <w:tc>${p('男女/同性/成绩/身高/互助/视力保护', { size: 20 })}</w:tc>
    <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>${p('输出支持', { bold: true, align: 'center', size: 20 })}</w:tc>
    <w:tc>${p('自适应打印 / 高清无水印图片 / Excel表格', { size: 20 })}</w:tc>
  </w:tr>
</w:tbl>`;

// Section 1
docBody += heading1('一、核心功能亮点与系统架构');
docBody += p('本系统是专为各学段教师量身打造的现代化高颜值排座神器，100% 纯前端离线运行，免安装、零依赖，支持断网双击打开即可使用：');
docBody += bullet('高颜值小红书同款布局', '支持 2-2-2、2-3-2、2-3-3、3-3-3、2-2-2-2 等多种经典排布，并支持自定义过道表达式（如 2-1-2-1）；画布左右自适应延展，绝不裁切。');
docBody += bullet('契合小红书 buju.jpg 规格平移', '支持全班整体或指定列号/行号（如 1 2 3、连续范围 1-3、第1排）按步数左右平移与前后平移，配备每周大组轮换防斜视功能。');
docBody += bullet('独立排次坐标尺与轻巧无框小锁', '左侧设立独立的【第1排】、【第2排】...纯中文排次标签列，绝不遮盖第一列学生；透明无框小锁头悬浮卡片右上角，点击即可锁定原地不动。');
docBody += bullet('沉浸式合作小组课桌沙盘', '独立全屏小组编辑器，以 2×2 课桌网格呈现真实的物理课桌排布，标明前排/后排同桌关系，支持组内与跨组直接拖换。');
docBody += bullet('S型成绩均衡优差互助分队', '依据学生成绩/名次采用教育学标准的 S 型蛇形折返算法，各组均分高度一致；每组自动搭配 1 名领学优等生（领学⭐）、2 名中间生与 1 名潜能生（互助🤝），且前排座位自动将优等生与潜能生安排为同桌结对帮扶。');
docBody += bullet('主座位表团队标识与联动高亮', '在教室主座位表上为每个团队配发专属粉彩色胶囊标识（如 1组、2组），鼠标滑过任一座位，全班同组成员座位同步泛光高亮。');
docBody += bullet('班级多存档与跨端迁移', '支持一键保存多个班级排座方案随时切换，并支持导入导出 JSON 备份文件。');

// Image 1
docBody += imageDrawing('rId1', 1, 'chart', 5500000, 3600000, '班级主座位表（展示第1排独立排号、团队分组标识Badge与同组高亮）');

// Section 2
docBody += heading1('二、合作学习小组与优差互助分队实操指南');
docBody += p('合作学习是现代课堂教学的核心模式。排座神器提供了沉浸式的最大化小组编辑器：');
docBody += heading2('1. 课桌沙盘物理排布 (所见即所坐)');
docBody += bullet('真实的物理座次', '进入独立小组编辑器后，每个小组以 2×2 课桌网格形象呈现，标明【▲ 讲台方向 (前排)】，上方为前排同桌，下方为后排同桌。');
docBody += bullet('组内同桌/前后互换', '直接鼠标按住学生卡片拖拽到同组另一课桌，即可完成同桌互换或前后调位。');
docBody += bullet('跨组对调与解散', '支持直接将学生拖拽到其他小组或未入组学生池，组卡片右上角可一键重命名或解散。');

docBody += heading2('2. 成绩均衡搭配 (🎯 优差互助分队)');
docBody += bullet('科学Serpentine蛇形折返算法', '点击【🎯 优差互助分队】，系统自动将全班学生按成绩从优到潜蛇形轮转排布，确保每一个团队的组内平均名次与分数值完全一致，实现教育资源与学习能力的高度平衡。');
docBody += bullet('结对帮扶座位排布', '在每个 4 人小组中，系统自动将排名第一的优等生标注为【领学⭐】，排名最后的潜能生标注为【互助🤝】，并自动将他们排在前排作为同桌，方便优等生在课堂讨论中随时为互助同桌辅导答疑！');

docBody += heading2('3. 批量录入/导入成绩');
docBody += bullet('Excel列快速粘贴', '点击【📊 录入/导入成绩】，在粘贴框中直接粘贴从 Excel 复制的【姓名 成绩】两列，系统智能解析并同步全班名次。');
docBody += bullet('列表逐人微调', '支持切换到【列表逐人修改】选项卡，在表格中直接为每位学生输入最新分数。');

docBody += heading2('4. 一键应用到班级座位表');
docBody += bullet('物理岛屿集群排座', '点击【🪑 应用到班级座位表 (组员坐在一起)】，系统自动将规划好的各个团队直接映射排入教室主座位表中，使同团队成员紧密同桌前后围坐。');

// Image 2
docBody += imageDrawing('rId2', 2, 'editor', 5500000, 3600000, '独立合作小组编辑器（2×2课桌沙盘、前排领学⭐与互助🤝同桌帮扶、均分高度平衡）');

// Section 3
docBody += heading1('三、智能排座策略与座位平移实操指南');
docBody += heading2('1. 九大智能排座策略');
docBody += bullet('完全随机', '对未锁定的全部座位进行全局随机打乱，快速破冰。');
docBody += bullet('男女同桌', '自动计算男女生比例，按一男一女搭档配对同桌。');
docBody += bullet('同性同桌', '男生与男生同桌，女生与女生同桌，杜绝男女混坐。');
docBody += bullet('S型蛇形排座', '奇数排从左至右，偶数排从右至左折返排座。');
docBody += bullet('按成绩排座', '高分学生在前，依序蛇形往后排布。');
docBody += bullet('按身高排座', '矮个同学优先安排在前排，高个同学排在后排，保障全班视线不受阻挡。');
docBody += bullet('优差互助同桌', '按成绩高低配对为同桌，形成结对帮扶。');
docBody += bullet('视力优先保护', '近视或视力差学生优先保障在讲台正前方 1-2 排正中核心区域。');
docBody += bullet('名单顺序排入', '严格按照学生名单输入的原始顺序排入座位。');

docBody += heading2('2. 座位平移轮换 (契合小红书 buju.jpg 规格)');
docBody += bullet('列平移 (左右)', '支持留空轮换全班，或输入特定列号（如 1 2 3、1-3、第1列）。点击方向按钮或橙色【执行平移】按钮立即生效。');
docBody += bullet('行平移 (前后)', '支持留空轮换全班，或输入特定排号（如 1 2 3、1-3、第1排），步数自由调节。');
docBody += bullet('每周大组轮换', '点击【🏢 大组向右轮换】或【🏢 大组向左轮换】，全大组横向交替轮转，有效预防学生斜视与单侧颈部疲劳。');

// Section 4
docBody += heading1('四、班级多存档、规范导出与打印');
docBody += bullet('班级多存档管理', '点击顶部【📁 班级存档】，保存当前排座方案快照，支持多班级（如初一1班、初一2班）一键秒级切换与加载；支持导出与导入 JSON 完整备份。');
docBody += bullet('导出规范 Excel', '导出的 Excel 表格纯净高雅，仅包含纯学生姓名（无多余性别字样），班级大标题、黑板讲台、大组表头自动合并单元格。');
docBody += bullet('导出高清 PNG 图片', '一键生成超清 PNG 图纸，自动剔除编辑用的小锁头和调试文字，适合发至家长微信群或打印留档。');
docBody += bullet('智能自适应打印', '点击【🖨️ 打印】或按 Ctrl+P，系统根据教室长宽比自动调整为横向 (Landscape) 或纵向 (Portrait)，页面居中且自动隐去控制按钮。');

// Complete document.xml
const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${docBody}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
      <w:cols w:space="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), documentXml, 'utf-8');

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);

const psZipCmd = `powershell -Command "Compress-Archive -Path '${tempDir}/*' -DestinationPath '${zipPath}' -Force"`;
execSync(psZipCmd, { stdio: 'inherit' });

fs.renameSync(zipPath, docxPath);
console.log('Successfully generated docx:', docxPath, 'File size:', fs.statSync(docxPath).size, 'bytes');

fs.rmSync(tempDir, { recursive: true, force: true });
