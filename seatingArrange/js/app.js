/**
 * 智能班级排座系统 (离线版) - 主应用脚本
 * 完全离线运行，无需后端服务器，支持双击 html 直接运行。
 */

const { createApp, ref, reactive, computed, onMounted, watch, nextTick } = Vue;

const STORAGE_KEY = 'smart_seating_offline_data_v2';
const HISTORY_STORAGE_KEY = 'smart_seating_history_backups_v2';

createApp({
  setup() {
    // ---- 核心状态 ----
    const activeTab = ref('seats'); // 'seats' | 'roster' | 'picker'
    const seatMode = ref('edit'); // 'edit' (排座调位) | 'checkin' (点名打卡)
    const perspectiveMode = ref('student'); // 'student' (学生视角/俯瞰) | 'teacher' (老师视角/站讲台)
    
    // 班级数据列表与当前班级
    const classes = ref([]);
    const currentClassId = ref(1);

    // 历史备份列表与弹窗控制
    const historyBackups = ref([]);
    const showHistoryModal = ref(false);
    const backupNoteInput = ref('');

    // 交互状态
    const selectedSeat = ref(null); // { r, c, student, fromPool: boolean }
    const dragSource = ref(null); // { type: 'grid'|'pool', r, c, student }
    const dragOverCell = ref(null); // { r, c }
    const isDragOverPool = ref(false); // 有座位卡片被拖到「待安排座位的学生池」上方
    const toastMessage = ref('');
    let toastTimer = null;

    // 下拉菜单显示控制
    const showSmartArrangeMenu = ref(false);
    const showRotateMenu = ref(false);
    const isExportMenuOpen = ref(false);

    // 模态框状态
    const showLayoutModal = ref(false);
    const showAssignModal = ref(false);
    const assignTarget = ref(null); // { r, c }
    const assignSearch = ref('');
    
    const showClassModal = ref(false);
    const classModalMode = ref('create'); // 'create' | 'edit'
    const classForm = reactive({ name: '', grade: '三年级', subject: '语文' });

    const showStudentModal = ref(false);
    const studentModalMode = ref('add'); // 'add' | 'edit'
    const studentForm = reactive({ id: null, student_no: '', name: '', gender: '男', tags: '', remark: '' });

    const showBatchAddModal = ref(false);
    const batchAddText = ref('');

    // 花名册检索
    const rosterSearch = ref('');

    // 课堂抽选器状态
    const pickerState = reactive({
      running: false,
      candidate: null,
      history: [],
      onlySeated: true
    });
    let pickerTimer = null;

    // 常用预设规格
    const layoutPresets = [
      { name: '4大组·8列双人桌 (2+2+2+2)', rows: 7, cols: 8, mode: 'double', desc: '标准中小学教室，中间留3条走道' },
      { name: '3大组·6列双人桌 (2+2+2)', rows: 7, cols: 6, mode: 'double', desc: '中小型教室，中间留2条走道' },
      { name: '5大组·10列双人桌 (2+2+2+2+2)', rows: 6, cols: 10, mode: 'double', desc: '大班额教室多组合作' },
      { name: '6列单人单桌 (考试/独立独座)', rows: 7, cols: 6, mode: 'single', desc: '每列之间均独立留走道，适合测验' },
      { name: '7列单人单桌 (独立走道)', rows: 7, cols: 7, mode: 'single', desc: '独立单列排布' },
      { name: '8列单人单桌 (大考场独座)', rows: 6, cols: 8, mode: 'single', desc: '大考场标准单座' },
      { name: '三人同桌 (3+3 / 三列大组)', rows: 7, cols: 6, mode: 'triple', desc: '三个人一组共同讨论' },
      { name: '对称紧凑网格 (无大组走道)', rows: 7, cols: 8, mode: 'grid', desc: '紧凑均等排列' }
    ];

    // ---- 计算属性 ----
    const currentClass = computed(() => {
      const cls = classes.value.find(c => String(c.id) === String(currentClassId.value));
      return cls || classes.value[0] || null;
    });

    const rowsCount = computed(() => (currentClass.value ? currentClass.value.rows : 7));
    const colsCount = computed(() => (currentClass.value ? currentClass.value.cols : 8));
    const currentLayoutMode = computed(() => (currentClass.value ? currentClass.value.layout_mode || 'double' : 'double'));

    // 未安排座位的学生列表
    const unseatedStudents = computed(() => {
      if (!currentClass.value) return [];
      const seatedSet = new Set();
      (currentClass.value.matrix || []).forEach(row => {
        row.forEach(cell => {
          if (cell && cell.student_id) seatedSet.add(cell.student_id);
        });
      });
      return (currentClass.value.students || []).filter(s => !seatedSet.has(s.id));
    });

    // 已排座位的学生列表 (带行列信息)
    const seatedStudentsList = computed(() => {
      if (!currentClass.value || !currentClass.value.matrix) return [];
      const list = [];
      currentClass.value.matrix.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell && cell.student_id) {
            list.push({
              r,
              c,
              student: cell
            });
          }
        });
      });
      return list;
    });

    // 统计指标
    const stats = computed(() => {
      if (!currentClass.value) return { total: 0, seated: 0, unseated: 0, emptySeats: 0, boys: 0, girls: 0, checkinDone: 0, locked: 0 };
      const totalStudents = currentClass.value.students ? currentClass.value.students.length : 0;
      const matrix = currentClass.value.matrix || [];
      let seated = 0;
      let checkinDone = 0;
      let locked = 0;
      let totalCells = currentClass.value.rows * currentClass.value.cols;

      matrix.forEach(row => {
        row.forEach(cell => {
          if (cell && cell.student_id) {
            seated++;
            if (cell.is_completed) checkinDone++;
            if (cell.is_locked) locked++;
          }
        });
      });

      const boys = (currentClass.value.students || []).filter(s => s.gender === '男').length;
      const girls = totalStudents - boys;

      return {
        total: totalStudents,
        seated,
        unseated: totalStudents - seated,
        emptySeats: Math.max(0, totalCells - seated),
        boys,
        girls,
        checkinDone,
        locked
      };
    });

    // 过滤分配模态框中的候选学生
    const filteredAssignUnseated = computed(() => {
      const q = assignSearch.value.trim().toLowerCase();
      if (!q) return unseatedStudents.value;
      return unseatedStudents.value.filter(s => 
        s.name.toLowerCase().includes(q) || (s.student_no && s.student_no.includes(q))
      );
    });

    // 分配模态框中：过滤掉已锁定的学生，锁定的固定学生不可调遣
    const filteredAssignSeated = computed(() => {
      const q = assignSearch.value.trim().toLowerCase();
      const unlockedList = seatedStudentsList.value.filter(item => !item.student.is_locked);
      if (!q) return unlockedList;
      return unlockedList.filter(item => 
        item.student.name.toLowerCase().includes(q) || (item.student.student_no && item.student.student_no.includes(q))
      );
    });

    // 花名册表格过滤
    const filteredRoster = computed(() => {
      if (!currentClass.value || !currentClass.value.students) return [];
      const q = rosterSearch.value.trim().toLowerCase();
      if (!q) return currentClass.value.students;
      return currentClass.value.students.filter(s => 
        s.name.toLowerCase().includes(q) ||
        (s.student_no && s.student_no.includes(q)) ||
        (s.tags && s.tags.toLowerCase().includes(q)) ||
        (s.remark && s.remark.toLowerCase().includes(q))
      );
    });

    // 大组列基础定义
    const groupColumnsInfo = computed(() => {
      const cols = colsCount.value;
      const mode = currentLayoutMode.value;
      let groupSize = 2;
      if (mode === 'single') groupSize = 1;
      else if (mode === 'triple') groupSize = 3;
      else if (mode === 'grid') groupSize = cols;

      const groups = [];
      let start = 0;
      let groupIdx = 1;
      const groupNames = ['第一大组', '第二大组', '第三大组', '第四大组', '第五大组', '第六大组', '第七大组', '第八大组'];

      while (start < cols) {
        const size = Math.min(groupSize, cols - start);
        groups.push({
          index: groupIdx,
          name: mode === 'single' ? `第${groupIdx}列` : (groupNames[groupIdx - 1] || `第${groupIdx}组`),
          startCol: start,
          colSpan: size
        });
        start += size;
        groupIdx++;
      }
      return groups;
    });

    // ---- 核心：老师视角 vs 学生视角 动态渲染矩阵与大组标题 ----
    const displayRows = computed(() => {
      if (!currentClass.value || !currentClass.value.matrix) return [];
      const matrix = currentClass.value.matrix;
      const rows = matrix.length;
      const cols = (matrix[0] || []).length;
      const result = [];

      if (perspectiveMode.value === 'student') {
        // 学生视角：第1排在最上面，从第1列到最后一列
        for (let r = 0; r < rows; r++) {
          const cells = [];
          for (let c = 0; c < cols; c++) {
            cells.push({
              r,
              c,
              visualCol: c,
              cell: matrix[r][c]
            });
          }
          result.push({
            rowIndex: r,
            label: `第 ${r + 1} 排`,
            cells
          });
        }
      } else {
        // 老师视角：
        // 老师站在讲台看向全班学生：第1排在下方（离老师最近），最后一排在上方（教室后方）；
        // 老师的左右手与台下学生的左右手相反（原右侧列呈现在老师左侧，列顺序从 cols-1 到 0 倒序呈现）。
        for (let r = rows - 1; r >= 0; r--) {
          const cells = [];
          let vCol = 0;
          for (let c = cols - 1; c >= 0; c--) {
            cells.push({
              r,
              c,
              visualCol: vCol++,
              cell: matrix[r][c]
            });
          }
          result.push({
            rowIndex: r,
            label: `第 ${r + 1} 排`,
            cells
          });
        }
      }
      return result;
    });

    const displayGroupHeaders = computed(() => {
      const mode = currentLayoutMode.value;
      const aisleGap = (mode === 'double' || mode === 'triple') ? '24px' : mode === 'single' ? '16px' : '8px';

      if (perspectiveMode.value === 'student') {
        return groupColumnsInfo.value.map((g, idx, arr) => ({
          ...g,
          displayName: g.name,
          marginRight: idx === arr.length - 1 ? '0px' : aisleGap
        }));
      } else {
        // 老师视角：大组在视觉上从左到右倒序，并带有方向标识
        const reversed = [...groupColumnsInfo.value].reverse();
        return reversed.map((g, idx, arr) => ({
          ...g,
          displayName: g.name + (idx === 0 ? ' (老师左侧)' : idx === arr.length - 1 ? ' (老师右侧)' : ''),
          marginRight: idx === arr.length - 1 ? '0px' : aisleGap
        }));
      }
    });

    // 列间走道距离样式
    function getColMarginStyle(colIndex) {
      const mode = currentLayoutMode.value;
      const totalCols = colsCount.value;
      if (colIndex >= totalCols - 1) return {};

      if (mode === 'single') {
        return { marginRight: '16px' };
      } else if (mode === 'triple') {
        if (colIndex % 3 === 2) return { marginRight: '24px' };
        return { marginRight: '6px' };
      } else if (mode === 'grid') {
        return { marginRight: '8px' };
      } else {
        // double (2人一桌)
        if (colIndex % 2 === 1) return { marginRight: '24px' };
        return { marginRight: '6px' };
      }
    }

    // ---- 辅助与提示方法 ----
    function showToast(msg) {
      toastMessage.value = msg;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastMessage.value = '';
      }, 2500);
    }

    function saveToStorage() {
      try {
        const payload = {
          classes: classes.value,
          currentClassId: currentClassId.value
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.error('Save to localStorage failed:', e);
      }
    }

    function loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.classes && parsed.classes.length > 0) {
            classes.value = parsed.classes;
            currentClassId.value = parsed.currentClassId || parsed.classes[0].id;
            loadHistoryBackups();
            return;
          }
        }
      } catch (e) {
        console.warn('Load storage failed, fallback to default demo data', e);
      }

      // 若无本地数据，加载预设示例数据
      if (window.DEFAULT_DATA) {
        classes.value = JSON.parse(JSON.stringify(window.DEFAULT_DATA.classes));
        currentClassId.value = window.DEFAULT_DATA.currentClassId;
      } else {
        initBlankClass();
      }
      loadHistoryBackups();
    }

    function initBlankClass() {
      classes.value = [
        {
          id: 1,
          name: '三年级(1)班',
          grade: '三年级',
          subject: '语文',
          layout_mode: 'double',
          rows: 7,
          cols: 8,
          students: [],
          matrix: Array.from({ length: 7 }, () => Array(8).fill(null))
        }
      ];
      currentClassId.value = 1;
    }

    function resetToDemoData() {
      if (!confirm('确定要恢复演示示例数据吗？当前所有自拟排座与班级数据将被官方示例数据覆盖！')) return;
      if (window.DEFAULT_DATA) {
        classes.value = JSON.parse(JSON.stringify(window.DEFAULT_DATA.classes));
        currentClassId.value = window.DEFAULT_DATA.currentClassId;
        saveToStorage();
        selectedSeat.value = null;
        showToast('已成功恢复示例 42 人班级排座数据！');
      }
    }

    // ---- 历史备份记录管理 ----
    function loadHistoryBackups() {
      try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            historyBackups.value = parsed;
            return;
          }
        }
      } catch (err) {
        console.warn('Load history backups failed', err);
      }

      // 如果历史记录为空，生成一份初始快照方便体验
      if (currentClass.value && currentClass.value.matrix) {
        const initSnap = {
          id: 'snap_' + Date.now(),
          name: '初始标准排座方案 (开学初始)',
          classId: currentClass.value.id,
          className: currentClass.value.name,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
          rows: rowsCount.value,
          cols: colsCount.value,
          layout_mode: currentLayoutMode.value,
          matrix: JSON.parse(JSON.stringify(currentClass.value.matrix)),
          students: JSON.parse(JSON.stringify(currentClass.value.students || [])),
          stats: {
            total: stats.value.total,
            seated: stats.value.seated,
            locked: stats.value.locked
          }
        };
        historyBackups.value = [initSnap];
        saveHistoryBackups();
      }
    }

    function saveHistoryBackups() {
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyBackups.value));
      } catch (err) {
        console.error('Save history backups failed', err);
      }
    }

    function openHistoryModal() {
      const nowStr = new Date().toLocaleDateString('zh-CN') + ' 排座快照';
      backupNoteInput.value = nowStr;
      showHistoryModal.value = true;
    }

    function createHistoryBackup(customName = null) {
      if (!currentClass.value) return;
      const name = (customName || backupNoteInput.value || '').trim() || `${currentClass.value.name} 排座快照`;
      const snapshot = {
        id: 'snap_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name,
        classId: currentClass.value.id,
        className: currentClass.value.name,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        rows: rowsCount.value,
        cols: colsCount.value,
        layout_mode: currentLayoutMode.value,
        matrix: JSON.parse(JSON.stringify(currentClass.value.matrix)),
        students: JSON.parse(JSON.stringify(currentClass.value.students || [])),
        stats: {
          total: stats.value.total,
          seated: stats.value.seated,
          locked: stats.value.locked
        }
      };

      historyBackups.value.unshift(snapshot);
      saveHistoryBackups();
      backupNoteInput.value = '';
      showToast(`已成功创建历史备份快照【${name}】！`);
    }

    function restoreHistoryBackup(backup) {
      if (!currentClass.value) return;
      const confirmMsg = `确定要恢复到历史排座方案【${backup.name}】吗？\n\n班级：${backup.className}\n备份时间：${backup.createdAt}\n规格：${backup.rows}排 × ${backup.cols}列\n恢复后当前班级的座位布局将被覆盖！`;
      if (!confirm(confirmMsg)) return;

      currentClass.value.rows = backup.rows;
      currentClass.value.cols = backup.cols;
      currentClass.value.layout_mode = backup.layout_mode || 'double';
      currentClass.value.matrix = JSON.parse(JSON.stringify(backup.matrix));

      // 若备份中有学生档案，同步查缺补漏
      if (backup.students && Array.isArray(backup.students)) {
        const existMap = new Set(currentClass.value.students.map(s => s.id));
        backup.students.forEach(bs => {
          if (!existMap.has(bs.id)) {
            currentClass.value.students.push(JSON.parse(JSON.stringify(bs)));
          }
        });
      }

      selectedSeat.value = null;
      saveToStorage();
      showToast(`已成功恢复至历史版本【${backup.name}】！`);
    }

    function deleteHistoryBackup(backupId) {
      const target = historyBackups.value.find(b => b.id === backupId);
      if (!confirm(`确定要删除历史备份记录【${target ? target.name : ''}】吗？删除后不可恢复。`)) return;

      historyBackups.value = historyBackups.value.filter(b => b.id !== backupId);
      saveHistoryBackups();
      showToast('历史备份记录已删除！');
    }

    function renameHistoryBackup(backup) {
      const newName = prompt('请输入新的历史备份名称：', backup.name);
      if (newName && newName.trim()) {
        backup.name = newName.trim();
        saveHistoryBackups();
        showToast('备份名称已更新！');
      }
    }

    function exportSingleBackup(backup) {
      const dataStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const link = document.createElement('a');
      link.download = `${backup.className}_${backup.name}_备份.json`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('单份备份文件已导出！');
    }

    function exportAllHistoryBackups() {
      const dataStr = JSON.stringify(historyBackups.value, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      const link = document.createElement('a');
      link.download = `班级排座历史快照全集_${new Date().toISOString().slice(0, 10)}.json`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('全部历史记录已导出！');
    }

    function importHistoryBackupsFile() {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            let count = 0;
            if (Array.isArray(parsed)) {
              parsed.forEach(item => {
                if (item.matrix && item.name) {
                  historyBackups.value.unshift(item);
                  count++;
                }
              });
            } else if (parsed && parsed.matrix && parsed.name) {
              historyBackups.value.unshift(parsed);
              count++;
            } else if (parsed && parsed.classes) {
              // 兼容全量备份格式
              parsed.classes.forEach(c => {
                historyBackups.value.unshift({
                  id: 'snap_' + Date.now() + Math.random().toString(36).substr(2, 3),
                  name: `外部导入 - ${c.name}`,
                  classId: c.id,
                  className: c.name,
                  createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
                  rows: c.rows || 7,
                  cols: c.cols || 8,
                  layout_mode: c.layout_mode || 'double',
                  matrix: c.matrix,
                  students: c.students || [],
                  stats: { total: (c.students || []).length, seated: 0, locked: 0 }
                });
                count++;
              });
            }

            if (count > 0) {
              saveHistoryBackups();
              showToast(`成功导入 ${count} 条历史备份！`);
            } else {
              alert('未在该文件中找到有效的排座历史数据！');
            }
          } catch (err) {
            alert('读取备份文件失败：' + err.message);
          }
        };
        reader.readAsText(file);
      };
      fileInput.click();
    }

    function clearAllHistoryBackups() {
      if (!confirm('【高危操作】确定要清空全部历史备份记录吗？清空后将无法找回！')) return;
      historyBackups.value = [];
      saveHistoryBackups();
      showToast('所有历史备份已清空！');
    }

    // ---- 锁定功能：固定座位与人 ----
    function toggleSeatLock(r, c, e) {
      if (e) e.stopPropagation();
      const cell = currentClass.value.matrix[r][c];
      if (!cell) return;
      cell.is_locked = !cell.is_locked;
      if (selectedSeat.value && !selectedSeat.value.fromPool && selectedSeat.value.r === r && selectedSeat.value.c === c) {
        selectedSeat.value = null;
      }
      saveToStorage();
      if (cell.is_locked) {
        showToast(`已锁定【${cell.name}】座位，该学生位置固定不参与自动排座与调换！`);
      } else {
        showToast(`已解锁【${cell.name}】座位`);
      }
    }

    function unlockAllSeats() {
      showSmartArrangeMenu.value = false;
      let count = 0;
      currentClass.value.matrix.forEach(row => {
        row.forEach(cell => {
          if (cell && cell.is_locked) {
            cell.is_locked = false;
            count++;
          }
        });
      });
      saveToStorage();
      showToast(count > 0 ? `已解锁全班 ${count} 个锁定座位！` : '当前没有被锁定的座位');
    }

    // ---- 排座交互：点击交换与点选入座 ----
    function handleSeatClick(r, c) {
      if (seatMode.value === 'checkin') {
        // 打卡模式：直接切换打卡状态
        toggleCheckin(r, c);
        return;
      }

      const cell = currentClass.value.matrix[r][c];

      // 如果当前没有选中任何对象
      if (!selectedSeat.value) {
        if (cell) {
          if (cell.is_locked) {
            showToast(`【${cell.name}】座位已锁定固定，如需调换请先点击右上角锁按钮解锁！`);
            return;
          }
          // 选中此学生准备交换
          selectedSeat.value = { r, c, student: cell, fromPool: false };
        } else {
          // 点击了空位，弹出选择学生弹窗
          openAssignModal(r, c);
        }
        return;
      }

      // 已有选中的对象
      const sel = selectedSeat.value;

      // 检查目标位置是否已被锁定
      if (cell && cell.is_locked) {
        showToast(`目标座位【${cell.name}】已锁定固定，不可调换！`);
        return;
      }

      if (sel.fromPool) {
        // 从学生池中选中了学生，放置到此位置 (r, c)
        currentClass.value.matrix[r][c] = {
          student_id: sel.student.id,
          student_no: sel.student.student_no,
          name: sel.student.name,
          gender: sel.student.gender,
          tags: sel.student.tags,
          is_locked: false,
          is_completed: false
        };
        selectedSeat.value = null;
        saveToStorage();
        showToast(`已安排【${sel.student.name}】入座！`);
        return;
      }

      // 从网格中选中的已有座位
      if (sel.r === r && sel.c === c) {
        // 再次点击同一座位：取消选中
        selectedSeat.value = null;
        return;
      }

      // 与目标位置互换 (不论目标是空位还是已有学生)
      const targetCell = currentClass.value.matrix[r][c];
      currentClass.value.matrix[r][c] = currentClass.value.matrix[sel.r][sel.c];
      currentClass.value.matrix[sel.r][sel.c] = targetCell;

      selectedSeat.value = null;
      saveToStorage();
      showToast('座位调换成功！');
    }

    function selectPoolStudent(student) {
      if (seatMode.value === 'checkin') return;
      if (selectedSeat.value && selectedSeat.value.fromPool && selectedSeat.value.student.id === student.id) {
        selectedSeat.value = null;
      } else {
        selectedSeat.value = { student, fromPool: true };
        showToast(`已选中待排学生【${student.name}】，点击上方任意空位入座！`);
      }
    }

    function cancelSelection() {
      selectedSeat.value = null;
    }

    function removeSeatStudent(r, c, e) {
      if (e) e.stopPropagation();
      const cell = currentClass.value.matrix[r][c];
      if (!cell) return;
      if (cell.is_locked) {
        showToast(`【${cell.name}】座位已锁定固定，请先点击锁图标解锁后再移出！`);
        return;
      }
      currentClass.value.matrix[r][c] = null;
      if (selectedSeat.value && !selectedSeat.value.fromPool && selectedSeat.value.r === r && selectedSeat.value.c === c) {
        selectedSeat.value = null;
      }
      saveToStorage();
      showToast(`已将【${cell.name}】移至待安排学生池`);
    }

    // ---- HTML5 拖拽支持 (Drag & Drop) ----
    function onDragStartSeat(e, r, c, cell) {
      if (seatMode.value !== 'edit') return;
      if (cell.is_locked) {
        e.preventDefault();
        showToast(`【${cell.name}】座位已锁定固定，不可拖拽！如需调动请先解锁。`);
        return;
      }
      dragSource.value = { type: 'grid', r, c, student: cell };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', cell.name);
    }

    function onDragStartPool(e, student) {
      if (seatMode.value !== 'edit') return;
      dragSource.value = { type: 'pool', student };
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', student.name);
    }

    function onDragOver(e, r, c) {
      if (seatMode.value !== 'edit' || !dragSource.value) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      dragOverCell.value = { r, c };
    }

    function onDragLeave(r, c) {
      if (dragOverCell.value && dragOverCell.value.r === r && dragOverCell.value.c === c) {
        dragOverCell.value = null;
      }
    }

    function onDrop(e, r, c) {
      e.preventDefault();
      if (!dragSource.value) return;

      const targetCell = currentClass.value.matrix[r][c];
      if (targetCell && targetCell.is_locked) {
        showToast(`目标座位【${targetCell.name}】已锁定固定，不可替换！`);
        dragSource.value = null;
        dragOverCell.value = null;
        return;
      }

      const src = dragSource.value;

      if (src.type === 'grid') {
        if (src.r === r && src.c === c) {
          dragSource.value = null;
          dragOverCell.value = null;
          return;
        }
        // 交换网格中两个位置
        const temp = currentClass.value.matrix[r][c];
        currentClass.value.matrix[r][c] = currentClass.value.matrix[src.r][src.c];
        currentClass.value.matrix[src.r][src.c] = temp;
      } else if (src.type === 'pool') {
        // 从池中拖入网格
        currentClass.value.matrix[r][c] = {
          student_id: src.student.id,
          student_no: src.student.student_no,
          name: src.student.name,
          gender: src.student.gender,
          tags: src.student.tags,
          is_locked: false,
          is_completed: false
        };
      }

      dragSource.value = null;
      dragOverCell.value = null;
      selectedSeat.value = null;
      saveToStorage();
      showToast('排座调换成功！');
    }

    function onDragEnd() {
      dragSource.value = null;
      dragOverCell.value = null;
      isDragOverPool.value = false;
    }

    // ---- 把座位上的学生拖回「待安排座位的学生池」= 移出座位 ----
    function onDragOverPool(e) {
      if (seatMode.value !== 'edit') return;
      const src = dragSource.value;
      if (!src || src.type !== 'grid') return; // 池内的学生拖来拖去不作处理
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      isDragOverPool.value = true;
    }

    function onDragLeavePool() {
      isDragOverPool.value = false;
    }

    function onDropToPool(e) {
      e.preventDefault();
      isDragOverPool.value = false;
      const src = dragSource.value;
      dragSource.value = null;
      dragOverCell.value = null;
      if (!src || src.type !== 'grid') return;

      const cell = currentClass.value.matrix[src.r][src.c];
      if (!cell) return;
      if (cell.is_locked) {
        showToast(`【${cell.name}】座位已锁定固定，请先点击锁图标解锁后再移出！`);
        return;
      }
      currentClass.value.matrix[src.r][src.c] = null;
      selectedSeat.value = null;
      saveToStorage();
      showToast(`已将【${cell.name}】移至待安排学生池`);
    }

    // ---- 安排学生入座弹窗 ----
    function openAssignModal(r, c) {
      assignTarget.value = { r, c };
      assignSearch.value = '';
      showAssignModal.value = true;
    }

    function assignStudentToTarget(student, fromSeatedCoord = null) {
      if (!assignTarget.value) return;
      const { r, c } = assignTarget.value;
      const targetCell = currentClass.value.matrix[r][c];
      if (targetCell && targetCell.is_locked) {
        showToast(`目标座位【${targetCell.name}】已锁定固定，不可修改！`);
        return;
      }

      // 如果来自另一个已有座位，先检查是否被锁定
      if (fromSeatedCoord) {
        const srcCell = currentClass.value.matrix[fromSeatedCoord.r][fromSeatedCoord.c];
        if (srcCell && srcCell.is_locked) {
          showToast(`【${srcCell.name}】座位已锁定固定，不可调换！`);
          return;
        }
        currentClass.value.matrix[fromSeatedCoord.r][fromSeatedCoord.c] = null;
      }

      currentClass.value.matrix[r][c] = {
        student_id: student.id || student.student_id,
        student_no: student.student_no,
        name: student.name,
        gender: student.gender,
        tags: student.tags,
        is_locked: false,
        is_completed: false
      };

      showAssignModal.value = false;
      assignTarget.value = null;
      saveToStorage();
      showToast(`已安排【${student.name}】就座！`);
    }

    // ---- 智能排座算法 (已锁定座位的学生绝对固定保持不动) ----
    function autoArrangeByStudentNo() {
      showSmartArrangeMenu.value = false;
      if (!currentClass.value || currentClass.value.students.length === 0) {
        alert('当前班级花名册暂无学生，请先在花名册中添加学生！');
        return;
      }

      const matrix = currentClass.value.matrix;
      const rows = rowsCount.value;
      const cols = colsCount.value;

      // 统计所有已锁定的学生
      const lockedStudentIds = new Set();
      let lockedCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = matrix[r] ? matrix[r][c] : null;
          if (cell && cell.is_locked && cell.student_id) {
            lockedStudentIds.add(cell.student_id);
            lockedCount++;
          }
        }
      }

      const promptMsg = lockedCount > 0
        ? `确定要按学号顺序重新排座吗？\n检测到有 ${lockedCount} 个座位已锁定固定，锁定的学生将保持原座不动，其余座位将按学号排序填入。`
        : '确定要按学号顺序重新排座吗？当前座位上的学生将被重新排列。';

      if (!confirm(promptMsg)) return;

      // 剩余未锁定的学生按学号排序
      const availableStudents = currentClass.value.students
        .filter(s => !lockedStudentIds.has(s.id))
        .sort((a, b) => {
          const na = parseInt(a.student_no, 10) || 9999;
          const nb = parseInt(b.student_no, 10) || 9999;
          return na - nb;
        });

      let aIdx = 0;
      const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(null));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const oldCell = matrix[r] ? matrix[r][c] : null;
          if (oldCell && oldCell.is_locked && oldCell.student_id) {
            // 保持原锁定学生与座位不动
            newMatrix[r][c] = oldCell;
          } else {
            if (aIdx < availableStudents.length) {
              const s = availableStudents[aIdx++];
              newMatrix[r][c] = {
                student_id: s.id,
                student_no: s.student_no,
                name: s.name,
                gender: s.gender,
                tags: s.tags,
                is_locked: false,
                is_completed: false
              };
            }
          }
        }
      }

      currentClass.value.matrix = newMatrix;
      selectedSeat.value = null;
      saveToStorage();
      showToast(lockedCount > 0 ? `按学号排座完成（已保留 ${lockedCount} 个固定座位不变）！` : '已按学号顺序排列全部座位！');
    }

    function autoArrangeByGenderAlternate() {
      showSmartArrangeMenu.value = false;
      if (!currentClass.value || currentClass.value.students.length === 0) {
        alert('当前班级花名册暂无学生！');
        return;
      }

      const matrix = currentClass.value.matrix;
      const rows = rowsCount.value;
      const cols = colsCount.value;

      // 统计所有已锁定的学生
      const lockedStudentIds = new Set();
      let lockedCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = matrix[r] ? matrix[r][c] : null;
          if (cell && cell.is_locked && cell.student_id) {
            lockedStudentIds.add(cell.student_id);
            lockedCount++;
          }
        }
      }

      const promptMsg = lockedCount > 0
        ? `确定要按【男女交替同桌搭配】智能排座吗？\n检测到有 ${lockedCount} 个座位已锁定固定，锁定的学生将保持原座不动，其余座位男女交替搭配。`
        : '确定要按【男女交替同桌搭配】智能排座吗？';

      if (!confirm(promptMsg)) return;

      const availableBoys = currentClass.value.students.filter(s => s.gender === '男' && !lockedStudentIds.has(s.id));
      const availableGirls = currentClass.value.students.filter(s => s.gender === '女' && !lockedStudentIds.has(s.id));

      // 交替合并
      const paired = [];
      const maxLen = Math.max(availableBoys.length, availableGirls.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < availableBoys.length) paired.push(availableBoys[i]);
        if (i < availableGirls.length) paired.push(availableGirls[i]);
      }

      let pIdx = 0;
      const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(null));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const oldCell = matrix[r] ? matrix[r][c] : null;
          if (oldCell && oldCell.is_locked && oldCell.student_id) {
            newMatrix[r][c] = oldCell;
          } else {
            if (pIdx < paired.length) {
              const s = paired[pIdx++];
              newMatrix[r][c] = {
                student_id: s.id,
                student_no: s.student_no,
                name: s.name,
                gender: s.gender,
                tags: s.tags,
                is_locked: false,
                is_completed: false
              };
            }
          }
        }
      }

      currentClass.value.matrix = newMatrix;
      selectedSeat.value = null;
      saveToStorage();
      showToast(lockedCount > 0 ? `男女交替排座完成（已保留 ${lockedCount} 个固定座位不变）！` : '已完成男女生交替同桌智能排座！');
    }

    function autoArrangeRandom() {
      showSmartArrangeMenu.value = false;
      if (!currentClass.value || currentClass.value.students.length === 0) {
        alert('当前班级花名册暂无学生！');
        return;
      }

      const matrix = currentClass.value.matrix;
      const rows = rowsCount.value;
      const cols = colsCount.value;

      const lockedStudentIds = new Set();
      let lockedCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = matrix[r] ? matrix[r][c] : null;
          if (cell && cell.is_locked && cell.student_id) {
            lockedStudentIds.add(cell.student_id);
            lockedCount++;
          }
        }
      }

      const promptMsg = lockedCount > 0
        ? `确定要【全班随机摇号打乱】重新排座吗？\n检测到有 ${lockedCount} 个座位已锁定固定，锁定的学生将保持不动，其余座位随机打乱。`
        : '确定要【全班随机摇号打乱】重新排座吗？';

      if (!confirm(promptMsg)) return;

      const availableStudents = currentClass.value.students
        .filter(s => !lockedStudentIds.has(s.id))
        .sort(() => Math.random() - 0.5);

      let sIdx = 0;
      const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(null));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const oldCell = matrix[r] ? matrix[r][c] : null;
          if (oldCell && oldCell.is_locked && oldCell.student_id) {
            newMatrix[r][c] = oldCell;
          } else {
            if (sIdx < availableStudents.length) {
              const s = availableStudents[sIdx++];
              newMatrix[r][c] = {
                student_id: s.id,
                student_no: s.student_no,
                name: s.name,
                gender: s.gender,
                tags: s.tags,
                is_locked: false,
                is_completed: false
              };
            }
          }
        }
      }

      currentClass.value.matrix = newMatrix;
      selectedSeat.value = null;
      saveToStorage();
      showToast(lockedCount > 0 ? `全班随机排座完成（已保留 ${lockedCount} 个固定座位不变）！` : '全班座位已随机摇号打乱排列！');
    }

    function fillRemainingSeats() {
      if (unseatedStudents.value.length === 0) return;
      const unseated = [...unseatedStudents.value];
      let uIdx = 0;

      for (let r = 0; r < rowsCount.value && uIdx < unseated.length; r++) {
        for (let c = 0; c < colsCount.value && uIdx < unseated.length; c++) {
          if (!currentClass.value.matrix[r][c]) {
            const s = unseated[uIdx++];
            currentClass.value.matrix[r][c] = {
              student_id: s.id,
              student_no: s.student_no,
              name: s.name,
              gender: s.gender,
              tags: s.tags,
              is_locked: false,
              is_completed: false
            };
          }
        }
      }

      selectedSeat.value = null;
      saveToStorage();
      showToast(`已顺延填补 ${uIdx} 位空座！`);
    }

    function clearAllSeats() {
      showSmartArrangeMenu.value = false;
      const matrix = currentClass.value.matrix;
      const rows = rowsCount.value;
      const cols = colsCount.value;

      let lockedCount = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (matrix[r] && matrix[r][c] && matrix[r][c].is_locked) {
            lockedCount++;
          }
        }
      }

      const promptMsg = lockedCount > 0
        ? `确定要清空座位吗？\n已锁定的 ${lockedCount} 个座位将继续保持固定，其余未锁定学生将退回【待安排学生池】。`
        : '确定要清空当前所有座位吗？所有学生将退回【待安排学生池】。';

      if (!confirm(promptMsg)) return;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (matrix[r] && matrix[r][c] && !matrix[r][c].is_locked) {
            matrix[r][c] = null;
          }
        }
      }

      selectedSeat.value = null;
      saveToStorage();
      showToast(lockedCount > 0 ? `未锁定座位已清空（保留了 ${lockedCount} 个固定座位）！` : '所有座位已清空，学生已退回待安排池！');
    }

    // ---- 大组平移轮换功能 (保持锁定的座位固定不动) ----
    function rotateLeft() {
      showRotateMenu.value = false;
      const mode = currentLayoutMode.value;
      let step = 2;
      if (mode === 'single') step = 1;
      else if (mode === 'triple') step = 3;

      const matrix = currentClass.value.matrix;
      const cols = colsCount.value;
      if (cols <= step) return;

      let hasLocked = false;
      for (let r = 0; r < matrix.length; r++) {
        const row = matrix[r];
        const unlockedIndices = [];
        const unlockedValues = [];
        for (let c = 0; c < row.length; c++) {
          if (row[c] && row[c].is_locked) {
            hasLocked = true;
          } else {
            unlockedIndices.push(c);
            unlockedValues.push(row[c]);
          }
        }

        if (unlockedIndices.length <= 1) continue;

        const effectiveStep = step % unlockedValues.length;
        const rotatedValues = unlockedValues.slice(effectiveStep).concat(unlockedValues.slice(0, effectiveStep));

        for (let i = 0; i < unlockedIndices.length; i++) {
          row[unlockedIndices[i]] = rotatedValues[i];
        }
      }

      selectedSeat.value = null;
      saveToStorage();
      showToast(hasLocked ? '大组已成功向左平移轮换（锁定座位保持固定）！' : '大组已成功向左平移轮换！');
    }

    function rotateRight() {
      showRotateMenu.value = false;
      const mode = currentLayoutMode.value;
      let step = 2;
      if (mode === 'single') step = 1;
      else if (mode === 'triple') step = 3;

      const matrix = currentClass.value.matrix;
      const cols = colsCount.value;
      if (cols <= step) return;

      let hasLocked = false;
      for (let r = 0; r < matrix.length; r++) {
        const row = matrix[r];
        const unlockedIndices = [];
        const unlockedValues = [];
        for (let c = 0; c < row.length; c++) {
          if (row[c] && row[c].is_locked) {
            hasLocked = true;
          } else {
            unlockedIndices.push(c);
            unlockedValues.push(row[c]);
          }
        }

        if (unlockedIndices.length <= 1) continue;

        const effectiveStep = step % unlockedValues.length;
        const rotatedValues = unlockedValues.slice(-effectiveStep).concat(unlockedValues.slice(0, -effectiveStep));

        for (let i = 0; i < unlockedIndices.length; i++) {
          row[unlockedIndices[i]] = rotatedValues[i];
        }
      }

      selectedSeat.value = null;
      saveToStorage();
      showToast(hasLocked ? '大组已成功向右平移轮换（锁定座位保持固定）！' : '大组已成功向右平移轮换！');
    }

    function rotateRowsForward() {
      showRotateMenu.value = false;
      const matrix = currentClass.value.matrix;
      const rows = rowsCount.value;
      const cols = colsCount.value;
      if (rows <= 1) return;

      let hasLocked = false;
      for (let c = 0; c < cols; c++) {
        const unlockedRowIndices = [];
        const unlockedValues = [];
        for (let r = 0; r < rows; r++) {
          if (matrix[r][c] && matrix[r][c].is_locked) {
            hasLocked = true;
          } else {
            unlockedRowIndices.push(r);
            unlockedValues.push(matrix[r][c]);
          }
        }

        if (unlockedRowIndices.length <= 1) continue;

        const rotatedValues = unlockedValues.slice(1).concat(unlockedValues.slice(0, 1));
        for (let i = 0; i < unlockedRowIndices.length; i++) {
          matrix[unlockedRowIndices[i]][c] = rotatedValues[i];
        }
      }

      selectedSeat.value = null;
      saveToStorage();
      showToast(hasLocked ? '前后排已向前轮换（锁定座位保持固定）！' : '前后排已向前轮换（第1排移至最后排）！');
    }

    // ---- 规格预设与增减行列 ----
    function applyPreset(preset) {
      if (!currentClass.value) return;
      const newRows = preset.rows;
      const newCols = preset.cols;
      const newMode = preset.mode;

      // 提取锁定座位与未锁定学生
      const lockedMap = new Map();
      const unlockedSeated = [];
      currentClass.value.matrix.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell && cell.student_id) {
            if (cell.is_locked && r < newRows && c < newCols) {
              lockedMap.set(`${r},${c}`, cell);
            } else {
              unlockedSeated.push(cell);
            }
          }
        });
      });

      // 构建新矩阵
      const newMatrix = [];
      let uIdx = 0;
      for (let r = 0; r < newRows; r++) {
        const rowArr = [];
        for (let c = 0; c < newCols; c++) {
          const lockedCell = lockedMap.get(`${r},${c}`);
          if (lockedCell) {
            rowArr.push(lockedCell);
          } else if (uIdx < unlockedSeated.length) {
            rowArr.push(unlockedSeated[uIdx++]);
          } else {
            rowArr.push(null);
          }
        }
        newMatrix.push(rowArr);
      }

      currentClass.value.rows = newRows;
      currentClass.value.cols = newCols;
      currentClass.value.layout_mode = newMode;
      currentClass.value.matrix = newMatrix;

      selectedSeat.value = null;
      saveToStorage();
      showToast(`已切换至【${preset.name}】规格！`);
    }

    function adjustRows(delta) {
      const curRows = rowsCount.value;
      const curCols = colsCount.value;
      const targetRows = curRows + delta;
      if (targetRows < 1 || targetRows > 25) return;

      if (delta > 0) {
        currentClass.value.matrix.push(Array(curCols).fill(null));
      } else {
        currentClass.value.matrix.pop();
      }
      currentClass.value.rows = targetRows;
      saveToStorage();
    }

    function adjustCols(delta) {
      const curCols = colsCount.value;
      const targetCols = curCols + delta;
      if (targetCols < 1 || targetCols > 20) return;

      if (delta > 0) {
        currentClass.value.matrix.forEach(row => row.push(null));
      } else {
        currentClass.value.matrix.forEach(row => row.pop());
      }
      currentClass.value.cols = targetCols;
      saveToStorage();
    }

    // ---- 打卡 / 点名模式 ----
    function toggleCheckin(r, c) {
      const cell = currentClass.value.matrix[r][c];
      if (!cell) return;
      cell.is_completed = !cell.is_completed;
      saveToStorage();

      if (stats.value.checkinDone === stats.value.seated && stats.value.seated > 0) {
        showToast('🎉 全班已全部到齐/过关！太棒了！');
      }
    }

    function markAllCheckin(status) {
      currentClass.value.matrix.forEach(row => {
        row.forEach(cell => {
          if (cell) cell.is_completed = status;
        });
      });
      saveToStorage();
      showToast(status ? '已标记全部学生已到/过关！' : '已重置打卡状态！');
    }

    // ---- 导出功能 (高分辨率图片 Canvas、Excel、TXT、JSON) ----
    
    // 1. 导出高分辨率图片 (纯离线 Canvas 绘制，保证 file:// 下绝对清晰且绝不跨域报错)
    function exportSeatingChartImage() {
      const cls = currentClass.value;
      if (!cls) return;

      const matrix = cls.matrix;
      const rows = rowsCount.value;
      const cols = colsCount.value;
      const mode = currentLayoutMode.value;
      const isTeacherView = perspectiveMode.value === 'teacher';

      // 布局参数
      const cellW = 100;
      const cellH = 80;
      const rowGap = 12;
      const baseColGap = 8;
      const aisleGap = mode === 'double' ? 30 : mode === 'triple' ? 30 : mode === 'single' ? 22 : 8;

      // 计算总宽度
      let totalGridW = 0;
      const colLefts = [];
      let curX = 0;
      for (let c = 0; c < cols; c++) {
        colLefts.push(curX);
        curX += cellW;
        if (c < cols - 1) {
          if (mode === 'double' && c % 2 === 1) curX += aisleGap;
          else if (mode === 'triple' && c % 3 === 2) curX += aisleGap;
          else if (mode === 'single') curX += aisleGap;
          else curX += baseColGap;
        }
      }
      totalGridW = curX;

      const paddingX = 80;
      const paddingY = 60;
      const headerH = 140; // 标题与黑板区域
      const footerH = 80;  // 统计与图例

      const canvasW = Math.max(totalGridW + paddingX * 2 + 60, 960);
      const canvasH = headerH + rows * (cellH + rowGap) + footerH + paddingY * 2;

      const dpr = 2; // 2x 超高清
      const canvas = document.createElement('canvas');
      canvas.width = canvasW * dpr;
      canvas.height = canvasH * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // 背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);

      // 外框装饰
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(16, 16, canvasW - 32, canvasH - 32);

      // 标题
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      const viewTitleTag = isTeacherView ? '【老师视角·站讲台看全班】' : '【学生视角·教室平面图】';
      ctx.fillText(`${cls.name} · 可视化班级座位表 ${viewTitleTag}`, canvasW / 2, paddingY + 10);

      // 副标题
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      const nowStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
      ctx.fillText(`规格：${rows}排 × ${cols}列 (${mode === 'double' ? '双人桌' : mode === 'single' ? '单人桌' : '三人桌'})  |  全班：${stats.value.total}人 (就座:${stats.value.seated}，固定:${stats.value.locked})  |  导出时间：${nowStr}`, canvasW / 2, paddingY + 34);

      // 顶部条带
      const podiumW = Math.min(totalGridW * 0.65, 480);
      const podiumH = 34;
      const podiumX = (canvasW - podiumW) / 2;
      const podiumY = paddingY + 54;

      if (!isTeacherView) {
        // 学生视角：上方为讲台黑板
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, podiumX, podiumY, podiumW, podiumH, 8);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('【 讲 台 · 黑 板 方 向 】', canvasW / 2, podiumY + 22);
      } else {
        // 老师视角：上方为教室后黑板/后门
        ctx.fillStyle = '#475569';
        roundRect(ctx, podiumX, podiumY, podiumW, podiumH, 8);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('【 教 室 后 板 报 · 教室后门方向 】', canvasW / 2, podiumY + 22);
      }

      const gridStartX = (canvasW - totalGridW) / 2 + 25;
      const gridStartY = paddingY + headerH;

      // 绘制座位卡片
      for (let vr = 0; vr < rows; vr++) {
        const y = gridStartY + vr * (cellH + rowGap);
        // 根据视角计算真实的矩阵行 r
        const realR = isTeacherView ? (rows - 1 - vr) : vr;

        // 排号标签
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`第${realR + 1}排`, gridStartX - 16, y + cellH / 2 + 4);

        for (let vc = 0; vc < cols; vc++) {
          const x = gridStartX + colLefts[vc];
          // 根据视角计算真实的矩阵列 c
          const realC = isTeacherView ? (cols - 1 - vc) : vc;
          const cell = matrix[realR] ? matrix[realR][realC] : null;

          if (cell && cell.name) {
            const isBoy = cell.gender === '男';
            // 卡片背景
            ctx.fillStyle = isBoy ? '#eff6ff' : '#fdf2f8';
            roundRect(ctx, x, y, cellW, cellH, 8);
            ctx.fill();

            // 边框 (锁定卡片使用醒目橙金边框)
            ctx.strokeStyle = cell.is_locked ? '#f59e0b' : (isBoy ? '#bfdbfe' : '#fbcfe8');
            ctx.lineWidth = cell.is_locked ? 1.8 : 1.2;
            roundRect(ctx, x, y, cellW, cellH, 8);
            ctx.stroke();

            // 学号
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`#${cell.student_no || ''}`, x + 12, y + 19);

            // 锁定角标
            if (cell.is_locked) {
              ctx.fillStyle = '#b45309';
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'right';
              ctx.fillText('🔒', x + cellW - 10, y + 19);
            }

            // 学生姓名
            ctx.fillStyle = isBoy ? '#1e3a8a' : '#831843';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(cell.name, x + cellW / 2, y + 46);

            // 标签或职务
            if (cell.tags) {
              ctx.fillStyle = isBoy ? '#dbeafe' : '#fce7f3';
              roundRect(ctx, x + 12, y + 56, cellW - 24, 16, 4);
              ctx.fill();
              ctx.fillStyle = isBoy ? '#1e40af' : '#9d174d';
              ctx.font = '9px sans-serif';
              ctx.fillText(cell.tags, x + cellW / 2, y + 68);
            }
          } else {
            // 空位
            ctx.fillStyle = '#f8fafc';
            roundRect(ctx, x, y, cellW, cellH, 8);
            ctx.fill();

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            roundRect(ctx, x, y, cellW, cellH, 8);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('空位', x + cellW / 2, y + cellH / 2 + 4);
          }
        }
      }

      // 如果是老师视角，在最下方绘制老师讲台
      const footerY = gridStartY + rows * (cellH + rowGap) + 16;
      if (isTeacherView) {
        ctx.fillStyle = '#1e293b';
        roundRect(ctx, podiumX, footerY, podiumW, podiumH, 8);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px sans-serif';
        ctx.letterSpacing = '3px';
        ctx.fillText('【 讲 台 · 老师站位（面向学生·视线对应） 】', canvasW / 2, footerY + 22);
      }

      // 底部图例
      const legendY = isTeacherView ? (footerY + podiumH + 18) : footerY;
      ctx.fillStyle = '#64748b';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';

      // 男生图例
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(canvasW / 2 - 190, legendY + 6, 12, 12);
      ctx.fillStyle = '#334155';
      ctx.fillText('男生座位', canvasW / 2 - 145, legendY + 16);

      // 女生图例
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(canvasW / 2 - 90, legendY + 6, 12, 12);
      ctx.fillStyle = '#334155';
      ctx.fillText('女生座位', canvasW / 2 - 45, legendY + 16);

      // 空位图例
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(canvasW / 2 + 10, legendY + 6, 12, 12);
      ctx.fillStyle = '#334155';
      ctx.fillText('空位', canvasW / 2 + 40, legendY + 16);

      // 锁定图例
      ctx.fillStyle = '#b45309';
      ctx.fillText('🔒 锁定固定', canvasW / 2 + 130, legendY + 16);

      // 下载图片
      try {
        const link = document.createElement('a');
        const viewFileTag = isTeacherView ? '老师视角' : '学生视角';
        link.download = `${cls.name}_座位安排表_${viewFileTag}_${nowStr}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`超高清座位表图片已成功导出（${viewFileTag}）！`);
      } catch (err) {
        console.error('Canvas export error:', err);
        alert('导出图片失败：' + err.message);
      }
    }

    // 辅助圆角矩形绘制
    function roundRect(ctx, x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    // 截取 DOM 视图图片 (html2canvas)
    function exportDomScreenshot() {
      if (typeof html2canvas === 'undefined') {
        exportSeatingChartImage();
        return;
      }
      const element = document.getElementById('seatingCanvasContainer');
      if (!element) return;

      showToast('正在生成网页界面截图...');
      html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const cls = currentClass.value;
        const nowStr = new Date().toISOString().slice(0, 10);
        const link = document.createElement('a');
        link.download = `${cls ? cls.name : '班级'}_网页界面截图_${nowStr}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('界面截图已成功导出！');
      }).catch(err => {
        console.error('html2canvas error:', err);
        exportSeatingChartImage();
      });
    }

    // 2. 导出 Excel 表格 (.xlsx)
    function exportToExcel() {
      if (typeof XLSX === 'undefined') {
        alert('未检测到本地 Excel 库，正在转为导出 TXT 文件！');
        exportToTxt();
        return;
      }

      const cls = currentClass.value;
      if (!cls) return;

      const wb = XLSX.utils.book_new();

      // Sheet 1: 班级可视化座位表
      const matrixData = [];
      matrixData.push([`【 ${cls.name} 座位安排表 】`]);
      matrixData.push(['【 讲 台 · 黑 板 方 向 】']);

      // 组标题行
      const groupRow = [''];
      groupColumnsInfo.value.forEach(g => {
        for (let i = 0; i < g.colSpan; i++) {
          groupRow.push(i === 0 ? g.name : '');
        }
      });
      matrixData.push(groupRow);

      // 列号标题行
      const colHeader = ['排号'];
      for (let c = 0; c < colsCount.value; c++) {
        colHeader.push(`第${c + 1}列`);
      }
      matrixData.push(colHeader);

      // 排数据
      cls.matrix.forEach((row, r) => {
        const rowArr = [`第${r + 1}排`];
        row.forEach(cell => {
          if (cell && cell.name) {
            const lockTag = cell.is_locked ? ' [固定]' : '';
            rowArr.push(`${cell.name} (#${cell.student_no} ${cell.gender})${lockTag}`);
          } else {
            rowArr.push('【空位】');
          }
        });
        matrixData.push(rowArr);
      });

      const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(wb, wsMatrix, '班级可视化座位表');

      // Sheet 2: 学生座次与花名册明细
      const detailHeaders = ['学号', '姓名', '性别', '当前排', '当前列', '是否锁定', '职务/标签', '打卡状态', '备注'];
      const detailData = [detailHeaders];

      // 建立已就座索引映射
      const seatPosMap = new Map();
      cls.matrix.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell && cell.student_id) {
            seatPosMap.set(cell.student_id, { row: r + 1, col: c + 1, locked: !!cell.is_locked, completed: cell.is_completed });
          }
        });
      });

      cls.students.forEach(s => {
        const pos = seatPosMap.get(s.id);
        detailData.push([
          s.student_no || '',
          s.name,
          s.gender,
          pos ? `第 ${pos.row} 排` : '未排座',
          pos ? `第 ${pos.col} 列` : '未排座',
          pos ? (pos.locked ? '已锁定固定' : '未锁定') : '-',
          s.tags || '',
          pos ? (pos.completed ? '已过关' : '未打卡') : '-',
          s.remark || ''
        ]);
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, '学生花名册与座次');

      // 下载
      const nowStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `${cls.name}_座位安排表_${nowStr}.xlsx`);
      showToast('Excel 表格已成功导出！');
    }

    // 3. 导出 TXT 文本表格
    function exportToTxt() {
      const cls = currentClass.value;
      if (!cls) return;

      const lines = [];
      lines.push('========================================================================');
      lines.push(`               ${cls.name} 座位安排表 (离线版)`);
      lines.push(`  规格: ${rowsCount.value}排 × ${colsCount.value}列  |  总人数: ${stats.value.total}人  |  就座: ${stats.value.seated}人 (固定: ${stats.value.locked}人)`);
      lines.push('========================================================================');
      lines.push('');
      lines.push('                      【 讲 台 · 黑 板 方 向 】');
      lines.push('');

      cls.matrix.forEach((row, r) => {
        const rowItems = row.map((cell, c) => {
          let name = cell && cell.name ? (cell.name + (cell.is_locked ? '[锁]' : '')) : '  空位  ';
          if (name.length === 2) name = name[0] + '  ' + name[1];
          return name.padEnd(9, ' ');
        });

        // 插入大组间隔
        let rowStr = `第${r + 1}排:  `;
        const mode = currentLayoutMode.value;
        const groupStep = mode === 'double' ? 2 : mode === 'triple' ? 3 : 1;

        for (let i = 0; i < rowItems.length; i++) {
          rowStr += rowItems[i];
          if ((i + 1) % groupStep === 0 && i < rowItems.length - 1) {
            rowStr += '  |走道|  ';
          }
        }
        lines.push(rowStr);
      });

      lines.push('');
      lines.push('------------------------------------------------------------------------');
      lines.push('未安排座位的学生:');
      if (unseatedStudents.value.length === 0) {
        lines.push('（无，全员已就座）');
      } else {
        const unseatedNames = unseatedStudents.value.map(s => `${s.name}(#${s.student_no})`).join('、 ');
        lines.push(unseatedNames);
      }
      lines.push('------------------------------------------------------------------------');

      const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.download = `${cls.name}_座位安排表.txt`;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('TXT 文本座位表已成功导出！');
    }

    // ---- 班级管理 ----
    function openCreateClassModal() {
      classModalMode.value = 'create';
      classForm.name = '';
      classForm.grade = '三年级';
      classForm.subject = '语文';
      showClassModal.value = true;
    }

    function openEditClassModal() {
      if (!currentClass.value) return;
      classModalMode.value = 'edit';
      classForm.name = currentClass.value.name;
      classForm.grade = currentClass.value.grade || '三年级';
      classForm.subject = currentClass.value.subject || '语文';
      showClassModal.value = true;
    }

    function saveClassModal() {
      if (!classForm.name.trim()) {
        alert('请输入班级名称！');
        return;
      }

      if (classModalMode.value === 'create') {
        const newId = Date.now();
        const newCls = {
          id: newId,
          name: classForm.name.trim(),
          grade: classForm.grade,
          subject: classForm.subject,
          layout_mode: 'double',
          rows: 7,
          cols: 8,
          students: [],
          matrix: Array.from({ length: 7 }, () => Array(8).fill(null))
        };
        classes.value.push(newCls);
        currentClassId.value = newId;
        showToast(`已创建班级【${newCls.name}】！`);
      } else {
        if (currentClass.value) {
          currentClass.value.name = classForm.name.trim();
          currentClass.value.grade = classForm.grade;
          currentClass.value.subject = classForm.subject;
          showToast('班级信息已更新！');
        }
      }

      showClassModal.value = false;
      saveToStorage();
    }

    function deleteCurrentClass() {
      if (classes.value.length <= 1) {
        alert('系统至少保留一个班级！');
        return;
      }
      if (!confirm(`确定要删除班级【${currentClass.value.name}】吗？删除后该班级花名册和排座将不可恢复！`)) return;

      const idx = classes.value.findIndex(c => c.id === currentClassId.value);
      if (idx !== -1) {
        classes.value.splice(idx, 1);
        currentClassId.value = classes.value[0].id;
        saveToStorage();
        showToast('班级已删除！');
      }
    }

    // ---- 花名册管理 ----
    function openAddStudentModal() {
      studentModalMode.value = 'add';
      const maxNo = (currentClass.value.students || []).reduce((max, s) => {
        const n = parseInt(s.student_no, 10);
        return !isNaN(n) && n > max ? n : max;
      }, 0);
      studentForm.id = null;
      studentForm.student_no = String(maxNo + 1).padStart(2, '0');
      studentForm.name = '';
      studentForm.gender = '男';
      studentForm.tags = '';
      studentForm.remark = '';
      showStudentModal.value = true;
    }

    function openEditStudentModal(s) {
      studentModalMode.value = 'edit';
      studentForm.id = s.id;
      studentForm.student_no = s.student_no;
      studentForm.name = s.name;
      studentForm.gender = s.gender;
      studentForm.tags = s.tags || '';
      studentForm.remark = s.remark || '';
      showStudentModal.value = true;
    }

    function saveStudentModal() {
      if (!studentForm.name.trim()) {
        alert('请输入学生姓名！');
        return;
      }

      if (studentModalMode.value === 'add') {
        const newId = Date.now();
        currentClass.value.students.push({
          id: newId,
          student_no: studentForm.student_no.trim() || String(currentClass.value.students.length + 1).padStart(2, '0'),
          name: studentForm.name.trim(),
          gender: studentForm.gender,
          tags: studentForm.tags.trim(),
          remark: studentForm.remark.trim()
        });
        showToast(`已添加学生【${studentForm.name}】！`);
      } else {
        const target = currentClass.value.students.find(s => s.id === studentForm.id);
        if (target) {
          target.name = studentForm.name.trim();
          target.student_no = studentForm.student_no.trim();
          target.gender = studentForm.gender;
          target.tags = studentForm.tags.trim();
          target.remark = studentForm.remark.trim();

          // 同步更新座位网格中的信息
          currentClass.value.matrix.forEach(row => {
            row.forEach(cell => {
              if (cell && cell.student_id === target.id) {
                cell.name = target.name;
                cell.student_no = target.student_no;
                cell.gender = target.gender;
                cell.tags = target.tags;
              }
            });
          });
          showToast('学生信息已更新！');
        }
      }

      showStudentModal.value = false;
      saveToStorage();
    }

    function deleteStudent(studentId) {
      const s = currentClass.value.students.find(item => item.id === studentId);
      if (!confirm(`确定要从花名册中删除学生【${s ? s.name : ''}】吗？若已就座将同时移出座位。`)) return;

      currentClass.value.students = currentClass.value.students.filter(item => item.id !== studentId);
      currentClass.value.matrix.forEach(row => {
        row.forEach((cell, idx) => {
          if (cell && cell.student_id === studentId) {
            row[idx] = null;
          }
        });
      });

      saveToStorage();
      showToast('学生已删除！');
    }

    // 批量快速粘贴录入
    function openBatchAddModal() {
      batchAddText.value = '';
      showBatchAddModal.value = true;
    }

    function parseBatchAdd() {
      const text = batchAddText.value.trim();
      if (!text) {
        alert('请输入或粘贴学生名单！');
        return;
      }

      const lines = text.split(/[\r\n]+/);
      let addedCount = 0;
      let curMaxNo = (currentClass.value.students || []).reduce((max, s) => {
        const n = parseInt(s.student_no, 10);
        return !isNaN(n) && n > max ? n : max;
      }, 0);

      lines.forEach(rawLine => {
        const line = rawLine.trim();
        if (!line) return;

        const tokens = line.split(/[\t,，\s]+/).filter(Boolean);
        if (tokens.length === 0) return;

        let no = '';
        let name = '';
        let gender = '男';

        if (/^\d+$/.test(tokens[0])) {
          no = tokens[0];
          name = tokens[1] || '';
          if (tokens[2] && (tokens[2] === '女' || tokens[2] === '男')) gender = tokens[2];
        } else {
          name = tokens[0];
          if (tokens[1] && /^\d+$/.test(tokens[1])) no = tokens[1];
          if (tokens[1] && (tokens[1] === '女' || tokens[1] === '男')) gender = tokens[1];
          if (tokens[2] && (tokens[2] === '女' || tokens[2] === '男')) gender = tokens[2];
        }

        if (!no) {
          curMaxNo++;
          no = String(curMaxNo).padStart(2, '0');
        }
        if (!name) return;

        currentClass.value.students.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          student_no: no,
          name: name,
          gender: gender,
          tags: '',
          remark: ''
        });
        addedCount++;
      });

      showBatchAddModal.value = false;
      saveToStorage();
      showToast(`成功批量录入 ${addedCount} 名学生！`);
    }

    // 从 Excel 导入花名册
    function triggerImportExcel() {
      if (typeof XLSX === 'undefined') {
        alert('本地缺少 XLSX 解析库！');
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx, .xls';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rows.length <= 1) {
              alert('表格中未检测到有效数据！');
              return;
            }

            // 查找表头
            const header = rows[0];
            let nameCol = header.findIndex(h => /姓名|名字|学生/.test(String(h)));
            let noCol = header.findIndex(h => /学号|序号|编号/.test(String(h)));
            let genderCol = header.findIndex(h => /性别/.test(String(h)));

            if (nameCol === -1) nameCol = 0;

            let added = 0;
            let curMaxNo = (currentClass.value.students || []).reduce((max, s) => {
              const n = parseInt(s.student_no, 10);
              return !isNaN(n) && n > max ? n : max;
            }, 0);

            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              if (!row || !row[nameCol]) continue;
              const name = String(row[nameCol]).trim();
              let no = noCol !== -1 && row[noCol] ? String(row[noCol]).trim() : '';
              let gender = genderCol !== -1 && row[genderCol] ? String(row[genderCol]).trim() : (added % 2 === 0 ? '男' : '女');
              if (gender !== '男' && gender !== '女') gender = '男';

              if (!no) {
                curMaxNo++;
                no = String(curMaxNo).padStart(2, '0');
              }

              currentClass.value.students.push({
                id: Date.now() + Math.floor(Math.random() * 10000) + i,
                student_no: no,
                name: name,
                gender: gender,
                tags: '',
                remark: ''
              });
              added++;
            }

            saveToStorage();
            showToast(`成功从 Excel 导入 ${added} 名学生！`);
          } catch (err) {
            alert('读取 Excel 失败：' + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      };
      input.click();
    }

    // ---- 课堂抽签点名器 ----
    function startRandomPicker() {
      const candidates = pickerState.onlySeated ? seatedStudentsList.value.map(item => item.student) : currentClass.value.students;
      if (!candidates || candidates.length === 0) {
        alert('当前没有可供抽选的学生！');
        return;
      }

      if (pickerState.running) {
        // 停止抽选
        clearInterval(pickerTimer);
        pickerState.running = false;
        if (pickerState.candidate) {
          pickerState.history.unshift({
            time: new Date().toLocaleTimeString(),
            student: pickerState.candidate
          });
          if (pickerState.history.length > 8) pickerState.history.pop();
        }
        return;
      }

      // 开始抽选动画
      pickerState.running = true;
      let count = 0;
      pickerTimer = setInterval(() => {
        const randomIdx = Math.floor(Math.random() * candidates.length);
        pickerState.candidate = candidates[randomIdx];
        count++;
        if (count > 25) {
          clearInterval(pickerTimer);
          pickerState.running = false;
          pickerState.history.unshift({
            time: new Date().toLocaleTimeString(),
            student: pickerState.candidate
          });
          if (pickerState.history.length > 8) pickerState.history.pop();
        }
      }, 80);
    }

    // ---- 生命周期初始化 ----
    onMounted(() => {
      loadFromStorage();

      // 点击外部关闭下拉菜单
      window.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
          showSmartArrangeMenu.value = false;
          showRotateMenu.value = false;
          isExportMenuOpen.value = false;
        }
      });
    });

    return {
      activeTab,
      seatMode,
      perspectiveMode,
      classes,
      currentClassId,
      currentClass,
      rowsCount,
      colsCount,
      currentLayoutMode,
      layoutPresets,
      unseatedStudents,
      seatedStudentsList,
      stats,
      groupColumnsInfo,
      displayRows,
      displayGroupHeaders,
      selectedSeat,
      dragOverCell,
      dragSource,
      isDragOverPool,
      toastMessage,

      // 历史备份管理
      historyBackups,
      showHistoryModal,
      backupNoteInput,
      openHistoryModal,
      createHistoryBackup,
      restoreHistoryBackup,
      deleteHistoryBackup,
      renameHistoryBackup,
      exportSingleBackup,
      exportAllHistoryBackups,
      importHistoryBackupsFile,
      clearAllHistoryBackups,

      // 下拉与弹窗
      showSmartArrangeMenu,
      showRotateMenu,
      isExportMenuOpen,
      showLayoutModal,
      showAssignModal,
      assignTarget,
      assignSearch,
      filteredAssignUnseated,
      filteredAssignSeated,
      showClassModal,
      classModalMode,
      classForm,
      showStudentModal,
      studentModalMode,
      studentForm,
      showBatchAddModal,
      batchAddText,
      rosterSearch,
      filteredRoster,
      pickerState,

      // 方法
      showToast,
      resetToDemoData,
      getColMarginStyle,
      toggleSeatLock,
      unlockAllSeats,
      handleSeatClick,
      selectPoolStudent,
      cancelSelection,
      removeSeatStudent,
      onDragStartSeat,
      onDragStartPool,
      onDragOver,
      onDragLeave,
      onDrop,
      onDragEnd,
      onDragOverPool,
      onDragLeavePool,
      onDropToPool,
      openAssignModal,
      assignStudentToTarget,

      // 算法与轮换
      autoArrangeByStudentNo,
      autoArrangeByGenderAlternate,
      autoArrangeRandom,
      fillRemainingSeats,
      clearAllSeats,
      rotateLeft,
      rotateRight,
      rotateRowsForward,

      // 规格调节
      applyPreset,
      adjustRows,
      adjustCols,

      // 打卡
      toggleCheckin,
      markAllCheckin,

      // 导出
      exportSeatingChartImage,
      exportDomScreenshot,
      exportToExcel,
      exportToTxt,

      // 班级与花名册
      openCreateClassModal,
      openEditClassModal,
      saveClassModal,
      deleteCurrentClass,
      openAddStudentModal,
      openEditStudentModal,
      saveStudentModal,
      deleteStudent,
      openBatchAddModal,
      parseBatchAdd,
      triggerImportExcel,

      // 抽选点名
      startRandomPicker
    };
  }
}).mount('#app');
