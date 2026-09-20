/**
 * 座位表排座神器 - 页面主交互控制器 (App Controller)
 * 完整实现小红书排座神器全套规格：
 * 1. 独立全屏小组编辑器 (区域自动分组/手动建组/拖拽移动/批量勾选)
 * 2. 班级数据多存档管理 (保存/加载/删除/导入导出JSON)
 * 3. 个性化显示与双视角切换 (性别/名次/身高/视力/过道/坐标/老师视角)
 * 4. 多种智能排座策略 (男女/同性/成绩/身高/优差互助/视力保护/S型)
 * 5. 灵活布局与高级表达式 (如 2-1-2-1 快速走道布局)
 * 6. 指定步数行列平移
 */

(function() {
  'use strict';

  // 标准示例名单 (48人 高一(3)班，包含学号、姓名、性别、名次、身高、视力)
  const DEMO_STUDENT_TEXT = `01 陈子涵 男 1 172 正常
02 林悦欣 女 2 163 正常
03 张浩宇 男 3 178 正常
04 李梓琪 女 4 159 视力差
05 王嘉尔 男 5 175 正常
06 周雨彤 女 6 164 视力差
07 刘宇航 男 7 182 正常
08 赵思怡 女 8 160 正常
09 孙博文 男 9 168 视力差
10 吴梦婷 女 10 162 正常
11 郑天成 男 11 170 正常
12 徐若曦 女 12 165 正常
13 黄子墨 男 13 174 正常
14 胡艺馨 女 14 158 视力差
15 朱俊熙 男 15 176 正常
16 高晨曦 女 16 166 正常
17 何泽轩 男 17 169 正常
18 郭雨嘉 女 18 161 正常
19 马翊恒 男 19 173 正常
20 罗诗瑶 女 20 167 正常
21 梁嘉铭 男 21 171 正常
22 宋芷涵 女 22 160 正常
23 韩立诚 男 23 177 正常
24 谢安琪 女 24 163 正常
25 唐一诺 男 25 170 正常
26 许梦娇 女 26 159 正常
27 冯宇轩 男 27 175 正常
28 邓语晨 女 28 164 正常
29 曹逸飞 男 29 179 正常
30 彭佳琪 女 30 162 正常
31 曾子轩 男 31 173 正常
32 肖婉仪 女 32 165 正常
33 田浩然 男 33 171 正常
34 董梓萱 女 34 161 正常
35 袁泽宇 男 35 176 正常
36 潘静姝 女 36 157 正常
37 于沐辰 男 37 169 正常
38 蒋怡菲 女 38 166 正常
39 蔡铭浩 男 39 174 正常
40 余思敏 女 40 163 正常
41 杜明哲 男 41 180 正常
42 叶子璇 女 42 160 正常
43 程天乐 男 43 172 正常
44 苏雅丽 女 44 162 正常
45 魏明朗 男 45 177 正常
46 吕欣妍 女 46 165 正常
47 丁浩轩 男 47 170 正常
48 任雅涵 女 48 158 正常`;

  // 应用核心状态
  const state = {
    chartTitle: '三年二班 座位表',
    currentPreset: 'group4_pair',
    layoutConfig: {
      groupCols: [2, 2, 2, 2],
      rows: 6
    },
    groups: [],
    studentsPool: [],       // 从输入解析得到的所有学生
    unassignedStudents: [], // 当前尚未排入座位的学生
    selectedForSwap: null,  // 点击对调选中的座位
    dragSource: null,       // 拖拽源
    history: [],            // 撤销历史栈
    // 显示控制开关
    displaySettings: {
      showGender: true,
      showRank: false,
      showHeight: false,
      showVision: false,
      showCoord: true,
      showAisle: true,
      showTeam: true,
      viewPerspective: 'student' // 'student' (学生视角) | 'teacher' (老师视角)
    },
    // 小组编辑器数据
    cooperativeGroups: [],
    groupEditorViewMode: 'desk' // 'desk' (课桌物理排布) | 'compact' (紧凑清单)
  };

  // 16 种和谐清爽的团队专属主题色彩
  const TEAM_THEMES = [
    { bg: '#f0fdf4', border: '#10b981', text: '#047857', badgeBg: '#d1fae5' }, // 翡翠绿
    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badgeBg: '#dbeafe' }, // 宝石蓝
    { bg: '#f5f3ff', border: '#8b5cf6', text: '#6d28d9', badgeBg: '#ede9fe' }, // 优雅紫
    { bg: '#fff7ed', border: '#f97316', text: '#c2410c', badgeBg: '#ffedd5' }, // 活力橙
    { bg: '#fdf2f8', border: '#ec4899', text: '#be185d', badgeBg: '#fce7f3' }, // 珊瑚粉
    { bg: '#f0fdfa', border: '#14b8a6', text: '#0f766e', badgeBg: '#ccfbf1' }, // 薄荷青
    { bg: '#fefce8', border: '#eab308', text: '#a16207', badgeBg: '#fef9c3' }, // 琥珀黄
    { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c', badgeBg: '#fee2e2' }, // 热情红
    { bg: '#eef2ff', border: '#6366f1', text: '#4338ca', badgeBg: '#e0e7ff' }, // 靛青蓝
    { bg: '#ecfeff', border: '#06b6d4', text: '#0e7490', badgeBg: '#cffafe' }, // 天空青
    { bg: '#fff1f2', border: '#f43f5e', text: '#be123c', badgeBg: '#ffe4e6' }, // 玫瑰红
    { bg: '#faf5ff', border: '#a855f7', text: '#7e22ce', badgeBg: '#f3e8ff' }, // 罗兰紫
    { bg: '#f8fafc', border: '#64748b', text: '#334155', badgeBg: '#e2e8f0' }, // 稳重灰
    { bg: '#f0fdf4', border: '#22c55e', text: '#15803d', badgeBg: '#dcfce7' }, // 鲜绿
    { bg: '#fffbeb', border: '#f59e0b', text: '#b45309', badgeBg: '#fef3c7' }, // 暖金
    { bg: '#fafaf9', border: '#78716c', text: '#44403c', badgeBg: '#e7e5e4' }  // 雅灰
  ];

  function getTeamTheme(index) {
    return TEAM_THEMES[index % TEAM_THEMES.length];
  }

  function findStudentTeam(studentName) {
    if (!state.cooperativeGroups || state.cooperativeGroups.length === 0) return null;
    for (let i = 0; i < state.cooperativeGroups.length; i++) {
      const g = state.cooperativeGroups[i];
      if (g.members && g.members.some(m => m.name === studentName)) {
        return {
          groupId: g.id,
          groupName: g.name,
          shortName: g.name.replace('第', '').replace('小组', '组').trim(),
          groupIndex: i,
          theme: getTeamTheme(i)
        };
      }
    }
    return null;
  }

  // DOM 元素缓存
  let els = {};

  /**
   * 初始化应用
   */
  function init() {
    cacheElements();
    bindEvents();
    loadFromLocalStorage();

    if (state.groups.length === 0) {
      els.classTitleInput.value = '三年二班';
      state.chartTitle = '三年二班 座位表';
      applyPreset('group4_pair', false);
      els.studentTextarea.value = DEMO_STUDENT_TEXT;
      parseStudentInput();
      ArrangeRules.genderPairArrange(state.groups, [...state.studentsPool]);
      refreshUnassignedStudents();
      saveToLocalStorage();
    }

    render();
    showToast('欢迎使用排座神器！可一键切换双视角与全屏小组编辑。');
  }

  /**
   * 缓存 DOM 节点
   */
  function cacheElements() {
    els = {
      classTitleInput: document.getElementById('classTitleInput'),
      chartTitleInput: document.getElementById('chartTitleInput'),
      chartSubtitleDate: document.getElementById('chartSubtitleDate'),
      capacityStats: document.getElementById('capacityStats'),
      seatingContainer: document.getElementById('seatingContainer'),
      seatingPaper: document.getElementById('seatingPaper'),
      dirLeft: document.getElementById('dirLeft'),
      dirRight: document.getElementById('dirRight'),
      unassignedList: document.getElementById('unassignedList'),
      unassignedCount: document.getElementById('unassignedCount'),
      presetCards: document.querySelectorAll('.preset-card'),
      rowCountInput: document.getElementById('rowCountInput'),
      colCountInput: document.getElementById('colCountInput'),
      quickLayoutBtns: document.querySelectorAll('.btn-quick-layout'),
      customLayoutInput: document.getElementById('customLayoutInput'),
      btnApplyLayout: document.getElementById('btnApplyLayout'),
      tabShiftCol: document.getElementById('tabShiftCol'),
      tabShiftRow: document.getElementById('tabShiftRow'),
      shiftTargetLabel: document.getElementById('shiftTargetLabel'),
      shiftTargetInput: document.getElementById('shiftTargetInput'),
      shiftColDirGroup: document.getElementById('shiftColDirGroup'),
      shiftRowDirGroup: document.getElementById('shiftRowDirGroup'),
      btnDirLeft: document.getElementById('btnDirLeft'),
      btnDirRight: document.getElementById('btnDirRight'),
      btnDirBackward: document.getElementById('btnDirBackward'),
      btnDirForward: document.getElementById('btnDirForward'),
      shiftStepInput: document.getElementById('shiftStepInput'),
      btnExecuteShift: document.getElementById('btnExecuteShift'),
      btnRotateRight: document.getElementById('btnRotateRight'),
      btnRotateLeft: document.getElementById('btnRotateLeft'),
      groupCountInput: document.getElementById('groupCountInput'),
      layoutExprInput: document.getElementById('layoutExprInput'),
      btnApplyLayoutExpr: document.getElementById('btnApplyLayoutExpr'),
      studentTextarea: document.getElementById('studentTextarea'),
      totalStudentsStat: document.getElementById('totalStudentsStat'),
      boyCountStat: document.getElementById('boyCountStat'),
      girlCountStat: document.getElementById('girlCountStat'),
      toastContainer: document.getElementById('toastContainer'),
      fileInput: document.getElementById('fileInput'),
      btnSidebarScoreModal: document.getElementById('btnSidebarScoreModal'),
      shiftStepsSelect: document.getElementById('shiftStepsSelect'),
      // 视角与显示开关
      btnPerspectiveToggle: document.getElementById('btnPerspectiveToggle'),
      perspectiveLabel: document.getElementById('perspectiveLabel'),
      chkShowGender: document.getElementById('chkShowGender'),
      chkShowRank: document.getElementById('chkShowRank'),
      chkShowHeight: document.getElementById('chkShowHeight'),
      chkShowVision: document.getElementById('chkShowVision'),
      chkShowCoord: document.getElementById('chkShowCoord'),
      chkShowAisle: document.getElementById('chkShowAisle'),
      chkShowTeam: document.getElementById('chkShowTeam'),
      // 单个学生编辑模态框
      editStudentModal: document.getElementById('editStudentModal'),
      editSeatNo: document.getElementById('editSeatNo'),
      editSeatName: document.getElementById('editSeatName'),
      editSeatGender: document.getElementById('editSeatGender'),
      editSeatRank: document.getElementById('editSeatRank'),
      editSeatHeight: document.getElementById('editSeatHeight'),
      editSeatVision: document.getElementById('editSeatVision'),
      editSeatLocked: document.getElementById('editSeatLocked'),
      saveEditStudentBtn: document.getElementById('saveEditStudentBtn'),
      closeModalBtn: document.getElementById('closeModalBtn'),
      cancelModalBtn: document.getElementById('cancelModalBtn'),
      // 独立全屏小组编辑器
      btnOpenGroupEditor: document.getElementById('btnOpenGroupEditor'),
      fullscreenGroupEditor: document.getElementById('fullscreenGroupEditor'),
      btnCloseGroupEditor: document.getElementById('btnCloseGroupEditor'),
      areaGroupRows: document.getElementById('areaGroupRows'),
      areaGroupCols: document.getElementById('areaGroupCols'),
      btnExecAreaGroup: document.getElementById('btnExecAreaGroup'),
      balanceGroupSize: document.getElementById('balanceGroupSize'),
      btnExecBalancedGroup: document.getElementById('btnExecBalancedGroup'),
      btnApplyGroupToSeating: document.getElementById('btnApplyGroupToSeating'),
      btnViewDesk: document.getElementById('btnViewDesk'),
      btnViewCompact: document.getElementById('btnViewCompact'),
      btnOpenQuickScoreModal: document.getElementById('btnOpenQuickScoreModal'),
      manualGroupNameInput: document.getElementById('manualGroupNameInput'),
      btnCreateEmptyGroup: document.getElementById('btnCreateEmptyGroup'),
      btnClearAllGroups: document.getElementById('btnClearAllGroups'),
      editorGroupCardsGrid: document.getElementById('editorGroupCardsGrid'),
      unassignedGroupPool: document.getElementById('unassignedGroupPool'),
      unassignedGroupCount: document.getElementById('unassignedGroupCount'),
      targetGroupSelect: document.getElementById('targetGroupSelect'),
      btnBatchAddToGroup: document.getElementById('btnBatchAddToGroup'),
      btnSelectAllUnassigned: document.getElementById('btnSelectAllUnassigned'),
      btnExportGroupTxt: document.getElementById('btnExportGroupTxt'),
      btnExportGroupExcel: document.getElementById('btnExportGroupExcel'),
      btnCopyGroupList: document.getElementById('btnCopyGroupList'),
      // 快捷录入成绩模态框
      quickScoreModal: document.getElementById('quickScoreModal'),
      closeQuickScoreModalBtn: document.getElementById('closeQuickScoreModalBtn'),
      cancelQuickScoreBtn: document.getElementById('cancelQuickScoreBtn'),
      applyQuickScoreBtn: document.getElementById('applyQuickScoreBtn'),
      tabScorePaste: document.getElementById('tabScorePaste'),
      tabScoreTable: document.getElementById('tabScoreTable'),
      paneScorePaste: document.getElementById('paneScorePaste'),
      paneScoreTable: document.getElementById('paneScoreTable'),
      pasteScoreTextarea: document.getElementById('pasteScoreTextarea'),
      quickScoreTableBody: document.getElementById('quickScoreTableBody'),
      // 班级存档管理模态框
      btnClassArchive: document.getElementById('btnClassArchive'),
      archiveModal: document.getElementById('archiveModal'),
      saveArchiveNameInput: document.getElementById('saveArchiveNameInput'),
      btnConfirmSaveArchive: document.getElementById('btnConfirmSaveArchive'),
      archiveListContainer: document.getElementById('archiveListContainer'),
      btnExportJsonFile: document.getElementById('btnExportJsonFile'),
      btnImportJsonFile: document.getElementById('btnImportJsonFile'),
      jsonFileInput: document.getElementById('jsonFileInput'),
      closeArchiveModalBtn: document.getElementById('closeArchiveModalBtn'),
      cancelArchiveModalBtn: document.getElementById('cancelArchiveModalBtn')
    };
  }

  /**
   * 事件绑定
   */
  function bindEvents() {
    // 1. 班级名称双向联动
    if (els.classTitleInput) {
      els.classTitleInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        state.chartTitle = val ? `${val} 座位表` : '班级座位表';
        if (els.chartTitleInput) els.chartTitleInput.value = state.chartTitle;
        saveToLocalStorage();
      });
    }

    if (els.chartTitleInput) {
      els.chartTitleInput.addEventListener('input', (e) => {
        state.chartTitle = e.target.value;
        saveToLocalStorage();
      });
    }

    // 2. 快速布局与自定义布局设置 (严格契合小红书 buju.jpg)
    let currentLayoutExpr = '2-2-2-2';

    const applyLayoutByExpr = (exprStr, customRows = null) => {
      const cols = SeatLayout.parseLayoutExpression(exprStr);
      if (!cols) {
        showToast('布局表达式格式错误，请输入如 2-3-2 或 2-1-2-1', 'error');
        return false;
      }
      const rows = customRows !== null ? customRows : (parseInt(els.rowCountInput ? els.rowCountInput.value : '6', 10) || 6);
      const totalCols = cols.reduce((a, b) => a + b, 0);

      pushHistory();
      state.currentPreset = exprStr;
      currentLayoutExpr = exprStr;
      state.layoutConfig.groupCols = cols;
      state.layoutConfig.rows = rows;

      if (els.rowCountInput) els.rowCountInput.value = rows;
      if (els.colCountInput) els.colCountInput.value = totalCols;
      if (els.customLayoutInput) els.customLayoutInput.value = exprStr;

      // 同步高亮快速布局预设按钮
      if (els.quickLayoutBtns) {
        els.quickLayoutBtns.forEach(btn => {
          if (btn.getAttribute('data-layout') === exprStr) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }

      rebuildGridPreservingStudents();
      render();
      saveToLocalStorage();
      showToast(`已应用布局：${rows}排 × ${totalCols}列 (${cols.join('-')})`);
      return true;
    };

    // 快速布局按钮一键应用 (buju.jpg)
    if (els.quickLayoutBtns) {
      els.quickLayoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const layoutStr = btn.getAttribute('data-layout');
          applyLayoutByExpr(layoutStr);
        });
      });
    }

    // 应用布局大按钮
    if (els.btnApplyLayout) {
      els.btnApplyLayout.addEventListener('click', () => {
        const expr = els.customLayoutInput ? els.customLayoutInput.value.trim() : '';
        const rows = parseInt(els.rowCountInput ? els.rowCountInput.value : '6', 10) || 6;
        if (expr) {
          applyLayoutByExpr(expr, rows);
        } else {
          const colsCount = parseInt(els.colCountInput ? els.colCountInput.value : '8', 10) || 8;
          let generatedCols = [];
          if (colsCount % 2 === 0) {
            generatedCols = new Array(colsCount / 2).fill(2);
          } else {
            generatedCols = [2, 3, 2];
            while (generatedCols.reduce((a, b) => a + b, 0) < colsCount) generatedCols.push(2);
          }
          applyLayoutByExpr(generatedCols.join('-'), rows);
        }
      });
    }

    // 行数微调
    if (els.rowCountInput) {
      els.rowCountInput.addEventListener('change', () => {
        const rows = parseInt(els.rowCountInput.value, 10);
        if (rows >= 1 && rows <= 15) {
          const expr = els.customLayoutInput && els.customLayoutInput.value.trim() ? els.customLayoutInput.value.trim() : currentLayoutExpr;
          applyLayoutByExpr(expr, rows);
        }
      });
    }

    // 列数微调
    if (els.colCountInput) {
      els.colCountInput.addEventListener('change', () => {
        const targetCols = parseInt(els.colCountInput.value, 10);
        if (targetCols >= 1 && targetCols <= 20) {
          let matched = null;
          if (els.quickLayoutBtns) {
            els.quickLayoutBtns.forEach(b => {
              const l = b.getAttribute('data-layout');
              const sum = l.split('-').map(Number).reduce((a, b) => a + b, 0);
              if (sum === targetCols && !matched) matched = l;
            });
          }
          if (matched) {
            applyLayoutByExpr(matched);
          } else {
            const gCount = Math.floor(targetCols / 2);
            const remainder = targetCols % 2;
            const newCols = new Array(gCount).fill(2);
            if (remainder > 0) newCols.push(remainder);
            applyLayoutByExpr(newCols.join('-'));
          }
        }
      });
    }

    // 5. 显示开关监听
    const bindCheck = (el, key) => {
      if (el) {
        el.addEventListener('change', (e) => {
          state.displaySettings[key] = e.target.checked;
          render();
          saveToLocalStorage();
        });
      }
    };
    bindCheck(els.chkShowGender, 'showGender');
    bindCheck(els.chkShowRank, 'showRank');
    bindCheck(els.chkShowHeight, 'showHeight');
    bindCheck(els.chkShowVision, 'showVision');
    bindCheck(els.chkShowCoord, 'showCoord');
    bindCheck(els.chkShowAisle, 'showAisle');
    bindCheck(els.chkShowTeam, 'showTeam');

    // 6. 视角切换 (学生视角 ⇋ 老师视角)
    if (els.btnPerspectiveToggle) {
      els.btnPerspectiveToggle.addEventListener('click', () => {
        state.displaySettings.viewPerspective = (state.displaySettings.viewPerspective === 'student') ? 'teacher' : 'student';
        const isTeacher = state.displaySettings.viewPerspective === 'teacher';
        els.perspectiveLabel.textContent = isTeacher ? '老师视角 (讲台在下)' : '学生视角 (看黑板)';
        render();
        saveToLocalStorage();
        showToast(`已切换为【${isTeacher ? '老师视角' : '学生视角'}】`);
      });
    }

    // 7. 学生名单输入解析与拖拽
    els.studentTextarea.addEventListener('input', () => {
      parseStudentInput();
      updateStudentStats();
    });

    els.studentTextarea.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.studentTextarea.style.borderColor = '#3b82f6';
      els.studentTextarea.style.backgroundColor = '#eff6ff';
    });
    els.studentTextarea.addEventListener('dragleave', () => {
      els.studentTextarea.style.borderColor = '';
      els.studentTextarea.style.backgroundColor = '';
    });
    els.studentTextarea.addEventListener('drop', (e) => {
      e.preventDefault();
      els.studentTextarea.style.borderColor = '';
      els.studentTextarea.style.backgroundColor = '';
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileImport(e.dataTransfer.files[0]);
      }
    });

    const btnImportFile = document.getElementById('btnImportFile');
    if (btnImportFile && els.fileInput) {
      btnImportFile.addEventListener('click', () => {
        els.fileInput.value = '';
        els.fileInput.click();
      });
      els.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFileImport(e.target.files[0]);
        }
      });
    }

    // 8. 示例数据与模板下载
    const fillDemoBtn = document.getElementById('fillDemoBtn');
    if (fillDemoBtn) {
      fillDemoBtn.addEventListener('click', () => {
        pushHistory();
        els.studentTextarea.value = DEMO_STUDENT_TEXT;
        parseStudentInput();
        updateStudentStats();
        showToast('已加载完整示例名单 (学号 姓名 性别 名次 身高 视力)！');
      });
    }

    const btnDownloadExcelTpl = document.getElementById('btnDownloadExcelTpl');
    if (btnDownloadExcelTpl) {
      btnDownloadExcelTpl.addEventListener('click', () => {
        ExportUtils.downloadStudentTemplateExcel();
        showToast('已下载学生名单 Excel 导入模板');
      });
    }
    const btnDownloadTxtTpl = document.getElementById('btnDownloadTxtTpl');
    if (btnDownloadTxtTpl) {
      btnDownloadTxtTpl.addEventListener('click', () => {
        ExportUtils.downloadStudentTemplateTxt();
        showToast('已下载学生名单 TXT 导入模板');
      });
    }

    document.getElementById('clearStudentsBtn').addEventListener('click', () => {
      if (confirm('确定要清空名单输入框吗？')) {
        pushHistory();
        els.studentTextarea.value = '';
        state.studentsPool = [];
        updateStudentStats();
        refreshUnassignedStudents();
      }
    });

    // 9. 智能排座策略绑定
    const runArrangeStrategy = (fnName, toastMsg, ...args) => {
      pushHistory();
      const allToArrange = collectAllAvailableStudents();
      const remain = ArrangeRules[fnName](state.groups, allToArrange, ...args);
      state.unassignedStudents = remain;
      render();
      saveToLocalStorage();
      showToast(toastMsg);
    };

    document.getElementById('btnRandomArrange').addEventListener('click', () => {
      runArrangeStrategy('randomArrange', '已完成【完全随机排座】！');
    });

    document.getElementById('btnGenderPair').addEventListener('click', () => {
      runArrangeStrategy('genderPairArrange', '已完成【男女同桌排座】(一男一女搭档)！');
    });

    document.getElementById('btnSameGenderPair').addEventListener('click', () => {
      runArrangeStrategy('sameGenderPairArrange', '已完成【同性同桌排座】(男男/女女同桌)！');
    });

    document.getElementById('btnSnakeArrange').addEventListener('click', () => {
      runArrangeStrategy('snakeArrange', '已完成【S型蛇形折返排座】！');
    });

    document.getElementById('btnScoreRankArrange').addEventListener('click', () => {
      runArrangeStrategy('scoreRankArrange', '已按【成绩/名次高低】完成排座！', true);
    });

    document.getElementById('btnHeightArrange').addEventListener('click', () => {
      runArrangeStrategy('heightArrange', '已按【身高由矮到高】从前到后排座！');
    });

    document.getElementById('btnPeerHelpArrange').addEventListener('click', () => {
      runArrangeStrategy('peerHelpArrange', '已完成【优差互助同桌搭配】(结对帮扶)！');
    });

    document.getElementById('btnVisionProtectArrange').addEventListener('click', () => {
      runArrangeStrategy('visionProtectArrange', '已完成【视力优先保护排座】(视力差者优先排在前排正中)！');
    });

    document.getElementById('btnSequentialArrange').addEventListener('click', () => {
      runArrangeStrategy('sequentialArrange', '已按名单顺序从前到后排入！');
    });

    // 10. 座位平移交互系统 (严格契合小红书 buju.jpg 规格)
    let currentShiftType = 'col'; // 'col' | 'row'
    let currentColDir = 'right';  // 'left' | 'right'
    let currentRowDir = 'backward'; // 'backward' | 'forward'

    /**
     * 智能解析平移目标 (支持 "1 2 3"、"1-3"、"1~3"、"第一排"、"第1列"、"1组"、"第一组")
     */
    function parseShiftTarget(inputStr, type, groups) {
      if (!inputStr || typeof inputStr !== 'string') return null;
      let s = inputStr.trim();
      if (!s) return null;

      // 针对大组指定 (如 "1组", "第一大组", "1 2组")
      if (type === 'col' && (s.includes('组') || s.includes('大组'))) {
        const chMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8 };
        for (const [ch, num] of Object.entries(chMap)) {
          s = s.replace(new RegExp(ch, 'g'), String(num));
        }
        const groupNums = [];
        const gMatches = s.match(/\d+/g) || [];
        gMatches.forEach(gn => {
          const gIdx = parseInt(gn, 10) - 1;
          if (groups[gIdx] && groups[gIdx].seats) {
            groups[gIdx].seats.forEach(seat => {
              if (seat.globalCol) groupNums.push(seat.globalCol);
            });
          }
        });
        if (groupNums.length > 0) return [...new Set(groupNums)].sort((a, b) => a - b);
      }

      // 中文数字转阿拉伯数字 (如 第一排 -> 第1排)
      const chMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10 };
      for (const [ch, num] of Object.entries(chMap)) {
        s = s.replace(new RegExp(ch, 'g'), String(num));
      }

      // 展开连续范围 (如 1-3, 1~3, 1到3, 1至3, 第1排到第3排)
      s = s.replace(/(\d+)\s*[排列组号]?\s*[-~至到及与、和~]+\s*[第]?\s*(\d+)/g, (_, start, end) => {
        const st = parseInt(start, 10);
        const ed = parseInt(end, 10);
        const res = [];
        const step = st <= ed ? 1 : -1;
        for (let i = st; st <= ed ? i <= ed : i >= ed; i += step) {
          res.push(i);
        }
        return res.join(' ');
      });

      const nums = (s.match(/\d+/g) || []).map(Number).filter(n => n > 0);
      return nums.length > 0 ? [...new Set(nums)].sort((a, b) => a - b) : null;
    }

    if (els.tabShiftCol && els.tabShiftRow) {
      els.tabShiftCol.addEventListener('click', () => {
        currentShiftType = 'col';
        els.tabShiftCol.classList.add('active');
        els.tabShiftRow.classList.remove('active');
        if (els.shiftTargetLabel) els.shiftTargetLabel.textContent = '列号, 如: 1 2 3';
        if (els.shiftTargetInput) els.shiftTargetInput.placeholder = '留空默认全部列，或输入: 1 2 3 (如 1 或 1-3)';
        if (els.shiftColDirGroup) els.shiftColDirGroup.style.display = 'flex';
        if (els.shiftRowDirGroup) els.shiftRowDirGroup.style.display = 'none';
        currentColDir = els.shiftColDirGroup?.querySelector('.btn-shift-dir.active')?.dataset.dir || 'right';
      });

      els.tabShiftRow.addEventListener('click', () => {
        currentShiftType = 'row';
        els.tabShiftRow.classList.add('active');
        els.tabShiftCol.classList.remove('active');
        if (els.shiftTargetLabel) els.shiftTargetLabel.textContent = '行号, 如: 1 2 3 (或第1排)';
        if (els.shiftTargetInput) els.shiftTargetInput.placeholder = '留空默认全部行，或输入: 1 2 3 (如 1 或 1-3，或第1排)';
        if (els.shiftRowDirGroup) els.shiftRowDirGroup.style.display = 'flex';
        if (els.shiftColDirGroup) els.shiftColDirGroup.style.display = 'none';
        currentRowDir = els.shiftRowDirGroup?.querySelector('.btn-shift-dir.active')?.dataset.dir || 'backward';
      });
    }

    // 通用平移执行函数 (方向按钮与大按钮均可一键触发)
    const triggerShift = (forceType = null, forceDir = null) => {
      pushHistory();
      const type = forceType || currentShiftType;
      const steps = parseInt(els.shiftStepInput ? els.shiftStepInput.value : '1', 10) || 1;
      const targetStr = els.shiftTargetInput ? els.shiftTargetInput.value.trim() : '';
      const numbers = parseShiftTarget(targetStr, type, state.groups);

      if (type === 'col') {
        const dir = forceDir || currentColDir;
        ArrangeRules.shiftColumns(state.groups, numbers, dir, steps);
        const targetDesc = numbers && numbers.length > 0 ? `第 ${numbers.join('、')} 列` : '全班所有列';
        const dirDesc = dir === 'right' ? '向右' : '向左';
        showToast(`已执行【${targetDesc} ${dirDesc}平移 ${steps} 步】`);
      } else {
        const dir = forceDir || currentRowDir;
        ArrangeRules.shiftRows(state.groups, numbers, dir, steps);
        const targetDesc = numbers && numbers.length > 0 ? `第 ${numbers.join('、')} 行` : '全班所有行';
        const dirDesc = dir === 'forward' ? '向前' : '向后';
        showToast(`已执行【${targetDesc} ${dirDesc}平移 ${steps} 步】`);
      }

      render();
      saveToLocalStorage();
    };

    // 列平移方向按钮：切换高亮并立即执行平移
    if (els.btnDirLeft && els.btnDirRight) {
      els.btnDirLeft.addEventListener('click', () => {
        currentColDir = 'left';
        els.btnDirLeft.classList.add('active');
        els.btnDirRight.classList.remove('active');
        triggerShift('col', 'left');
      });
      els.btnDirRight.addEventListener('click', () => {
        currentColDir = 'right';
        els.btnDirRight.classList.add('active');
        els.btnDirLeft.classList.remove('active');
        triggerShift('col', 'right');
      });
    }

    // 行平移方向按钮：切换高亮并立即执行平移
    if (els.btnDirBackward && els.btnDirForward) {
      els.btnDirBackward.addEventListener('click', () => {
        currentRowDir = 'backward';
        els.btnDirBackward.classList.add('active');
        els.btnDirForward.classList.remove('active');
        triggerShift('row', 'backward');
      });
      els.btnDirForward.addEventListener('click', () => {
        currentRowDir = 'forward';
        els.btnDirForward.classList.add('active');
        els.btnDirBackward.classList.remove('active');
        triggerShift('row', 'forward');
      });
    }

    // 执行平移大按钮 (buju.jpg 橙色按钮)
    if (els.btnExecuteShift) {
      els.btnExecuteShift.addEventListener('click', () => {
        triggerShift();
      });
    }

    // 每周大组向右/向左轮换
    if (els.btnRotateRight) {
      els.btnRotateRight.addEventListener('click', () => {
        pushHistory();
        ArrangeRules.rotateGroups(state.groups, 'right');
        render();
        saveToLocalStorage();
        showToast('已执行【每周大组向右轮换】');
      });
    }

    if (els.btnRotateLeft) {
      els.btnRotateLeft.addEventListener('click', () => {
        pushHistory();
        ArrangeRules.rotateGroups(state.groups, 'left');
        render();
        saveToLocalStorage();
        showToast('已执行【每周大组向左轮换】');
      });
    }

    // 11. 清空与撤销
    document.getElementById('btnClearSeats').addEventListener('click', () => {
      if (confirm('确定要清空所有未锁定的座位吗？')) {
        pushHistory();
        state.groups.forEach(g => {
          g.seats.forEach(s => {
            if (s.student && !s.student.locked) {
              s.student = null;
            }
          });
        });
        refreshUnassignedStudents();
        render();
        saveToLocalStorage();
        showToast('已清空未锁定座位');
      }
    });

    document.getElementById('btnUndo').addEventListener('click', undo);

    // 12. 导出
    document.getElementById('btnExportImage').addEventListener('click', async () => {
      showToast('正在生成高清图片，请稍候...');
      await ExportUtils.exportToImage(els.seatingPaper, state.chartTitle);
      showToast('座位表图片导出成功！');
    });

    document.getElementById('btnExportExcel').addEventListener('click', () => {
      ExportUtils.exportToExcel(state.groups, state.chartTitle);
      showToast('座位表 Excel 文件已导出！');
    });

    document.getElementById('btnCopyTxt').addEventListener('click', async () => {
      await ExportUtils.copyTxtToClipboard(state.groups, state.chartTitle);
      showToast('座位表纯文本已复制到剪贴板！');
    });

    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        ExportUtils.printChart();
      });
    }

    // 监听全局打印事件(包括 Ctrl+P)，自适应横纵向
    window.addEventListener('beforeprint', () => {
      if (typeof ExportUtils !== 'undefined' && ExportUtils.preparePrintOrientation) {
        ExportUtils.preparePrintOrientation();
      }
    });

    // 13. 编辑学生模态框
    if (els.saveEditStudentBtn) els.saveEditStudentBtn.addEventListener('click', saveEditStudentModal);
    if (els.closeModalBtn) els.closeModalBtn.addEventListener('click', closeModal);
    if (els.cancelModalBtn) els.cancelModalBtn.addEventListener('click', closeModal);
    if (els.editStudentModal) {
      els.editStudentModal.addEventListener('click', (e) => {
        if (e.target === els.editStudentModal) closeModal();
      });
    }

    // 14. 独立全屏小组编辑器绑定
    if (els.btnOpenGroupEditor) {
      els.btnOpenGroupEditor.addEventListener('click', openFullscreenGroupEditor);
    }
    if (els.btnCloseGroupEditor) {
      els.btnCloseGroupEditor.addEventListener('click', () => {
        els.fullscreenGroupEditor.classList.remove('show');
      });
    }
    if (els.btnExecAreaGroup) {
      els.btnExecAreaGroup.addEventListener('click', () => {
        const rows = parseInt(els.areaGroupRows.value, 10) || 2;
        const cols = parseInt(els.areaGroupCols.value, 10) || 2;
        state.cooperativeGroups = ArrangeRules.autoAreaGroup(state.groups, rows, cols);
        renderGroupEditor();
        renderSeatingChart();
        showToast(`已按 ${rows}行×${cols}列 完成区域自动分组！`);
      });
    }
    if (els.btnExecBalancedGroup) {
      els.btnExecBalancedGroup.addEventListener('click', () => {
        const size = parseInt(els.balanceGroupSize ? els.balanceGroupSize.value : '4', 10) || 4;
        const allSeatStudents = [];
        SeatLayout.getAllSeatsFlat(state.groups).forEach(s => {
          if (s.student) allSeatStudents.push(s.student);
        });
        const pool = allSeatStudents.length > 0 ? allSeatStudents : state.studentsPool;
        if (!pool || pool.length === 0) {
          showToast('当前没有可用学生名单，请先导入或录入学生！', 'warning');
          return;
        }
        pushHistory();
        state.cooperativeGroups = ArrangeRules.serpentineBalancedGroup(pool, size, 2, 2);
        renderGroupEditor();
        renderSeatingChart();
        saveToLocalStorage();
        showToast(`已按【成绩/名次 S型蛇形轮转】完成优差互助分组！共分为 ${state.cooperativeGroups.length} 个小组，各组均分高度平衡。`);
      });
    }
    if (els.btnApplyGroupToSeating) {
      els.btnApplyGroupToSeating.addEventListener('click', () => {
        if (!state.cooperativeGroups || state.cooperativeGroups.length === 0) {
          showToast('当前尚未划分小组，请先点击上方按钮进行分组！', 'warning');
          return;
        }
        pushHistory();
        const success = ArrangeRules.applyTeamsToSeats(state.groups, state.cooperativeGroups, 2, 2);
        if (success) {
          render();
          saveToLocalStorage();
          showToast('已成功将各合作小组直接排入班级座位表中！同组学生已紧密围坐在一起。');
        } else {
          showToast('应用到班级座位表失败，请检查座位容量！', 'error');
        }
      });
    }
    if (els.btnViewDesk && els.btnViewCompact) {
      els.btnViewDesk.addEventListener('click', () => {
        state.groupEditorViewMode = 'desk';
        renderGroupEditor();
      });
      els.btnViewCompact.addEventListener('click', () => {
        state.groupEditorViewMode = 'compact';
        renderGroupEditor();
      });
    }
    // 快捷录入成绩模态框事件 (支持侧边栏与独立小组编辑器触发)
    if (els.btnOpenQuickScoreModal) {
      els.btnOpenQuickScoreModal.addEventListener('click', openQuickScoreModal);
    }
    if (els.btnSidebarScoreModal) {
      els.btnSidebarScoreModal.addEventListener('click', openQuickScoreModal);
    }
    if (els.closeQuickScoreModalBtn) {
      els.closeQuickScoreModalBtn.addEventListener('click', () => els.quickScoreModal.classList.remove('show'));
    }
    if (els.cancelQuickScoreBtn) {
      els.cancelQuickScoreBtn.addEventListener('click', () => els.quickScoreModal.classList.remove('show'));
    }
    if (els.quickScoreModal) {
      els.quickScoreModal.addEventListener('click', (e) => {
        if (e.target === els.quickScoreModal) els.quickScoreModal.classList.remove('show');
      });
    }
    if (els.tabScorePaste && els.tabScoreTable) {
      els.tabScorePaste.addEventListener('click', () => switchScoreTab('paste'));
      els.tabScoreTable.addEventListener('click', () => switchScoreTab('table'));
    }
    if (els.applyQuickScoreBtn) {
      els.applyQuickScoreBtn.addEventListener('click', handleSaveQuickScores);
    }
    if (els.btnCreateEmptyGroup) {
      els.btnCreateEmptyGroup.addEventListener('click', () => {
        const name = els.manualGroupNameInput.value.trim() || `第 ${state.cooperativeGroups.length + 1} 小组`;
        state.cooperativeGroups.push({
          id: `group_${Date.now()}`,
          name: name,
          members: []
        });
        els.manualGroupNameInput.value = '';
        renderGroupEditor();
        renderSeatingChart();
        showToast(`已新建【${name}】`);
      });
    }
    if (els.btnClearAllGroups) {
      els.btnClearAllGroups.addEventListener('click', () => {
        if (confirm('确定要清空/解散所有小组吗？所有学生将回到未分组池。')) {
          state.cooperativeGroups = [];
          renderGroupEditor();
          renderSeatingChart();
          showToast('已解散所有小组');
        }
      });
    }
    if (els.btnBatchAddToGroup) {
      els.btnBatchAddToGroup.addEventListener('click', batchAddSelectedToGroup);
    }
    if (els.btnSelectAllUnassigned) {
      els.btnSelectAllUnassigned.addEventListener('click', () => {
        const checkboxes = els.unassignedGroupPool.querySelectorAll('input[type="checkbox"]');
        const allChecked = Array.from(checkboxes).every(c => c.checked);
        checkboxes.forEach(c => c.checked = !allChecked);
      });
    }
    if (els.btnCopyGroupList) {
      els.btnCopyGroupList.addEventListener('click', copyCooperativeGroupText);
    }
    if (els.btnExportGroupTxt) {
      els.btnExportGroupTxt.addEventListener('click', exportGroupTxtFile);
    }
    if (els.btnExportGroupExcel) {
      els.btnExportGroupExcel.addEventListener('click', exportGroupExcelFile);
    }

    // 15. 班级多存档管理绑定
    if (els.btnClassArchive) {
      els.btnClassArchive.addEventListener('click', openArchiveModal);
    }
    if (els.closeArchiveModalBtn) els.closeArchiveModalBtn.addEventListener('click', () => els.archiveModal.classList.remove('show'));
    if (els.cancelArchiveModalBtn) els.cancelArchiveModalBtn.addEventListener('click', () => els.archiveModal.classList.remove('show'));
    if (els.btnConfirmSaveArchive) els.btnConfirmSaveArchive.addEventListener('click', handleSaveCurrentArchive);
    if (els.btnExportJsonFile) els.btnExportJsonFile.addEventListener('click', exportAllArchivesJson);
    if (els.btnImportJsonFile) {
      els.btnImportJsonFile.addEventListener('click', () => {
        els.jsonFileInput.value = '';
        els.jsonFileInput.click();
      });
      els.jsonFileInput.addEventListener('change', handleImportJsonFile);
    }
  }

  /**
   * 智能分词解析学生单行 (支持学号、姓名、性别、成绩名次、身高、视力)
   */
  function parseSingleStudentLine(lineStr, fallbackIndex) {
    const trimmed = lineStr.trim();
    if (!trimmed) return null;

    const tokens = trimmed.split(/[\t\s,，;；]+/).filter(t => t.length > 0);
    if (tokens.length === 0) return null;

    let no = '';
    let name = '';
    let gender = 'unknown';
    let rank = null;
    let height = null;
    let vision = 'normal';

    function checkGender(s) {
      const l = s.toLowerCase();
      if (l === '男' || l === 'boy' || l === 'm' || l === '男生') return 'boy';
      if (l === '女' || l === 'girl' || l === 'f' || l === '女生') return 'girl';
      return null;
    }

    function isPureDigits(s) { return /^[0-9]+$/.test(s); }

    // 提取视力
    const remainingTokens = [];
    tokens.forEach(tok => {
      if (tok.includes('近视') || tok.includes('视力差') || tok.includes('前排') || tok.includes('弱')) {
        vision = 'poor';
      } else if (tok === '正常' || tok.includes('视力正常')) {
        vision = 'normal';
      } else {
        remainingTokens.push(tok);
      }
    });

    // 提取性别
    let genderIdx = -1;
    for (let i = 0; i < remainingTokens.length; i++) {
      const g = checkGender(remainingTokens[i]);
      if (g) {
        gender = g;
        genderIdx = i;
        break;
      }
    }
    const nonGenderTokens = remainingTokens.filter((_, idx) => idx !== genderIdx);

    // 提取带单位的分数/名次/身高
    const nonUnitTokens = [];
    nonGenderTokens.forEach(tok => {
      const scoreMatch = tok.match(/^#?(\d+(\.\d+)?)(分|pts)?$/i);
      const heightMatch = tok.match(/^(\d+(\.\d+)?)(cm|厘米)$/i);
      if (heightMatch && height === null) {
        height = Math.round(parseFloat(heightMatch[1]));
      } else if (scoreMatch && rank === null && (tok.includes('分') || tok.startsWith('#'))) {
        rank = Math.round(parseFloat(scoreMatch[1]));
      } else {
        nonUnitTokens.push(tok);
      }
    });

    // 提取学号、姓名、身高、名次
    const numericList = [];
    const textList = [];

    nonUnitTokens.forEach(tok => {
      if (isPureDigits(tok)) {
        numericList.push(parseInt(tok, 10));
      } else {
        textList.push(tok);
      }
    });

    // 文本部分为姓名
    name = textList.join('') || `学生${fallbackIndex}`;

    // 处理数字部分：区分学号、名次、身高
    numericList.forEach((num, idx) => {
      if (num >= 120 && num <= 220 && height === null) {
        height = num; // 身高通常在 120 ~ 220 cm
      } else if (idx === 0 && no === '') {
        no = String(num).padStart(2, '0');
      } else if (rank === null) {
        rank = num;
      }
    });

    if (!no) no = String(fallbackIndex).padStart(2, '0');

    return {
      id: `stu_${no}_${fallbackIndex}_${Date.now()}`,
      no: no,
      name: name,
      gender: gender,
      rank: rank,
      height: height,
      vision: vision,
      locked: false
    };
  }

  /**
   * 解析名单输入
   */
  function parseStudentInput() {
    const raw = els.studentTextarea.value.trim();
    if (!raw) {
      state.studentsPool = [];
      updateStudentStats();
      return;
    }

    const lines = raw.split(/[\r\n]+/);
    const parsed = [];

    lines.forEach((l, idx) => {
      const s = parseSingleStudentLine(l, idx + 1);
      if (s) parsed.push(s);
    });

    state.studentsPool = parsed;
    refreshUnassignedStudents();
    updateStudentStats();
  }

  /**
   * 统计人数 (男女统计 100% 精确)
   */
  function updateStudentStats() {
    const total = state.studentsPool.length;
    const boys = state.studentsPool.filter(s => s.gender === 'boy').length;
    const girls = state.studentsPool.filter(s => s.gender === 'girl').length;

    els.totalStudentsStat.textContent = total;
    els.boyCountStat.textContent = boys;
    els.girlCountStat.textContent = girls;

    const capacity = SeatLayout.calculateTotalCapacity(state.layoutConfig);
    els.capacityStats.textContent = `当前座位容量: ${capacity} 座 / 名单人数: ${total} 人`;
  }

  /**
   * 处理文件导入 (.xlsx, .xls, .csv, .txt)
   */
  function handleFileImport(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');
    const isTxt = name.endsWith('.txt');

    if (isExcel) {
      if (typeof XLSX === 'undefined') {
        showToast('Excel 解析库未就绪，请选择 TXT 导入', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          parseImportedExcelRows(rows);
        } catch (err) {
          console.error(err);
          showToast('读取表格文件失败，请确保文件格式规范', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (isTxt) {
      const reader = new FileReader();
      reader.onload = function(e) {
        pushHistory();
        els.studentTextarea.value = e.target.result;
        parseStudentInput();
        showToast(`成功从 TXT 导入 ${state.studentsPool.length} 位学生！`);
      };
      reader.readAsText(file, 'utf-8');
    } else {
      showToast('仅支持导入 .xlsx, .xls, .csv 或 .txt 格式文件！', 'error');
    }
  }

  function parseImportedExcelRows(rows) {
    if (!rows || rows.length === 0) {
      showToast('导入的表格内容为空！', 'error');
      return;
    }

    let startRow = 0;
    let noCol = -1, nameCol = 0, genderCol = 1, rankCol = -1, heightCol = -1, visionCol = -1;

    const firstRow = rows[0] || [];
    let hasHeader = false;
    firstRow.forEach((cell, idx) => {
      const str = String(cell || '').trim();
      if (str.includes('学号') || str.includes('序号')) { noCol = idx; hasHeader = true; }
      else if (str.includes('姓名') || str.includes('名字')) { nameCol = idx; hasHeader = true; }
      else if (str.includes('性别')) { genderCol = idx; hasHeader = true; }
      else if (str.includes('成绩') || str.includes('名次') || str.includes('分数') || str.includes('得分') || str.includes('总分') || str.includes('排名')) { rankCol = idx; hasHeader = true; }
      else if (str.includes('身高')) { heightCol = idx; hasHeader = true; }
      else if (str.includes('视力')) { visionCol = idx; hasHeader = true; }
    });

    if (hasHeader) startRow = 1;

    const lines = [];
    for (let i = startRow; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length === 0) continue;
      const name = r[nameCol] ? String(r[nameCol]).trim() : '';
      if (!name) continue;

      const no = (noCol >= 0 && r[noCol]) ? String(r[noCol]).trim() : String(i).padStart(2, '0');
      const gender = (genderCol >= 0 && r[genderCol]) ? String(r[genderCol]).trim() : '';
      const rank = (rankCol >= 0 && r[rankCol]) ? String(r[rankCol]).trim() : '';
      const height = (heightCol >= 0 && r[heightCol]) ? String(r[heightCol]).trim() : '';
      const vision = (visionCol >= 0 && r[visionCol]) ? String(r[visionCol]).trim() : '';

      let itemStr = `${no} ${name}`;
      if (gender) itemStr += ` ${gender}`;
      if (rank) itemStr += ` ${rank}`;
      if (height) itemStr += ` ${height}`;
      if (vision) itemStr += ` ${vision}`;
      lines.push(itemStr);
    }

    if (lines.length > 0) {
      pushHistory();
      els.studentTextarea.value = lines.join('\n');
      parseStudentInput();
      showToast(`成功从 Excel 表格导入 ${lines.length} 位学生！`);
    } else {
      showToast('未在表格中找到有效的姓名数据！', 'error');
    }
  }

  function collectAllAvailableStudents() {
    const lockedStudentNames = new Set();
    state.groups.forEach(g => {
      g.seats.forEach(s => {
        if (s.student && s.student.locked) lockedStudentNames.add(s.student.name);
      });
    });

    let candidates = state.studentsPool.filter(s => !lockedStudentNames.has(s.name));
    if (candidates.length === 0) {
      state.groups.forEach(g => {
        g.seats.forEach(s => {
          if (s.student && !s.student.locked) candidates.push({ ...s.student });
        });
      });
    }
    return candidates;
  }

  function refreshUnassignedStudents() {
    const assignedNames = new Set();
    state.groups.forEach(g => {
      g.seats.forEach(s => {
        if (s.student && s.student.name) assignedNames.add(s.student.name);
      });
    });
    state.unassignedStudents = state.studentsPool.filter(s => !assignedNames.has(s.name));
    renderUnassignedPool();
  }

  function applyPreset(presetId, doRender = true) {
    const preset = SeatLayout.PRESETS[presetId];
    if (!preset) return;

    pushHistory();
    state.currentPreset = presetId;
    state.layoutConfig.groupCols = [...preset.groupCols];
    state.layoutConfig.rows = preset.defaultRows;

    els.rowCountInput.value = preset.defaultRows;
    if (els.groupCountInput) els.groupCountInput.value = preset.groupCols.length;
    if (els.layoutExprInput) els.layoutExprInput.value = preset.groupCols.join('-');

    els.presetCards.forEach(c => {
      if (c.getAttribute('data-preset') === presetId) c.classList.add('active');
      else c.classList.remove('active');
    });

    rebuildGridPreservingStudents();

    if (doRender) {
      render();
      saveToLocalStorage();
      showToast(`已切换为：${preset.name}`);
    }
  }

  function rebuildGridPreservingStudents() {
    const oldSeats = SeatLayout.getAllSeatsFlat(state.groups);
    const existingStudents = [];
    oldSeats.forEach(s => {
      if (s.student) existingStudents.push(s.student);
    });

    state.groups = SeatLayout.generateSeatGrid(state.layoutConfig);

    let sIdx = 0;
    state.groups.forEach(g => {
      g.seats.forEach(s => {
        if (sIdx < existingStudents.length) {
          s.student = existingStudents[sIdx];
          sIdx++;
        }
      });
    });

    refreshUnassignedStudents();
    updateStudentStats();
  }

  function renderUnassignedPool() {
    els.unassignedList.innerHTML = '';
    els.unassignedCount.textContent = state.unassignedStudents.length;

    if (state.unassignedStudents.length === 0) {
      const emptyTip = document.createElement('div');
      emptyTip.style.fontSize = '12px';
      emptyTip.style.color = '#94a3b8';
      emptyTip.textContent = '全体学生均已排入座位';
      els.unassignedList.appendChild(emptyTip);
      return;
    }

    state.unassignedStudents.forEach(stu => {
      const chip = document.createElement('div');
      chip.className = `student-chip ${stu.gender}`;
      chip.draggable = true;
      chip.textContent = stu.name;

      chip.addEventListener('dragstart', (e) => {
        state.dragSource = { type: 'unassigned', student: stu };
        e.dataTransfer.setData('text/plain', stu.name);
      });

      chip.addEventListener('dblclick', () => {
        pushHistory();
        const emptySeat = findFirstEmptySeat();
        if (emptySeat) {
          emptySeat.student = { ...stu, locked: false };
          refreshUnassignedStudents();
          render();
          saveToLocalStorage();
          showToast(`已安排 ${stu.name} 入座`);
        } else {
          showToast('教室已无多余空位！', 'error');
        }
      });

      els.unassignedList.appendChild(chip);
    });
  }

  function findFirstEmptySeat() {
    for (const g of state.groups) {
      for (const s of g.seats) {
        if (!s.disabled && !s.student) return s;
      }
    }
    return null;
  }

  /**
   * 渲染主座位画布 (支持横向自由伸展、双视角切换、坐标尺与自定义标签)
   */
  function renderSeatingChart() {
    render();
  }

  function render() {
    els.chartTitleInput.value = state.chartTitle;
    const now = new Date();

    const currentPresetObj = SeatLayout.PRESETS[state.currentPreset];
    let presetLabel = currentPresetObj ? currentPresetObj.name : `自定义布局 (${state.layoutConfig.groupCols.join('-')})`;

    const isTeacher = state.displaySettings.viewPerspective === 'teacher';
    els.chartSubtitleDate.textContent = `编制日期: ${now.toLocaleDateString()} | ${presetLabel} (${isTeacher ? '老师视角' : '学生视角'})`;

    // 老师视角切换样式
    if (isTeacher) {
      els.seatingPaper.classList.add('perspective-teacher');
      els.dirLeft.textContent = '🚪 靠门 (过道)';
      els.dirRight.textContent = '🪟 靠窗 (走廊)';
    } else {
      els.seatingPaper.classList.remove('perspective-teacher');
      els.dirLeft.textContent = '🪟 靠窗 (走廊)';
      els.dirRight.textContent = '🚪 靠门 (过道)';
    }

    els.seatingContainer.innerHTML = '';

    // 是否显示过道
    const showAisle = state.displaySettings.showAisle;
    els.seatingContainer.style.gap = showAisle ? '28px' : '8px';

    const showCoord = state.displaySettings.showCoord !== false;
    const maxRows = Math.max(...state.groups.map(g => g.rows || 0), state.layoutConfig.rows || 6);

    // 独立左侧排次标尺 (第1排、第2排... 独立列布局，绝不遮盖学生姓名卡片)
    if (showCoord && state.groups.length > 0) {
      const rulerCol = document.createElement('div');
      rulerCol.className = 'row-ruler-column';

      const rulerHeader = document.createElement('div');
      rulerHeader.className = 'row-ruler-header';
      rulerHeader.textContent = '排次';
      rulerCol.appendChild(rulerHeader);

      const rulerGrid = document.createElement('div');
      rulerGrid.className = 'row-ruler-grid';

      for (let r = 1; r <= maxRows; r++) {
        const badge = document.createElement('div');
        badge.className = 'row-ruler-badge';
        badge.textContent = getChineseRowName(r);
        rulerGrid.appendChild(badge);
      }

      rulerCol.appendChild(rulerGrid);
      els.seatingContainer.appendChild(rulerCol);
    }

    state.groups.forEach((group, gIdx) => {
      const groupEl = document.createElement('div');
      groupEl.className = 'seat-group';

      const headerEl = document.createElement('div');
      headerEl.className = 'group-header';
      headerEl.textContent = group.groupName || `第 ${gIdx + 1} 组`;
      groupEl.appendChild(headerEl);

      const gridEl = document.createElement('div');
      gridEl.className = 'group-seats-grid';
      gridEl.style.gridTemplateColumns = `repeat(${group.colCount}, 96px)`;

      group.seats.forEach(seat => {
        const seatCard = createSeatCardElement(seat, group);
        gridEl.appendChild(seatCard);
      });

      groupEl.appendChild(gridEl);
      els.seatingContainer.appendChild(groupEl);

      // 过道标示
      if (showAisle && gIdx < state.groups.length - 1) {
        const aisle = document.createElement('div');
        aisle.className = 'aisle-label';
        aisle.textContent = '过道';
        els.seatingContainer.appendChild(aisle);
      }
    });

    renderUnassignedPool();
    updateStudentStats();
  }

  /**
   * 生成排次名称 (如 第1排、第2排... 采用阿拉伯数字更清晰直观)
   */
  function getChineseRowName(num) {
    return `第${num}排`;
  }

  /**
   * 创建座位卡片 DOM (居中大字、名次/身高/视力胶囊、小锁头)
   */
  function createSeatCardElement(seat, group) {
    const card = document.createElement('div');
    card.className = 'seat-card';
    card.id = seat.id;
    card.draggable = !!seat.student;

    const { showGender, showRank, showHeight, showVision } = state.displaySettings;

    if (seat.student) {
      if (showGender) {
        if (seat.student.gender === 'boy') card.classList.add('gender-boy');
        if (seat.student.gender === 'girl') card.classList.add('gender-girl');
      }
      if (seat.student.locked) card.classList.add('is-locked');
    } else {
      card.classList.add('empty-seat');
    }

    if (state.selectedForSwap && state.selectedForSwap.id === seat.id) {
      card.classList.add('selected-swap');
    }

    if (seat.student) {
      // 居中大字姓名
      const nameEl = document.createElement('div');
      nameEl.className = 'seat-name';
      nameEl.textContent = seat.student.name;
      card.appendChild(nameEl);

      // 额外信息胶囊 (名次 / 身高 / 视力)
      const hasExtra = (showRank && seat.student.rank) || (showHeight && seat.student.height) || (showVision && seat.student.vision === 'poor');
      if (hasExtra) {
        const extraBox = document.createElement('div');
        extraBox.className = 'seat-extra-info';

        if (showRank && seat.student.rank) {
          const rankSpan = document.createElement('span');
          rankSpan.className = 'extra-tag-rank';
          rankSpan.textContent = `#${seat.student.rank}`;
          extraBox.appendChild(rankSpan);
        }
        if (showHeight && seat.student.height) {
          const heightSpan = document.createElement('span');
          heightSpan.className = 'extra-tag-height';
          heightSpan.textContent = `${seat.student.height}cm`;
          extraBox.appendChild(heightSpan);
        }
        if (showVision && seat.student.vision === 'poor') {
          const visionSpan = document.createElement('span');
          visionSpan.className = 'extra-tag-vision';
          visionSpan.textContent = '👓近视';
          extraBox.appendChild(visionSpan);
        }
        card.appendChild(extraBox);
      }

      // 悬浮锁定小锁头 (增大热区、拦截冒泡、极易点击)
      const lockBtn = document.createElement('button');
      lockBtn.type = 'button';
      lockBtn.className = 'seat-quick-lock';
      lockBtn.title = seat.student.locked ? '已锁定 (点击解锁)' : '点击锁定座位 (不参与排座与平移)';
      lockBtn.innerHTML = seat.student.locked ? '🔒' : '🔓';

      // 阻止任何可能传递给卡片的事件，防止误触对调或拖拽
      lockBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      lockBtn.addEventListener('mouseup', (e) => e.stopPropagation());
      lockBtn.addEventListener('dblclick', (e) => e.stopPropagation());
      lockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        pushHistory();
        seat.student.locked = !seat.student.locked;
        render();
        saveToLocalStorage();
        showToast(seat.student.locked ? `已锁定【${seat.student.name}】` : `已解锁【${seat.student.name}】`);
      });
      // 团队/小组归属角标
      if (state.displaySettings.showTeam !== false) {
        const teamInfo = findStudentTeam(seat.student.name);
        if (teamInfo) {
          card.dataset.teamId = teamInfo.groupId;
          const teamBadge = document.createElement('div');
          teamBadge.className = 'seat-team-badge';
          teamBadge.textContent = teamInfo.shortName;
          teamBadge.style.backgroundColor = teamInfo.theme.badgeBg;
          teamBadge.style.color = teamInfo.theme.text;
          teamBadge.style.borderColor = teamInfo.theme.border;
          card.appendChild(teamBadge);
        }
      }
      card.appendChild(lockBtn);
    } else {
      const emptyText = document.createElement('div');
      emptyText.className = 'empty-text';
      emptyText.textContent = '+ 空座';
      card.appendChild(emptyText);
    }

    card.addEventListener('mouseenter', () => {
      const teamId = card.dataset.teamId;
      if (teamId) {
        document.querySelectorAll(`.seat-card[data-team-id="${teamId}"]`).forEach(c => {
          c.classList.add('team-highlight');
        });
      }
    });
    card.addEventListener('mouseleave', () => {
      document.querySelectorAll('.seat-card.team-highlight').forEach(c => {
        c.classList.remove('team-highlight');
      });
    });

    card.addEventListener('click', () => handleSeatClick(seat));
    card.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      openEditModal(seat);
    });

    bindDragEvents(card, seat);
    return card;
  }

  function handleSeatClick(seat) {
    if (!state.selectedForSwap) {
      state.selectedForSwap = seat;
      render();
      showToast(`已选中【${seat.student ? seat.student.name : '空座'}】，请单击另一个座位调换`);
    } else {
      const seatA = state.selectedForSwap;
      const seatB = seat;

      if (seatA.id !== seatB.id) {
        pushHistory();
        const temp = seatA.student;
        seatA.student = seatB.student;
        seatB.student = temp;

        const nameA = seatA.student ? seatA.student.name : '空座';
        const nameB = seatB.student ? seatB.student.name : '空座';
        showToast(`已对调：${nameA} ⇋ ${nameB}`);
        saveToLocalStorage();
      }

      state.selectedForSwap = null;
      render();
    }
  }

  function bindDragEvents(card, targetSeat) {
    card.addEventListener('dragstart', (e) => {
      if (!targetSeat.student) return;
      state.dragSource = { type: 'seat', seat: targetSeat };
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', targetSeat.student.name);
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.seat-card').forEach(c => c.classList.remove('drag-over'));
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag-over');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');

      if (!state.dragSource) return;
      pushHistory();

      if (state.dragSource.type === 'seat') {
        const sourceSeat = state.dragSource.seat;
        if (sourceSeat.id !== targetSeat.id) {
          const temp = sourceSeat.student;
          sourceSeat.student = targetSeat.student;
          targetSeat.student = temp;
          showToast(`已对调位置`);
        }
      } else if (state.dragSource.type === 'unassigned') {
        const stu = state.dragSource.student;
        targetSeat.student = { ...stu, locked: false };
        refreshUnassignedStudents();
        showToast(`已安排【${stu.name}】入座`);
      }

      state.dragSource = null;
      render();
      saveToLocalStorage();
    });
  }

  /**
   * 单人信息编辑模态框
   */
  let currentEditingSeat = null;
  function openEditModal(seat) {
    currentEditingSeat = seat;
    if (seat.student) {
      els.editSeatNo.value = seat.student.no || '';
      els.editSeatName.value = seat.student.name || '';
      els.editSeatGender.value = seat.student.gender || 'unknown';
      els.editSeatRank.value = seat.student.rank || '';
      els.editSeatHeight.value = seat.student.height || '';
      els.editSeatVision.value = seat.student.vision || 'normal';
      els.editSeatLocked.checked = !!seat.student.locked;
    } else {
      els.editSeatNo.value = '';
      els.editSeatName.value = '';
      els.editSeatGender.value = 'boy';
      els.editSeatRank.value = '';
      els.editSeatHeight.value = '';
      els.editSeatVision.value = 'normal';
      els.editSeatLocked.checked = false;
    }

    els.editStudentModal.classList.add('show');
    els.editSeatName.focus();
  }

  function closeModal() {
    els.editStudentModal.classList.remove('show');
    currentEditingSeat = null;
  }

  function saveEditStudentModal() {
    if (!currentEditingSeat) return;
    const name = els.editSeatName.value.trim();

    pushHistory();
    if (name) {
      currentEditingSeat.student = {
        id: currentEditingSeat.student ? currentEditingSeat.student.id : `stu_${Date.now()}`,
        no: els.editSeatNo.value.trim() || '01',
        name: name,
        gender: els.editSeatGender.value,
        rank: parseInt(els.editSeatRank.value, 10) || null,
        height: parseInt(els.editSeatHeight.value, 10) || null,
        vision: els.editSeatVision.value,
        locked: els.editSeatLocked.checked
      };
    } else {
      currentEditingSeat.student = null;
    }

    closeModal();
    refreshUnassignedStudents();
    render();
    saveToLocalStorage();
    showToast('学生信息已更新');
  }

  /**
   * 独立全屏小组编辑器逻辑 (Group Editor)
   */
  function openFullscreenGroupEditor() {
    els.fullscreenGroupEditor.classList.add('show');
    // 如果还没分组，默认按前后桌4人组划分
    if (state.cooperativeGroups.length === 0) {
      state.cooperativeGroups = ArrangeRules.autoAreaGroup(state.groups, 2, 2);
    }
    renderGroupEditor();
  }

  function renderGroupEditor() {
    // 渲染小组卡片网格
    els.editorGroupCardsGrid.innerHTML = '';
    const assignedStudentIds = new Set();

    // 更新视图切换按钮样式
    if (els.btnViewDesk && els.btnViewCompact) {
      if (state.groupEditorViewMode === 'desk') {
        els.btnViewDesk.style.background = '#4f46e5';
        els.btnViewDesk.style.color = '#fff';
        els.btnViewDesk.style.fontWeight = '700';
        els.btnViewCompact.style.background = '#f1f5f9';
        els.btnViewCompact.style.color = '#475569';
        els.btnViewCompact.style.fontWeight = 'normal';
      } else {
        els.btnViewCompact.style.background = '#4f46e5';
        els.btnViewCompact.style.color = '#fff';
        els.btnViewCompact.style.fontWeight = '700';
        els.btnViewDesk.style.background = '#f1f5f9';
        els.btnViewDesk.style.color = '#475569';
        els.btnViewDesk.style.fontWeight = 'normal';
      }
    }

    // 更新目标小组下拉框
    els.targetGroupSelect.innerHTML = '<option value="">-- 选择目标小组 --</option>';

    state.cooperativeGroups.forEach((group, gIdx) => {
      // 保证统计信息完备
      if (!group.stats && typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
        ArrangeRules.enrichGroupStats(group);
      }

      const theme = getTeamTheme(gIdx);

      // 下拉选项
      const opt = document.createElement('option');
      opt.value = group.id;
      opt.textContent = group.name;
      els.targetGroupSelect.appendChild(opt);

      // 小组面板卡片
      const card = document.createElement('div');
      card.className = 'group-panel-card';
      card.dataset.groupId = group.id;
      card.style.borderTop = `4px solid ${theme.border}`;

      // 头部
      const header = document.createElement('div');
      header.className = 'group-panel-header';

      const titleBox = document.createElement('div');
      titleBox.style.display = 'flex';
      titleBox.style.alignItems = 'center';

      const pip = document.createElement('span');
      pip.className = 'group-theme-pip';
      pip.style.backgroundColor = theme.border;
      titleBox.appendChild(pip);

      const titleInput = document.createElement('span');
      titleInput.className = 'group-panel-title';
      titleInput.contentEditable = true;
      titleInput.textContent = group.name;
      titleInput.title = '点击可直接重命名小组';
      titleInput.addEventListener('blur', () => {
        group.name = titleInput.textContent.trim() || `第 ${gIdx + 1} 小组`;
        renderSeatingChart();
      });
      titleBox.appendChild(titleInput);
      header.appendChild(titleBox);

      const actionBox = document.createElement('div');
      actionBox.style.display = 'flex';
      actionBox.style.alignItems = 'center';
      actionBox.style.gap = '8px';

      const boys = group.members.filter(m => m.gender === 'boy').length;
      const girls = group.members.filter(m => m.gender === 'girl').length;
      const statsPill = document.createElement('span');
      statsPill.className = 'group-stats-pill';
      const avgStr = (group.stats && group.stats.avgRank) ? `均名:#${group.stats.avgRank}` : `${group.members.length}人`;
      statsPill.textContent = `${avgStr} | 👦${boys} 👧${girls}`;
      actionBox.appendChild(statsPill);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-danger-outline';
      deleteBtn.style.padding = '1px 6px';
      deleteBtn.style.fontSize = '11px';
      deleteBtn.textContent = '解散';
      deleteBtn.addEventListener('click', () => {
        state.cooperativeGroups.splice(gIdx, 1);
        renderGroupEditor();
        renderSeatingChart();
      });
      actionBox.appendChild(deleteBtn);

      header.appendChild(actionBox);
      card.appendChild(header);

      if (state.groupEditorViewMode === 'desk') {
        // ========== 课桌沙盘物理排布视图 (所见即所坐) ==========
        const desksContainer = document.createElement('div');
        desksContainer.className = 'team-desks-container';

        const indicator = document.createElement('div');
        indicator.className = 'team-desk-indicator';
        indicator.textContent = '▲ 讲台方向 (前排)';
        desksContainer.appendChild(indicator);

        const desksGrid = document.createElement('div');
        desksGrid.className = 'team-desks-grid';
        desksGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';

        const totalSlots = Math.max(4, Math.ceil(group.members.length / 2) * 2);

        for (let sIdx = 0; sIdx < totalSlots; sIdx++) {
          if (sIdx < group.members.length) {
            const m = group.members[sIdx];
            assignedStudentIds.add(m.name);

            const seatBox = document.createElement('div');
            seatBox.className = `team-desk-seat ${m.gender === 'boy' ? 'gender-boy' : (m.gender === 'girl' ? 'gender-girl' : '')}`;
            seatBox.draggable = true;

            seatBox.addEventListener('dragstart', (e) => {
              e.dataTransfer.setData('text/plain', JSON.stringify({ fromGroup: group.id, memberIndex: sIdx, student: m }));
            });

            // 课桌头部：角色徽章 + 移除按钮
            const seatHeader = document.createElement('div');
            seatHeader.className = 'team-desk-seat-header';

            const roleBadge = document.createElement('span');
            roleBadge.className = `desk-role-badge role-${m.role || 'member'}`;
            roleBadge.textContent = m.roleLabel || '组员';
            seatHeader.appendChild(roleBadge);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'desk-remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.title = '移出小组';
            removeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              group.members.splice(sIdx, 1);
              if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
                ArrangeRules.enrichGroupStats(group);
              }
              renderGroupEditor();
              renderSeatingChart();
            });
            seatHeader.appendChild(removeBtn);
            seatBox.appendChild(seatHeader);

            // 学生姓名
            const nameDiv = document.createElement('div');
            nameDiv.className = 'desk-seat-name';
            nameDiv.textContent = m.name;
            seatBox.appendChild(nameDiv);

            // 课桌底部：位置提示与名次
            const seatFooter = document.createElement('div');
            seatFooter.className = 'team-desk-seat-footer';
            const posLabel = document.createElement('span');
            posLabel.textContent = sIdx < 2 ? '前排同桌' : '后排同桌';
            seatFooter.appendChild(posLabel);

            const rankSpan = document.createElement('span');
            rankSpan.className = 'desk-seat-rank';
            rankSpan.textContent = m.rank ? `#${m.rank}` : (m.score ? `${m.score}分` : '-');
            seatFooter.appendChild(rankSpan);
            seatBox.appendChild(seatFooter);

            // 放置互换位置
            seatBox.addEventListener('dragover', (e) => {
              e.preventDefault();
              seatBox.style.borderColor = '#4f46e5';
              seatBox.style.transform = 'scale(1.03)';
            });
            seatBox.addEventListener('dragleave', () => {
              seatBox.style.borderColor = '';
              seatBox.style.transform = '';
            });
            seatBox.addEventListener('drop', (e) => {
              e.preventDefault();
              seatBox.style.borderColor = '';
              seatBox.style.transform = '';
              try {
                const raw = e.dataTransfer.getData('text/plain');
                const data = JSON.parse(raw);
                if (data && data.student) {
                  if (data.fromGroup === group.id) {
                    // 同组内互换前后或同桌座位
                    const temp = group.members[sIdx];
                    group.members[sIdx] = group.members[data.memberIndex];
                    group.members[data.memberIndex] = temp;
                  } else {
                    // 跨组调换
                    const fromG = state.cooperativeGroups.find(g => g.id === data.fromGroup);
                    if (fromG) {
                      const temp = group.members[sIdx];
                      group.members[sIdx] = data.student;
                      fromG.members[data.memberIndex] = temp;
                      if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
                        ArrangeRules.enrichGroupStats(fromG);
                      }
                    }
                  }
                  if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
                    ArrangeRules.enrichGroupStats(group);
                  }
                  renderGroupEditor();
                  renderSeatingChart();
                }
              } catch (err) {}
            });

            desksGrid.appendChild(seatBox);
          } else {
            // 空课桌槽位
            const emptyBox = document.createElement('div');
            emptyBox.className = 'empty-desk-seat';
            emptyBox.textContent = '+ 空课桌';

            emptyBox.addEventListener('dragover', (e) => {
              e.preventDefault();
              emptyBox.style.borderColor = '#4f46e5';
              emptyBox.style.background = '#eef2ff';
            });
            emptyBox.addEventListener('dragleave', () => {
              emptyBox.style.borderColor = '';
              emptyBox.style.background = '';
            });
            emptyBox.addEventListener('drop', (e) => {
              e.preventDefault();
              emptyBox.style.borderColor = '';
              emptyBox.style.background = '';
              try {
                const raw = e.dataTransfer.getData('text/plain');
                const data = JSON.parse(raw);
                if (data && data.student) {
                  if (data.fromGroup && data.fromGroup !== group.id) {
                    const fromG = state.cooperativeGroups.find(g => g.id === data.fromGroup);
                    if (fromG) fromG.members.splice(data.memberIndex, 1);
                  } else if (data.fromGroup === group.id) {
                    group.members.splice(data.memberIndex, 1);
                  }
                  group.members.push(data.student);
                  if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
                    ArrangeRules.enrichGroupStats(group);
                  }
                  renderGroupEditor();
                  renderSeatingChart();
                }
              } catch (err) {}
            });

            desksGrid.appendChild(emptyBox);
          }
        }

        desksContainer.appendChild(desksGrid);
        card.appendChild(desksContainer);
      } else {
        // ========== 紧凑清单视图 ==========
        const membersContainer = document.createElement('div');
        membersContainer.className = 'group-panel-members';

        group.members.forEach((m, mIdx) => {
          assignedStudentIds.add(m.name);
          const tag = document.createElement('div');
          tag.className = `group-member-tag ${m.gender}`;
          tag.draggable = true;
          tag.textContent = m.name;

          tag.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ fromGroup: group.id, memberIndex: mIdx, student: m }));
          });

          const removeBtn = document.createElement('button');
          removeBtn.className = 'remove-member-btn';
          removeBtn.innerHTML = '&times;';
          removeBtn.title = '移出小组';
          removeBtn.addEventListener('click', () => {
            group.members.splice(mIdx, 1);
            if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
              ArrangeRules.enrichGroupStats(group);
            }
            renderGroupEditor();
            renderSeatingChart();
          });
          tag.appendChild(removeBtn);
          membersContainer.appendChild(tag);
        });

        // 拖拽放入该组
        membersContainer.addEventListener('dragover', (e) => {
          e.preventDefault();
          card.classList.add('drag-over');
        });
        membersContainer.addEventListener('dragleave', () => {
          card.classList.remove('drag-over');
        });
        membersContainer.addEventListener('drop', (e) => {
          e.preventDefault();
          card.classList.remove('drag-over');
          try {
            const raw = e.dataTransfer.getData('text/plain');
            const data = JSON.parse(raw);
            if (data && data.student) {
              if (data.fromGroup && data.fromGroup !== group.id) {
                const fromG = state.cooperativeGroups.find(g => g.id === data.fromGroup);
                if (fromG) fromG.members.splice(data.memberIndex, 1);
              }
              if (!group.members.some(m => m.name === data.student.name)) {
                group.members.push(data.student);
              }
              if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
                ArrangeRules.enrichGroupStats(group);
              }
              renderGroupEditor();
              renderSeatingChart();
            }
          } catch (err) {}
        });

        card.appendChild(membersContainer);
      }

      els.editorGroupCardsGrid.appendChild(card);
    });

    // 渲染右侧未入组学生池
    const allSeats = SeatLayout.getAllSeatsFlat(state.groups);
    const seatStudents = [];
    allSeats.forEach(s => {
      if (s.student && s.student.name) seatStudents.push(s.student);
    });

    const unassignedGroupMembers = seatStudents.filter(s => !assignedStudentIds.has(s.name));
    els.unassignedGroupCount.textContent = unassignedGroupMembers.length;
    els.unassignedGroupPool.innerHTML = '';

    if (unassignedGroupMembers.length === 0) {
      els.unassignedGroupPool.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding-top:20px;">所有已排座学生均已加入小组</div>';
    } else {
      unassignedGroupMembers.forEach(stu => {
        const item = document.createElement('div');
        item.className = 'unassigned-student-item';
        item.draggable = true;

        const leftBox = document.createElement('label');
        leftBox.style.display = 'flex';
        leftBox.style.alignItems = 'center';
        leftBox.style.gap = '6px';
        leftBox.style.cursor = 'pointer';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.value = JSON.stringify(stu);
        leftBox.appendChild(chk);

        const nameSpan = document.createElement('span');
        nameSpan.textContent = stu.name;
        leftBox.appendChild(nameSpan);

        item.appendChild(leftBox);

        const badge = document.createElement('span');
        badge.className = `stat-badge ${stu.gender === 'boy' ? 'stat-boy' : 'stat-girl'}`;
        badge.style.fontSize = '10px';
        badge.textContent = stu.gender === 'boy' ? '男' : (stu.gender === 'girl' ? '女' : '');
        item.appendChild(badge);

        item.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ fromGroup: null, student: stu }));
        });

        els.unassignedGroupPool.appendChild(item);
      });
    }
  }

  function batchAddSelectedToGroup() {
    const targetGroupId = els.targetGroupSelect.value;
    if (!targetGroupId) {
      showToast('请先在下拉菜单中选择目标小组！', 'error');
      return;
    }
    const targetGroup = state.cooperativeGroups.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    const checkboxes = els.unassignedGroupPool.querySelectorAll('input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
      showToast('请勾选至少一名未入组学生！', 'info');
      return;
    }

    checkboxes.forEach(chk => {
      try {
        const stu = JSON.parse(chk.value);
        if (!targetGroup.members.some(m => m.name === stu.name)) {
          targetGroup.members.push(stu);
        }
      } catch (err) {}
    });

    renderGroupEditor();
    showToast(`成功批量移入 ${checkboxes.length} 名学生到【${targetGroup.name}】！`);
  }

  function generateCooperativeGroupText() {
    let text = `=== ${state.chartTitle} 合作学习小组名单 ===\n`;
    state.cooperativeGroups.forEach(g => {
      const names = g.members.map(m => m.name).join('、');
      text += `【${g.name}】(${g.members.length}人): ${names || '无'}\n`;
    });
    return text;
  }

  async function copyCooperativeGroupText() {
    const text = generateCooperativeGroupText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('小组名单已复制到剪贴板！');
    } catch (e) {
      showToast('复制失败，请手动选择复制');
    }
  }

  function exportGroupTxtFile() {
    const text = generateCooperativeGroupText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.chartTitle}_合作小组名单.txt`;
    a.click();
    showToast('小组 TXT 文件已导出！');
  }

  function exportGroupExcelFile() {
    if (typeof XLSX === 'undefined') {
      exportGroupTxtFile();
      return;
    }
    const aoa = [
      [`${state.chartTitle} 合作学习小组名单`],
      ['小组名称', '组内序号', '学生姓名', '性别']
    ];

    state.cooperativeGroups.forEach(g => {
      g.members.forEach((m, idx) => {
        aoa.push([g.name, idx + 1, m.name, m.gender === 'boy' ? '男' : (m.gender === 'girl' ? '女' : '')]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    ws['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 14 }, { wch: 8 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '合作学习小组');
    XLSX.writeFile(wb, `${state.chartTitle}_合作小组名单.xlsx`);
    showToast('小组 Excel 文件已导出！');
  }

  /**
   * 快捷录入与导入成绩系统 (Quick Score & Rank Modal)
   */
  let currentScoreTab = 'paste';

  function openQuickScoreModal() {
    switchScoreTab('paste');
    renderQuickScoreTable();
    // 预填粘贴框如果为空
    if (!els.pasteScoreTextarea.value.trim()) {
      const allSeatStudents = [];
      SeatLayout.getAllSeatsFlat(state.groups).forEach(s => {
        if (s.student && s.student.name) allSeatStudents.push(s.student);
      });
      const pool = allSeatStudents.length > 0 ? allSeatStudents : state.studentsPool;
      if (pool.length > 0) {
        els.pasteScoreTextarea.value = pool.map(s => `${s.name} ${s.rank !== null && s.rank !== undefined ? s.rank : ''}`).join('\n');
      }
    }
    els.quickScoreModal.classList.add('show');
  }

  function switchScoreTab(tab) {
    currentScoreTab = tab;
    if (tab === 'paste') {
      if (els.tabScorePaste) els.tabScorePaste.classList.add('active');
      if (els.tabScoreTable) els.tabScoreTable.classList.remove('active');
      if (els.paneScorePaste) els.paneScorePaste.style.display = 'block';
      if (els.paneScoreTable) els.paneScoreTable.style.display = 'none';
    } else {
      if (els.tabScoreTable) els.tabScoreTable.classList.add('active');
      if (els.tabScorePaste) els.tabScorePaste.classList.remove('active');
      if (els.paneScorePaste) els.paneScorePaste.style.display = 'none';
      if (els.paneScoreTable) els.paneScoreTable.style.display = 'block';
      renderQuickScoreTable();
    }
  }

  function renderQuickScoreTable() {
    if (!els.quickScoreTableBody) return;
    els.quickScoreTableBody.innerHTML = '';

    const allSeatStudents = [];
    SeatLayout.getAllSeatsFlat(state.groups).forEach(s => {
      if (s.student && s.student.name) allSeatStudents.push(s.student);
    });
    const pool = allSeatStudents.length > 0 ? allSeatStudents : state.studentsPool;

    if (pool.length === 0) {
      els.quickScoreTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:12px; color:#94a3b8;">暂无学生，请先录入学生名单</td></tr>';
      return;
    }

    pool.forEach((stu, idx) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f1f5f9';

      const tdNo = document.createElement('td');
      tdNo.style.padding = '6px 8px';
      tdNo.textContent = stu.no || String(idx + 1).padStart(2, '0');
      tr.appendChild(tdNo);

      const tdName = document.createElement('td');
      tdName.style.padding = '6px 8px';
      tdName.style.fontWeight = '600';
      tdName.textContent = stu.name;
      tr.appendChild(tdName);

      const tdGender = document.createElement('td');
      tdGender.style.padding = '6px 8px';
      tdGender.textContent = stu.gender === 'boy' ? '👦男' : (stu.gender === 'girl' ? '👧女' : '-');
      tr.appendChild(tdGender);

      const tdRank = document.createElement('td');
      tdRank.style.padding = '4px 8px';
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'form-input quick-score-input';
      input.style.width = '100px';
      input.style.padding = '3px 6px';
      input.style.fontSize = '12px';
      input.placeholder = '分数值/名次';
      input.value = (stu.rank !== null && stu.rank !== undefined) ? stu.rank : '';
      input.dataset.stuName = stu.name;
      tdRank.appendChild(input);
      tr.appendChild(tdRank);

      els.quickScoreTableBody.appendChild(tr);
    });
  }

  function handleSaveQuickScores() {
    const scoreMap = new Map();

    if (currentScoreTab === 'paste') {
      const text = els.pasteScoreTextarea.value.trim();
      if (!text) {
        showToast('请输入或粘贴成绩数据！', 'warning');
        return;
      }
      const lines = text.split(/\r?\n/);
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const tokens = trimmed.split(/[\t\s,，;；]+/).filter(Boolean);
        if (tokens.length < 2) return;

        let name = '';
        let score = null;

        tokens.forEach(tok => {
          const cleanTok = tok.replace(/分|#|第|名/g, '');
          const num = parseFloat(cleanTok);
          if (!isNaN(num) && score === null && /^\d+(\.\d+)?$/.test(cleanTok)) {
            score = Math.round(num);
          } else if (tok !== '男' && tok !== '女' && tok !== '近视' && tok !== '正常' && !name && !/^\d+$/.test(tok)) {
            name = tok;
          }
        });

        if (!name && tokens.length >= 2) {
          name = tokens[0];
          const num = parseFloat(tokens[1].replace(/分|#|第|名/g, ''));
          if (!isNaN(num)) score = Math.round(num);
        }

        if (name && score !== null) {
          scoreMap.set(name, score);
        }
      });
    } else {
      const inputs = els.quickScoreTableBody.querySelectorAll('.quick-score-input');
      inputs.forEach(inp => {
        const name = inp.dataset.stuName;
        const val = inp.value.trim();
        if (name && val !== '') {
          const score = parseInt(val, 10);
          if (!isNaN(score)) scoreMap.set(name, score);
        }
      });
    }

    if (scoreMap.size === 0) {
      showToast('未识别到有效的姓名与成绩对应关系，请检查格式！', 'error');
      return;
    }

    pushHistory();

    // 更新到 studentsPool
    state.studentsPool.forEach(s => {
      if (scoreMap.has(s.name)) {
        s.rank = scoreMap.get(s.name);
      }
    });

    // 更新到座位上的学生
    state.groups.forEach(g => {
      if (g.seats) {
        g.seats.forEach(seat => {
          if (seat.student && scoreMap.has(seat.student.name)) {
            seat.student.rank = scoreMap.get(seat.student.name);
          }
        });
      }
    });

    // 更新到 cooperativeGroups
    if (state.cooperativeGroups && state.cooperativeGroups.length > 0) {
      state.cooperativeGroups.forEach(group => {
        if (group.members) {
          group.members.forEach(m => {
            if (scoreMap.has(m.name)) {
              m.rank = scoreMap.get(m.name);
            }
          });
        }
        if (typeof ArrangeRules !== 'undefined' && ArrangeRules.enrichGroupStats) {
          ArrangeRules.enrichGroupStats(group);
        }
      });
    }

    syncStudentsPoolToTextarea();
    updateStudentStats();
    renderSeatingChart();
    if (els.fullscreenGroupEditor.classList.contains('show')) {
      renderGroupEditor();
    }
    saveToLocalStorage();
    els.quickScoreModal.classList.remove('show');
    showToast(`已成功录入并同步 ${scoreMap.size} 名学生的成绩与名次！`);
  }

  function syncStudentsPoolToTextarea() {
    if (!state.studentsPool || state.studentsPool.length === 0) return;
    const lines = state.studentsPool.map(s => {
      const parts = [s.no || '', s.name];
      if (s.gender === 'boy') parts.push('男');
      else if (s.gender === 'girl') parts.push('女');
      if (s.rank !== null && s.rank !== undefined) parts.push(`${s.rank}分`);
      if (s.height) parts.push(`${s.height}cm`);
      if (s.vision === 'poor') parts.push('近视');
      return parts.filter(Boolean).join(' ');
    });
    els.studentTextarea.value = lines.join('\n');
  }

  /**
   * 班级数据存档管理系统 (Class Archiving)
   */
  const ARCHIVES_KEY = 'seating_arrange_all_archives_v1';

  function getAllArchives() {
    try {
      const raw = localStorage.getItem(ARCHIVES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveAllArchives(list) {
    try {
      localStorage.setItem(ARCHIVES_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  function openArchiveModal() {
    els.saveArchiveNameInput.value = els.classTitleInput.value.trim() || '三年二班';
    renderArchiveList();
    els.archiveModal.classList.add('show');
  }

  function renderArchiveList() {
    const list = getAllArchives();
    els.archiveListContainer.innerHTML = '';

    if (list.length === 0) {
      els.archiveListContainer.innerHTML = '<div style="color:#94a3b8; font-size:12px; padding: 12px 0;">暂无历史存档，您可保存当前排座方案</div>';
      return;
    }

    list.forEach((arch, idx) => {
      const item = document.createElement('div');
      item.className = 'archive-item';

      const info = document.createElement('div');
      info.className = 'archive-item-info';
      info.innerHTML = `
        <span class="archive-item-title">${arch.name}</span>
        <span class="archive-item-time">保存时间: ${arch.saveTime} | 布局: ${arch.presetName || '自定义'} | 总人数: ${arch.studentCount || 0}人</span>
      `;
      item.appendChild(info);

      const btnBox = document.createElement('div');
      btnBox.style.display = 'flex';
      btnBox.style.gap = '6px';

      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn btn-sm btn-primary';
      loadBtn.textContent = '加载';
      loadBtn.addEventListener('click', () => {
        loadArchiveItem(arch);
        els.archiveModal.classList.remove('show');
        showToast(`已成功加载班级存档【${arch.name}】！`);
      });
      btnBox.appendChild(loadBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-sm btn-danger-outline';
      delBtn.textContent = '删除';
      delBtn.addEventListener('click', () => {
        if (confirm(`确定要删除存档【${arch.name}】吗？`)) {
          const cur = getAllArchives();
          cur.splice(idx, 1);
          saveAllArchives(cur);
          renderArchiveList();
          showToast(`已删除存档【${arch.name}】`);
        }
      });
      btnBox.appendChild(delBtn);

      item.appendChild(btnBox);
      els.archiveListContainer.appendChild(item);
    });
  }

  function handleSaveCurrentArchive() {
    const name = els.saveArchiveNameInput.value.trim();
    if (!name) {
      showToast('请输入存档名称！', 'error');
      return;
    }

    const archives = getAllArchives();
    const currentPresetObj = SeatLayout.PRESETS[state.currentPreset];

    const newArch = {
      id: `arch_${Date.now()}`,
      name: name,
      saveTime: new Date().toLocaleString(),
      presetName: currentPresetObj ? currentPresetObj.name : '自定义',
      studentCount: state.studentsPool.length,
      data: {
        chartTitle: state.chartTitle,
        currentPreset: state.currentPreset,
        layoutConfig: state.layoutConfig,
        groups: state.groups,
        studentsText: els.studentTextarea.value,
        displaySettings: state.displaySettings,
        cooperativeGroups: state.cooperativeGroups
      }
    };

    // 如果重名则覆盖
    const existIdx = archives.findIndex(a => a.name === name);
    if (existIdx >= 0) {
      archives[existIdx] = newArch;
    } else {
      archives.unshift(newArch);
    }

    saveAllArchives(archives);
    renderArchiveList();
    showToast(`班级存档【${name}】保存成功！`);
  }

  function loadArchiveItem(arch) {
    if (!arch || !arch.data) return;
    pushHistory();
    const d = arch.data;
    state.chartTitle = d.chartTitle || arch.name;
    state.currentPreset = d.currentPreset || 'group4_pair';
    state.layoutConfig = d.layoutConfig || { groupCols: [2, 2, 2, 2], rows: 6 };
    state.groups = d.groups || [];
    state.displaySettings = d.displaySettings || state.displaySettings;
    state.cooperativeGroups = d.cooperativeGroups || [];

    els.studentTextarea.value = d.studentsText || '';
    if (els.classTitleInput) els.classTitleInput.value = state.chartTitle.replace(' 座位表', '');
    if (els.chartTitleInput) els.chartTitleInput.value = state.chartTitle;

    parseStudentInput();
    render();
    saveToLocalStorage();
  }

  function exportAllArchivesJson() {
    const list = getAllArchives();
    const currentPack = {
      version: '2.0',
      exportTime: new Date().toLocaleString(),
      current: {
        chartTitle: state.chartTitle,
        currentPreset: state.currentPreset,
        layoutConfig: state.layoutConfig,
        groups: state.groups,
        studentsText: els.studentTextarea.value,
        displaySettings: state.displaySettings,
        cooperativeGroups: state.cooperativeGroups
      },
      archives: list
    };

    const blob = new Blob([JSON.stringify(currentPack, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `班级排座系统全部存档备份_${Date.now()}.json`;
    a.click();
    showToast('已导出 JSON 完整数据备份文件！');
  }

  function handleImportJsonFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const pack = JSON.parse(evt.target.result);
        if (pack.archives && Array.isArray(pack.archives)) {
          saveAllArchives(pack.archives);
        }
        if (pack.current) {
          loadArchiveItem({ name: pack.current.chartTitle, data: pack.current });
        }
        renderArchiveList();
        showToast('成功导入 JSON 备份数据！');
      } catch (err) {
        showToast('JSON 备份文件解析失败，格式不正确', 'error');
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  /**
   * 撤销管理
   */
  function pushHistory() {
    const snapshot = JSON.stringify({
      groups: state.groups,
      studentsPool: state.studentsPool,
      chartTitle: state.chartTitle,
      currentPreset: state.currentPreset,
      layoutConfig: state.layoutConfig,
      displaySettings: state.displaySettings,
      cooperativeGroups: state.cooperativeGroups
    });
    state.history.push(snapshot);
    if (state.history.length > 25) state.history.shift();
  }

  function undo() {
    if (state.history.length === 0) {
      showToast('没有可撤销的操作', 'info');
      return;
    }

    const snapshot = JSON.parse(state.history.pop());
    state.groups = snapshot.groups;
    state.studentsPool = snapshot.studentsPool;
    state.chartTitle = snapshot.chartTitle;
    state.currentPreset = snapshot.currentPreset;
    state.layoutConfig = snapshot.layoutConfig;
    state.displaySettings = snapshot.displaySettings || state.displaySettings;
    state.cooperativeGroups = snapshot.cooperativeGroups || [];

    if (els.classTitleInput) els.classTitleInput.value = state.chartTitle.replace(' 座位表', '');
    if (els.chartTitleInput) els.chartTitleInput.value = state.chartTitle;

    refreshUnassignedStudents();
    render();
    saveToLocalStorage();
    showToast('已撤销上一步操作');
  }

  /**
   * 本地持久化
   */
  const STORAGE_KEY = 'seating_arrange_offline_v4';

  function saveToLocalStorage() {
    try {
      const data = {
        chartTitle: state.chartTitle,
        currentPreset: state.currentPreset,
        layoutConfig: state.layoutConfig,
        groups: state.groups,
        studentsText: els.studentTextarea.value,
        displaySettings: state.displaySettings,
        cooperativeGroups: state.cooperativeGroups
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        state.chartTitle = data.chartTitle || state.chartTitle;
        state.currentPreset = data.currentPreset || state.currentPreset;
        state.layoutConfig = data.layoutConfig || state.layoutConfig;
        state.groups = data.groups || [];
        // 确保从本地存储恢复的座位数据必定包含 globalCol 全局列号
        let colOffset = 0;
        state.groups.forEach(g => {
          const colCount = g.colCount || 2;
          if (g.seats) {
            g.seats.forEach(s => {
              s.globalCol = colOffset + s.colInGroup + 1;
            });
          }
          colOffset += colCount;
        });
        state.displaySettings = Object.assign({
          showGender: true,
          showRank: false,
          showHeight: false,
          showVision: false,
          showCoord: true,
          showAisle: true,
          showTeam: true,
          viewPerspective: 'student'
        }, data.displaySettings || {});

        // 强力保障 showCoord 与 showTeam 默认开启 (兼容旧版浏览器缓存中尚未存储该字段的情况)
        if (state.displaySettings.showCoord === undefined) {
          state.displaySettings.showCoord = true;
        }
        if (state.displaySettings.showTeam === undefined) {
          state.displaySettings.showTeam = true;
        }

        state.cooperativeGroups = data.cooperativeGroups || [];
        els.studentTextarea.value = data.studentsText || '';

        if (els.classTitleInput) els.classTitleInput.value = state.chartTitle.replace(' 座位表', '');
        if (els.chartTitleInput) els.chartTitleInput.value = state.chartTitle;

        // 同步布局参数与小红书快捷按钮
        const totalCols = state.layoutConfig.groupCols.reduce((a, b) => a + b, 0);
        const exprStr = state.layoutConfig.groupCols.join('-');
        if (els.rowCountInput) els.rowCountInput.value = state.layoutConfig.rows;
        if (els.colCountInput) els.colCountInput.value = totalCols;
        if (els.customLayoutInput) els.customLayoutInput.value = exprStr;
        if (els.quickLayoutBtns) {
          els.quickLayoutBtns.forEach(btn => {
            if (btn.getAttribute('data-layout') === exprStr) {
              btn.classList.add('active');
            } else {
              btn.classList.remove('active');
            }
          });
        }

        // 同步显示复选框
        if (els.chkShowGender) els.chkShowGender.checked = state.displaySettings.showGender;
        if (els.chkShowRank) els.chkShowRank.checked = state.displaySettings.showRank;
        if (els.chkShowHeight) els.chkShowHeight.checked = state.displaySettings.showHeight;
        if (els.chkShowVision) els.chkShowVision.checked = state.displaySettings.showVision;
        if (els.chkShowCoord) els.chkShowCoord.checked = state.displaySettings.showCoord !== false;
        if (els.chkShowAisle) els.chkShowAisle.checked = state.displaySettings.showAisle;
        if (els.chkShowTeam) els.chkShowTeam.checked = state.displaySettings.showTeam !== false;

        parseStudentInput();
        updateStudentStats();
      }
    } catch (e) {}
  }

  function showToast(message, type = 'default') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2400);
  }

  window.addEventListener('DOMContentLoaded', init);
})();
