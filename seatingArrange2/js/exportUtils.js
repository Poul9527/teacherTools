/**
 * 座位表排座神器 - 导出工具套件 (Export Utilities)
 * 支持 导出PNG图片 (html2canvas & Canvas兜底)、导出Excel (.xlsx)、导出TXT纯文本、调起打印
 */

const ExportUtils = (function() {
  /**
   * 格式化当前日期为字符串 YYYYMMDD_HHMM
   */
  function getFormattedTimestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  /**
   * 触发浏览器下载 Blob 文件
   */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * 1. 导出为高清图片 (PNG)
   * 优先使用 html2canvas，失败时自动降级为原生 Canvas 绘制
   */
  async function exportToImage(element, title = '座位表') {
    const filename = `${title}_${getFormattedTimestamp()}.png`;

    // 优先检查 html2canvas 是否可用
    if (typeof html2canvas === 'function') {
      try {
        // 添加临时导出样式类，隐去界面控制锁图标和辅助边框
        element.classList.add('exporting-image');

        const canvas = await html2canvas(element, {
          scale: 2, // 2倍超清抗锯齿
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (node) => {
            return !!(node.classList && (node.classList.contains('seat-quick-lock') || node.classList.contains('no-export')));
          }
        });
        
        canvas.toBlob(blob => {
          if (blob) {
            downloadBlob(blob, filename);
          } else {
            throw new Error('Canvas toBlob 返回空');
          }
        }, 'image/png');
        return true;
      } catch (err) {
        console.warn('html2canvas 导出失败，尝试原生 Canvas 兜底绘制:', err);
      } finally {
        element.classList.remove('exporting-image');
      }
    }

    // 兜底方案：原生 Canvas 绘制
    return fallbackNativeCanvasExport(element, filename, title);
  }

  /**
   * 原生 Canvas 离线兜底导出图片
   */
  function fallbackNativeCanvasExport(containerEl, filename, title) {
    const canvas = document.createElement('canvas');
    const rect = containerEl.getBoundingClientRect();
    const scale = 2;
    canvas.width = (rect.width || 900) * scale;
    canvas.height = (rect.height || 600) * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // 绘制白底
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 绘制标题
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, rect.width / 2, 40);

    // 绘制黑板与讲台
    ctx.fillStyle = '#1e3a2b';
    ctx.roundRect ? ctx.roundRect(rect.width / 2 - 120, 60, 240, 36, 6) : ctx.fillRect(rect.width / 2 - 120, 60, 240, 36);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('【 黑 板 / 讲 台 】', rect.width / 2, 84);

    // 扫描所有座位卡片进行绘制
    const seatCards = containerEl.querySelectorAll('.seat-card');
    const containerOffset = containerEl.getBoundingClientRect();

    seatCards.forEach(card => {
      const cardRect = card.getBoundingClientRect();
      const x = cardRect.left - containerOffset.left;
      const y = cardRect.top - containerOffset.top;
      const w = cardRect.width;
      const h = cardRect.height;

      const isBoy = card.classList.contains('gender-boy');
      const isGirl = card.classList.contains('gender-girl');

      // 背景与边框
      ctx.fillStyle = isBoy ? '#e6f4ff' : (isGirl ? '#fff0f6' : '#f8fafc');
      ctx.strokeStyle = isBoy ? '#91caff' : (isGirl ? '#ffadd2' : '#cbd5e1');
      ctx.lineWidth = 1.5;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }

      // 座位学生名字
      const nameEl = card.querySelector('.seat-name');
      const name = nameEl ? nameEl.textContent.trim() : '';
      if (name) {
        ctx.fillStyle = isBoy ? '#0958d9' : (isGirl ? '#c41d7f' : '#1e293b');
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, x + w / 2, y + h / 2 + 5);
      }
    });

    canvas.toBlob(blob => {
      if (blob) {
        downloadBlob(blob, filename);
      }
    }, 'image/png');
    return true;
  }

  /**
   * 2. 导出为 Excel (.xlsx) 表格
   * 采用标准的 SheetJS 纯前端生成，带走道空列和大标题
   */
  function exportToExcel(groups, title = '班级座位表') {
    if (typeof XLSX === 'undefined') {
      alert('未检测到 Excel 导出库组件，将自动为您导出纯文本 TXT！');
      return exportToTxt(groups, title);
    }

    const filename = `${title}_${getFormattedTimestamp()}.xlsx`;
    const maxRows = Math.max(...groups.map(g => g.rows));

    // 构建二维数组 aoa (Array of Arrays)
    const aoa = [];

    // 计算总列数（包括大组内部列和走廊空列）
    let totalTableCols = 1; // 第1列为排号 "第X排"
    groups.forEach((g, idx) => {
      totalTableCols += g.colCount;
      if (idx < groups.length - 1) {
        totalTableCols += 1; // 走廊空列
      }
    });

    // 构建单元格合并列表
    const merges = [];

    // 第1行：大标题合并所有列
    const rowTitle = [title];
    for (let i = 1; i < totalTableCols; i++) rowTitle.push('');
    aoa.push(rowTitle);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalTableCols - 1 } });

    // 第2行：讲台标示合并所有列
    const rowPodium = ['【 讲 台 / 黑 板 】'];
    for (let i = 1; i < totalTableCols; i++) rowPodium.push('');
    aoa.push(rowPodium);
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: totalTableCols - 1 } });

    // 第3行：空行缓冲
    aoa.push(new Array(totalTableCols).fill(''));

    // 第4行：组名称表头
    const rowGroupNames = ['排次'];
    let currentColIdx = 1;
    groups.forEach((g, gIdx) => {
      rowGroupNames.push(g.groupName || `第 ${gIdx + 1} 组`);
      const startCol = currentColIdx;
      for (let c = 1; c < g.colCount; c++) {
        rowGroupNames.push('');
      }
      const endCol = startCol + g.colCount - 1;
      if (endCol > startCol) {
        merges.push({ s: { r: 3, c: startCol }, e: { r: 3, c: endCol } });
      }
      currentColIdx += g.colCount;

      if (gIdx < groups.length - 1) {
        rowGroupNames.push('[走道]');
        currentColIdx += 1;
      }
    });
    aoa.push(rowGroupNames);

    // 第5行开始：按排输出座位学生 (纯名字，绝不带性别)
    for (let r = 1; r <= maxRows; r++) {
      const rowData = [`第 ${r} 排`];
      groups.forEach((g, gIdx) => {
        for (let c = 0; c < g.colCount; c++) {
          const seat = g.seats.find(s => s.row === r && s.colInGroup === c);
          if (seat && seat.student && seat.student.name) {
            rowData.push(seat.student.name); // 纯名字
          } else {
            rowData.push(''); // 空座
          }
        }
        if (gIdx < groups.length - 1) {
          rowData.push(''); // 走道列留空
        }
      });
      aoa.push(rowData);
    }

    // 底部附加信息 (去掉编制工具字样)
    aoa.push(new Array(totalTableCols).fill(''));
    aoa.push([`导出时间: ${new Date().toLocaleString()}`]);

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // 注入合并规则
    ws['!merges'] = merges;

    // 设置列宽
    const colWidths = [{ wch: 10 }]; // 排次列
    groups.forEach((g, gIdx) => {
      for (let c = 0; c < g.colCount; c++) {
        colWidths.push({ wch: 14 });
      }
      if (gIdx < groups.length - 1) {
        colWidths.push({ wch: 6 }); // 走道较窄
      }
    });
    ws['!cols'] = colWidths;

    // 创建工作簿并下载
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '班级座位表');
    XLSX.writeFile(wb, filename);
    return true;
  }

  /**
   * 3. 导出为 TXT 纯文本
   */
  function generateTxtContent(groups, title = '班级座位表') {
    const maxRows = Math.max(...groups.map(g => g.rows));
    let content = '';
    content += `===========================================================\n`;
    content += `                   ${title}\n`;
    content += `           导出时间: ${new Date().toLocaleString()}\n`;
    content += `===========================================================\n\n`;
    content += `                      【 讲 台 / 黑 板 】\n\n`;

    // 组标题行
    let groupHeader = '         ';
    groups.forEach((g, gIdx) => {
      const gName = (g.groupName || `第${gIdx + 1}组`).padEnd(14, ' ');
      groupHeader += gName + '   |   ';
    });
    content += groupHeader + '\n';
    content += '-'.repeat(70) + '\n';

    // 排行数据
    for (let r = 1; r <= maxRows; r++) {
      let line = `[第${r}排]  `;
      groups.forEach((g, gIdx) => {
        let groupStudents = [];
        for (let c = 0; c < g.colCount; c++) {
          const seat = g.seats.find(s => s.row === r && s.colInGroup === c);
          const name = (seat && seat.student && seat.student.name) ? seat.student.name : '____';
          groupStudents.push(name.padEnd(5, ' '));
        }
        line += groupStudents.join(' ') + '   |   ';
      });
      content += line + '\n';
    }

    content += '\n' + '='.repeat(70) + '\n';
    content += `说明: "____" 表示空座位。\n`;
    return content;
  }

  /**
   * 下载 TXT 文件
   */
  function exportToTxt(groups, title = '班级座位表') {
    const text = generateTxtContent(groups, title);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const filename = `${title}_${getFormattedTimestamp()}.txt`;
    downloadBlob(blob, filename);
    return true;
  }

  /**
   * 复制纯文本到剪贴板
   */
  async function copyTxtToClipboard(groups, title = '班级座位表') {
    const text = generateTxtContent(groups, title);
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  /**
   * 5. 下载学生名单 Excel 导入模板 (标准格式：学号 姓名 性别)
   */
  function downloadStudentTemplateExcel() {
    if (typeof XLSX === 'undefined') {
      return downloadStudentTemplateTxt();
    }
    const data = [
      ['学号', '姓名', '性别'],
      ['01', '张三', '男'],
      ['02', '李思思', '女'],
      ['03', '王嘉尔', '男'],
      ['04', '刘欣欣', '女'],
      ['05', '陈小明', '男'],
      ['06', '赵若曦', '女']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 10 }, { wch: 12 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '学生名单导入模板');
    XLSX.writeFile(wb, '学生名单导入模板.xlsx');
  }

  /**
   * 6. 下载学生名单 TXT 导入模板 (标准格式：学号 姓名 性别)
   */
  function downloadStudentTemplateTxt() {
    const text = "学号 姓名 性别\n01 张三 男\n02 李思思 女\n03 王嘉尔 男\n04 刘欣欣 女\n05 陈小明 男\n06 赵若曦 女\n";
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, '学生名单导入模板.txt');
  }

  /**
   * 7. 打印方向自适应（根据座位表宽高比例动态切换 横向 landscape 或 纵向 portrait）
   */
  function preparePrintOrientation() {
    let styleEl = document.getElementById('dynamic-print-page-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-print-page-style';
      document.head.appendChild(styleEl);
    }

    const paper = document.getElementById('seatingPaper');
    let orientation = 'landscape';
    if (paper) {
      // 测量实际排布的宽高
      const rect = paper.getBoundingClientRect();
      const w = rect.width || paper.scrollWidth || 1000;
      const h = rect.height || paper.scrollHeight || 600;
      
      // 如果高度明显大于宽度（如窄长型布局，通常列数较少但排数特别多）则使用纵向 portrait，
      // 常规多组横排座位表宽大于高，自动采用横向 landscape，保证纸张利用率最高且不溢出
      if (h > w * 1.08) {
        orientation = 'portrait';
      } else {
        orientation = 'landscape';
      }
    }

    styleEl.innerHTML = `@page { size: ${orientation}; margin: 6mm 8mm; }`;
    return orientation;
  }

  /**
   * 8. 调起浏览器打印
   */
  function printChart() {
    preparePrintOrientation();
    window.print();
  }

  return {
    exportToImage,
    exportToExcel,
    exportToTxt,
    copyTxtToClipboard,
    preparePrintOrientation,
    printChart,
    downloadStudentTemplateExcel,
    downloadStudentTemplateTxt
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportUtils;
}
