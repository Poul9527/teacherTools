/**
 * 学生任务管理系统 - 核心逻辑模块 (纯离线运行，零外网依赖)
 * 特色：座位图与待完成合一、无冗余头像、完成与排行榜直接合并
 */

class StudentTaskManager {
  constructor() {
    this.storageKey = 'student_task_system_v2_manage2_data';
    this.state = null;
    this.filterKeyword = '';
    this.isCompactMode = false;
    this.perspective = 'teacher'; // 'teacher' (教师视角) 或 'student' (学生视角)
    const userPicked = localStorage.getItem('task_system_seat_shape_picked_v2');
    this.seatShape = userPicked ? (localStorage.getItem('task_system_seat_shape_v2') || 'flower') : 'flower'; // 默认'flower' (花瓣)
    
    // 座位拖拽换位置状态
    this.draggedSeat = null;
    this.isDraggingNow = false;

    // 随机抽查状态
    this.lotteryTimer = null;
    this.lotteryScope = 'pending';
    this.currentSelectedStudent = null;

    // Excel 临时解析缓存
    this.pendingParsedWorkbook = null;

    // 简易音频合成器 (Web Audio API)
    this.audioCtx = null;

    this.init();
  }

  /* ================= 初始化与数据持久化 ================= */
  init() {
    this.loadState();
    this.renderClassDropdown();
    this.renderCurrentClass();
    this.setupKeyboardShortcuts();
    const shapeSel = document.getElementById('seatShapeSelect');
    if (shapeSel) shapeSel.value = this.seatShape;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    return this.audioCtx;
  }

  playBeep(type = 'success') {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'toggle') {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'fanfare') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // 忽略音频限制
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.state = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('读取本地存储失败，使用默认演示数据', e);
    }

    if (!this.state || !this.state.classes || this.state.classes.length === 0) {
      this.state = JSON.parse(JSON.stringify(window.MOCK_DATA));
      this.saveState();
    }

    // 确保导入或已有的班级默认自动按学号/顺序排好 8 列座位
    if (this.state && Array.isArray(this.state.classes)) {
      this.state.classes.forEach(c => {
        if (c.students && c.students.length > 0) {
          if (!c.seating || !c.seating.seats || Object.keys(c.seating.seats).length === 0) {
            this.autoArrangeSeats(c, true);
          }
        }
      });
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('存储状态失败:', e);
      this.showToast('本地存储空间不足或保存受阻', 'error');
    }
  }

  getCurrentClass() {
    let cls = this.state.classes.find(c => c.id === this.state.currentClassId);
    if (!cls && this.state.classes.length > 0) {
      cls = this.state.classes[0];
      this.state.currentClassId = cls.id;
    }
    return cls;
  }

  getCurrentTask() {
    const cls = this.getCurrentClass();
    if (!cls) return null;
    if (!cls.tasks || cls.tasks.length === 0) {
      cls.tasks = [{
        id: 'task_' + Date.now(),
        name: '课堂任务',
        category: '背书',
        createTime: this.formatDate(new Date()),
        completedStudents: []
      }];
      cls.activeTaskId = cls.tasks[0].id;
    }
    return cls.tasks.find(t => t.id === cls.activeTaskId) || cls.tasks[0];
  }

  /* ================= 班级管理 ================= */
  renderClassDropdown() {
    const select = document.getElementById('classSelect');
    if (!select) return;
    select.innerHTML = '';
    this.state.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.students ? c.students.length : 0}人)`;
      if (c.id === this.state.currentClassId) opt.selected = true;
      select.appendChild(opt);
    });
  }

  switchClass(classId) {
    this.state.currentClassId = classId;
    this.saveState();
    this.renderCurrentClass();
    this.showToast(`已切换至班级：${this.getCurrentClass().name}`, 'info');
  }

  createNewClass() {
    const input = document.getElementById('newClassNameInput');
    const name = (input.value || '').trim();
    if (!name) {
      this.showToast('请输入班级名称', 'error');
      return;
    }
    const newClassId = 'class_' + Date.now();
    const newClass = {
      id: newClassId,
      name: name,
      grade: '默认年级',
      subject: '综合',
      students: [],
      tasks: [{
        id: 'task_' + Date.now(),
        name: '新任务',
        category: '背书',
        createTime: this.formatDate(new Date()),
        completedStudents: []
      }],
      activeTaskId: null,
      seating: { rows: 6, cols: 8, seats: {} }
    };
    newClass.activeTaskId = newClass.tasks[0].id;

    this.state.classes.push(newClass);
    this.state.currentClassId = newClassId;
    input.value = '';
    this.saveState();
    this.renderClassDropdown();
    this.renderClassListManage();
    this.renderCurrentClass();
    this.showToast(`班级【${name}】创建成功！`, 'success');
  }

  renderClassListManage() {
    const list = document.getElementById('classListContainer');
    if (!list) return;
    list.innerHTML = '';
    this.state.classes.forEach((c) => {
      const item = document.createElement('div');
      item.className = 'sheet-item-row';
      item.innerHTML = `
        <div>
          <strong>${c.name}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">(${c.students.length}名学生, ${c.tasks.length}个任务)</span>
        </div>
        <div style="display:flex; gap:0.35rem;">
          <button class="btn btn-subtle btn-sm" onclick="app.renameClassPrompt('${c.id}')">重命名</button>
          <button class="btn btn-danger-outline btn-sm" onclick="app.deleteClass('${c.id}')">删除</button>
        </div>
      `;
      list.appendChild(item);
    });
  }

  renameClassPrompt(classId) {
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return;
    const newName = prompt('请输入新的班级名称：', cls.name);
    if (newName && newName.trim()) {
      cls.name = newName.trim();
      this.saveState();
      this.renderClassDropdown();
      this.renderClassListManage();
      this.renderCurrentClass();
      this.showToast('班级重命名成功', 'success');
    }
  }

  deleteClass(classId) {
    if (this.state.classes.length <= 1) {
      this.showToast('系统至少需保留一个班级，无法删除', 'error');
      return;
    }
    const cls = this.state.classes.find(c => c.id === classId);
    if (!cls) return;
    if (!confirm(`确定要彻底删除班级【${cls.name}】及其所有记录吗？此操作不可逆！`)) return;

    this.state.classes = this.state.classes.filter(c => c.id !== classId);
    if (this.state.currentClassId === classId) {
      this.state.currentClassId = this.state.classes[0].id;
    }
    this.saveState();
    this.renderClassDropdown();
    this.renderClassListManage();
    this.renderCurrentClass();
    this.showToast(`班级【${cls.name}】已删除`, 'info');
  }

  resetClassAllTasksRecord() {
    const cls = this.getCurrentClass();
    if (!confirm(`警告：确定要清空【${cls.name}】的所有任务记录和完成历史吗？学生花名册将被保留。`)) return;

    cls.tasks = [{
      id: 'task_' + Date.now(),
      name: '开学新任务',
      category: '背书',
      createTime: this.formatDate(new Date()),
      completedStudents: []
    }];
    cls.activeTaskId = cls.tasks[0].id;
    this.saveState();
    this.renderCurrentClass();
    this.closeModal('classManageModal');
    this.showToast(`【${cls.name}】的任务记录已重置`, 'success');
  }

  /* ================= 主工作区渲染 (左栏任务列表 + 右栏班级座位图) ================= */
  renderCurrentClass() {
    const cls = this.getCurrentClass();
    if (!cls) return;

    // 更新人数徽章
    const countTag = document.getElementById('classStudentCountBadge');
    if (countTag) countTag.textContent = `${cls.students.length}人`;

    // 更新任务 Banner (统计数据居左醒目呈现)
    const task = this.getCurrentTask();
    if (task) {
      document.getElementById('currentTaskName').textContent = task.name;
      document.getElementById('taskCategoryBadge').textContent = task.category || '任务';
      document.getElementById('currentTaskTime').textContent = task.createTime || '-';

      const total = cls.students.length;
      const completedSet = new Set(task.completedStudents || []);
      const validCompletedCount = cls.students.filter(s => completedSet.has(s.id)).length;
      const pendingCount = Math.max(0, total - validCompletedCount);
      const rate = total > 0 ? Math.round((validCompletedCount / total) * 100) : 0;

      document.getElementById('statTotalStudents').textContent = total;
      document.getElementById('statCompletedStudents').textContent = validCompletedCount;
      document.getElementById('statPendingStudents').textContent = pendingCount;
      document.getElementById('statRatePercent').textContent = `${rate}%`;
      document.getElementById('taskProgressBarFill').style.width = `${rate}%`;

      document.getElementById('legendPendingCount').textContent = pendingCount;
      document.getElementById('legendDoneCount').textContent = validCompletedCount;
    }

    // 同步座位形状选择器
    const shapeSel = document.getElementById('seatShapeSelect');
    if (shapeSel) shapeSel.value = this.seatShape;

    // 核心双栏渲染：左侧任务管理专栏 + 右侧班级座位打卡区
    this.renderTaskSidebar();
    this.renderSeatingView();
  }

  /* ---------------- 座位图标形状切换 (课桌、气球、星星、花瓣) ---------------- */
  getShapeName(shape) {
    const map = {
      desk: '课桌 🪑',
      balloon: '气球 🎈',
      star: '星星 ⭐',
      flower: '花瓣 🌸'
    };
    return map[shape] || '课桌 🪑';
  }

  setSeatShape(shape) {
    this.seatShape = shape;
    localStorage.setItem('task_system_seat_shape', shape);
    localStorage.setItem('task_system_seat_shape_picked', '1');
    const sel = document.getElementById('seatShapeSelect');
    if (sel) sel.value = shape;
    this.renderSeatingView();
    this.showToast(`座位图标已切换为：${this.getShapeName(shape)}`, 'info');
  }

  /* ---------------- 视角切换：教师视角 vs 学生视角 ---------------- */
  togglePerspective() {
    this.perspective = (this.perspective === 'teacher') ? 'student' : 'teacher';
    const isTeacher = (this.perspective === 'teacher');
    
    const icon = document.getElementById('perspectiveIcon');
    const label = document.getElementById('perspectiveLabel');
    const podiumText = document.getElementById('classroomPodiumText');
    
    if (icon) icon.textContent = isTeacher ? '👨‍🏫' : '🧑‍🎓';
    if (label) label.textContent = isTeacher ? '教师视角' : '学生视角';
    if (podiumText) {
      podiumText.textContent = isTeacher 
        ? '黑 板 · 讲 台 (教师视角)' 
        : '黑 板 · 讲 台 (学生视角 - 左右已翻转)';
    }

    this.renderSeatingView();
    this.showToast(`已切换至：${isTeacher ? '教师视角(俯瞰)' : '学生视角(面对讲台，左右已翻转)'}`, 'info');
  }

  /* ---------------- 右栏：班级座位图 (支持课桌/气球/星星/花瓣形状、过道、视角翻转、大名字) ---------------- */
  renderSeatingView() {
    const cls = this.getCurrentClass();
    const task = this.getCurrentTask();
    if (!cls) return;

    let seating = cls.seating;
    if (!seating) {
      seating = { rows: 6, cols: 8, seats: {} };
      cls.seating = seating;
    }

    // 计算过道所在列（若未手动配置则默认 2-4-2 或三大组）
    let aisles = seating.aisles;
    if (!aisles || !Array.isArray(aisles) || aisles.length === 0) {
      if (seating.cols === 8) aisles = [2, 6];
      else if (seating.cols >= 6) aisles = [Math.floor(seating.cols / 3), Math.floor(seating.cols * 2 / 3)];
      else aisles = [];
    }
    const aisleSet = new Set(aisles);

    const completedSet = new Set(task ? (task.completedStudents || []) : []);
    const studentMap = new Map();
    cls.students.forEach(s => studentMap.set(s.id, s));

    const grid = document.getElementById('seatingGridContainer');
    grid.classList.toggle('compact', this.isCompactMode);
    const colWidth = this.isCompactMode ? '78px' : (this.seatShape === 'balloon' ? '98px' : '104px');
    grid.style.gridTemplateColumns = `repeat(${seating.cols}, ${colWidth})`;
    grid.innerHTML = '';

    const kw = this.filterKeyword;
    const isStudentPerspective = (this.perspective === 'student');

    // 列顺序：教师视角为 1 到 cols；学生视角面向讲台，左右镜像翻转（cols 递减到 1）
    const colList = [];
    if (isStudentPerspective) {
      for (let c = seating.cols; c >= 1; c--) colList.push(c);
    } else {
      for (let c = 1; c <= seating.cols; c++) colList.push(c);
    }

    for (let r = 1; r <= seating.rows; r++) {
      colList.forEach((c) => {
        const key = `${r}-${c}`;
        const stuId = seating.seats ? seating.seats[key] : null;
        const stu = stuId ? studentMap.get(stuId) : null;

        const cell = document.createElement('div');
        cell.className = `seat-cell shape-${this.seatShape}`;
        cell.dataset.row = r;
        cell.dataset.col = c;

        // 判断当前格右侧是否应渲染过道走廊
        if (!isStudentPerspective) {
          if (aisleSet.has(c)) cell.classList.add('has-aisle-right');
        } else {
          // 学生视角下，原本在 c 右侧的过道现在位于它的对称位置
          if (aisleSet.has(c - 1)) cell.classList.add('has-aisle-right');
        }

        // 统一支持拖拽作为放置目标 (Drop Target)
        cell.ondragover = (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        };

        cell.ondragenter = (e) => {
          e.preventDefault();
          if (this.draggedSeat && (this.draggedSeat.row !== r || this.draggedSeat.col !== c)) {
            cell.classList.add('drag-over');
          }
        };

        cell.ondragleave = (e) => {
          if (!cell.contains(e.relatedTarget)) {
            cell.classList.remove('drag-over');
          }
        };

        cell.ondrop = (e) => {
          e.preventDefault();
          cell.classList.remove('drag-over');
          if (!this.draggedSeat) return;

          const sourceR = this.draggedSeat.row;
          const sourceC = this.draggedSeat.col;
          if (sourceR === r && sourceC === c) return;

          const sourceKey = `${sourceR}-${sourceC}`;
          const targetKey = `${r}-${c}`;
          const targetStudentId = seating.seats ? seating.seats[targetKey] : null;
          const sourceStudentId = this.draggedSeat.studentId;
          const sourceName = this.draggedSeat.studentName;

          if (!seating.seats) seating.seats = {};
          seating.seats[sourceKey] = targetStudentId;
          seating.seats[targetKey] = sourceStudentId;

          this.saveState();
          this.renderSeatingView();
          this.playBeep('toggle');

          if (targetStudentId) {
            const targetStu = studentMap.get(targetStudentId);
            this.showToast(`已互换座位：【${sourceName}】 ↔ 【${targetStu ? targetStu.name : '学生'}】`, 'success');
          } else {
            this.showToast(`已将【${sourceName}】移至第 ${r} 排第 ${c} 列空位`, 'success');
          }
        };

        if (stu) {
          const isDone = completedSet.has(stu.id);
          cell.classList.add(isDone ? 'is-completed' : 'is-pending');
          cell.setAttribute('draggable', 'true');
          cell.title = `${stu.name}${stu.studentId ? ' (No.' + stu.studentId + ')' : ''}\n• 点击：打卡达标/取消\n• 拖拽：按住拖到其他座位即可互换位置`;

          // 拖拽发起事件
          cell.ondragstart = (e) => {
            this.isDraggingNow = true;
            this.draggedSeat = { row: r, col: c, studentId: stu.id, studentName: stu.name };
            e.dataTransfer.setData('text/plain', JSON.stringify({ row: r, col: c, studentId: stu.id }));
            e.dataTransfer.effectAllowed = 'move';
            cell.classList.add('is-dragging');
          };

          cell.ondragend = () => {
            cell.classList.remove('is-dragging');
            document.querySelectorAll('.seat-cell.drag-over').forEach(el => el.classList.remove('drag-over'));
            this.draggedSeat = null;
            setTimeout(() => {
              this.isDraggingNow = false;
            }, 100);
          };

          if (kw) {
            const match = stu.name.toLowerCase().includes(kw) || (stu.studentId && stu.studentId.toLowerCase().includes(kw));
            if (!match) cell.style.opacity = '0.2';
          }

          // 核心呈现：学号小标签 + 正中醒目大名字
          cell.innerHTML = `
            <span class="seat-student-id-tag">${stu.studentId ? 'No.' + stu.studentId : ''}</span>
            <div class="seat-student-name" title="${stu.name}">${stu.name}</div>
          `;

          cell.onclick = () => {
            if (this.isDraggingNow) return;
            this.toggleStudentStatus(stu.id);
          };
        } else {
          cell.classList.add('is-empty');
          cell.innerHTML = `<span style="font-size:0.72rem; color:var(--text-light);">${isStudentPerspective ? '' : r + '-' + c} 空</span>`;
          cell.title = '空座位 (可将其他学生拖拽至此)';
        }

        grid.appendChild(cell);
      });
    }
  }

  /* ================= 左栏：任务列表管理专栏渲染 ================= */
  renderTaskSidebar() {
    const cls = this.getCurrentClass();
    if (!cls) return;

    const badge = document.getElementById('sidebarTaskCountBadge');
    if (badge) badge.textContent = `${cls.tasks ? cls.tasks.length : 0}个`;

    const listContainer = document.getElementById('sidebarTaskList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (!cls.tasks || cls.tasks.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 2.5rem 0.5rem;">
          暂无任务<br><span style="font-size: 0.72rem;">可在上方输入名称并点击“➕”快速创建</span>
        </div>
      `;
      return;
    }

    const totalStudents = cls.students.length;

    // 提取任务时间戳辅助函数 (支持已完成时间或创建时间/id时间戳)
    const getTaskTime = (t) => {
      if (t.completedTime) return t.completedTime;
      const idMatch = String(t.id || '').match(/task_(\d+)/);
      if (idMatch) return parseInt(idMatch[1], 10);
      if (t.createTime) {
        const p = Date.parse(t.createTime.replace(/-/g, '/'));
        if (!isNaN(p)) return p;
      }
      return 0;
    };

    // 智能排序：
    // 1. 未全部完成任务排上方，已全员达标任务沉到最底下；
    // 2. 沉底已完成任务分组：严格按由新到旧降序排序 (最新达标/最新的排在已完成顶部，更早的在最底下)；
    // 3. 未完成任务分组：当前激活任务优先置顶，其余也按由新到旧排序。
    const sortedTasks = [...cls.tasks].sort((a, b) => {
      const aDone = a.completedStudents ? a.completedStudents.length : 0;
      const bDone = b.completedStudents ? b.completedStudents.length : 0;
      const aAllDone = totalStudents > 0 && aDone >= totalStudents;
      const bAllDone = totalStudents > 0 && bDone >= totalStudents;

      // 未完成在先，已完成沉底
      if (aAllDone !== bAllDone) {
        return aAllDone ? 1 : -1;
      }

      // 如果都是沉底的已全员达标任务：按由新到旧降序排序
      if (aAllDone && bAllDone) {
        return getTaskTime(b) - getTaskTime(a);
      }

      // 如果都是未完成任务：正在进行中的激活任务优先置顶
      if (a.id === cls.activeTaskId) return -1;
      if (b.id === cls.activeTaskId) return 1;

      // 其余未完成任务也按由新到旧降序排序
      return getTaskTime(b) - getTaskTime(a);
    });

    sortedTasks.forEach(t => {
      const isActive = (t.id === cls.activeTaskId);
      const doneCount = t.completedStudents ? t.completedStudents.length : 0;
      const isAllDone = totalStudents > 0 && doneCount >= totalStudents;
      const rate = totalStudents > 0 ? Math.round((doneCount / totalStudents) * 100) : 0;

      const card = document.createElement('div');
      card.className = `sidebar-task-item ${isActive ? 'is-active' : ''} ${isAllDone ? 'is-all-done' : ''}`;
      card.onclick = () => {
        if (!isActive) this.setActiveTask(t.id);
      };

      card.innerHTML = `
        <div class="task-item-header">
          <div style="display:flex; align-items:center; gap:0.3rem;">
            <span class="task-item-category-tag">${t.category || '任务'}</span>
            ${isActive ? '<span class="task-item-active-tag">进行中</span>' : ''}
            ${isAllDone ? '<span class="task-item-done-badge">✔ 已全员达标</span>' : ''}
          </div>
          <span class="task-item-time">${t.createTime ? t.createTime.slice(5) : ''}</span>
        </div>
        <div class="task-item-title" title="${t.name}">${t.name}</div>
        <div class="task-item-progress-row">
          <div class="task-item-progress-text">
            <span>达标 <strong>${doneCount}</strong>/${totalStudents}人</span>
            <span>${rate}%</span>
          </div>
          <div class="task-item-mini-bar">
            <div class="task-item-mini-fill" style="width: ${rate}%;"></div>
          </div>
        </div>
        <div class="task-item-actions">
          ${!isActive ? `<button class="task-item-btn" onclick="event.stopPropagation(); app.setActiveTask('${t.id}')">切换</button>` : ''}
          <button class="task-item-btn" onclick="event.stopPropagation(); app.renameTaskPrompt('${t.id}')">重命名</button>
          <button class="task-item-btn btn-delete" onclick="event.stopPropagation(); app.deleteTask('${t.id}')">删除</button>
        </div>
      `;

      listContainer.appendChild(card);
    });
  }

  /* ================= 任务流转与状态打卡 ================= */
  toggleStudentStatus(studentId) {
    const cls = this.getCurrentClass();
    const task = this.getCurrentTask();
    if (!cls || !task) return;

    if (!task.completedStudents) task.completedStudents = [];
    const idx = task.completedStudents.indexOf(studentId);

    if (idx === -1) {
      task.completedStudents.push(studentId);
      this.playBeep('success');
    } else {
      task.completedStudents.splice(idx, 1);
      this.playBeep('toggle');
    }

    // 维护全员达标完成时间
    const totalStudents = cls.students.length;
    if (totalStudents > 0 && task.completedStudents.length >= totalStudents) {
      if (!task.completedTime) task.completedTime = Date.now();
    } else {
      if (task.completedTime) delete task.completedTime;
    }

    this.saveState();
    this.renderCurrentClass();
  }

  createNewTask() {
    const input = document.getElementById('newTaskInput');
    const categorySelect = document.getElementById('newTaskCategory');
    const name = (input.value || '').trim();
    if (!name) {
      this.showToast('请输入任务名称（如：古诗背诵、数学练习P20）', 'error');
      return;
    }

    const cls = this.getCurrentClass();
    const newTask = {
      id: 'task_' + Date.now(),
      name: name,
      category: categorySelect.value || '背书',
      createTime: this.formatDate(new Date()),
      completedStudents: []
    };

    cls.tasks.unshift(newTask);
    cls.activeTaskId = newTask.id;
    input.value = '';

    this.saveState();
    this.renderCurrentClass();
    this.showToast(`新任务【${name}】已创建发布！`, 'success');
  }

  quickFillTask(name, category) {
    document.getElementById('newTaskInput').value = name;
    document.getElementById('newTaskCategory').value = category;
    this.createNewTask();
  }

  markAllCompleted() {
    const cls = this.getCurrentClass();
    const task = this.getCurrentTask();
    if (!cls || !task) return;

    task.completedStudents = cls.students.map(s => s.id);
    task.completedTime = Date.now();
    this.playBeep('fanfare');
    this.saveState();
    this.renderCurrentClass();
    this.showToast('已将全班学生标记为已完成！🎉', 'success');
  }

  resetCurrentTask() {
    const cls = this.getCurrentClass();
    const task = this.getCurrentTask();
    if (!cls || !task) return;

    if (task.completedStudents && task.completedStudents.length > 0) {
      if (!confirm(`确定要重置当前任务【${task.name}】的所有学生状态为待完成吗？`)) return;
    }
    task.completedStudents = [];
    delete task.completedTime;
    this.saveState();
    this.renderCurrentClass();
    this.showToast('当前任务状态已重置为待完成', 'info');
  }

  toggleDensity() {
    this.isCompactMode = !this.isCompactMode;
    document.getElementById('densityLabel').textContent = this.isCompactMode ? '舒适模式' : '紧凑模式';
    this.renderSeatingView();
    this.showToast(`已切换为${this.isCompactMode ? '紧凑' : '舒适'}展示`, 'info');
  }

  handleFilter(val) {
    this.filterKeyword = (val || '').trim().toLowerCase();
    this.renderSeatingView();
  }

  /* ================= 历史任务记录弹窗 ================= */
  renderHistoryModal() {
    const cls = this.getCurrentClass();
    if (!cls) return;

    const grid = document.getElementById('historyTasksGrid');
    grid.innerHTML = '';

    if (!cls.tasks || cls.tasks.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">暂无历史任务存档</div>';
      return;
    }

    cls.tasks.forEach(t => {
      const isCurrent = t.id === cls.activeTaskId;
      const count = t.completedStudents ? t.completedStudents.length : 0;
      const total = cls.students.length;
      const rate = total > 0 ? Math.round((count / total) * 100) : 0;

      const card = document.createElement('div');
      card.className = `history-task-card ${isCurrent ? 'active-task-highlight' : ''}`;
      card.innerHTML = `
        <div class="history-card-header">
          <div>
            <span class="task-badge-category">${t.category || '任务'}</span>
            ${isCurrent ? '<span style="font-size:0.75rem; background:#10b981; color:white; padding:0.1rem 0.4rem; border-radius:4px; font-weight:700; margin-left:0.4rem;">当前任务</span>' : ''}
          </div>
          <span class="history-card-meta">${t.createTime || ''}</span>
        </div>
        <div class="history-card-title">${t.name}</div>
        <div style="font-size:0.8rem; color:var(--text-muted);">
          达标情况: <strong style="color:var(--primary-700);">${count}</strong> / ${total} 人 (${rate}%)
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" style="width:${rate}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem; pt:0.4rem; border-top:1px solid var(--border-color);">
          <div style="display:flex; gap:0.35rem;">
            ${!isCurrent ? `<button class="btn btn-primary btn-sm" onclick="app.setActiveTask('${t.id}')">设为当前</button>` : ''}
            <button class="btn btn-subtle btn-sm" onclick="app.renameTaskPrompt('${t.id}')">编辑名称</button>
          </div>
          <button class="btn btn-danger-outline btn-sm" onclick="app.deleteTask('${t.id}')">删除</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  setActiveTask(taskId) {
    const cls = this.getCurrentClass();
    cls.activeTaskId = taskId;
    this.saveState();
    this.renderCurrentClass();
    this.closeModal('historyModal');
    this.showToast('已切换至选定任务！', 'success');
  }

  renameTaskPrompt(taskId) {
    const cls = this.getCurrentClass();
    const task = cls.tasks.find(t => t.id === taskId);
    if (!task) return;
    const newName = prompt('请输入新任务名称：', task.name);
    if (newName && newName.trim()) {
      task.name = newName.trim();
      this.saveState();
      this.renderCurrentClass();
      this.renderHistoryModal();
      this.showToast('任务名称更新成功', 'success');
    }
  }

  deleteTask(taskId) {
    const cls = this.getCurrentClass();
    if (cls.tasks.length <= 1) {
      this.showToast('班级至少需保留一个任务，无法删除', 'error');
      return;
    }
    if (!confirm('确定要删除此任务记录吗？此操作不可逆！')) return;

    cls.tasks = cls.tasks.filter(t => t.id !== taskId);
    if (cls.activeTaskId === taskId) {
      cls.activeTaskId = cls.tasks[0].id;
    }
    this.saveState();
    this.renderCurrentClass();
    this.renderHistoryModal();
    this.showToast('任务已删除', 'info');
  }

  /* ================= 课堂互动神器：随机抽查点名 ================= */
  openLotteryModal() {
    const cls = this.getCurrentClass();
    const task = this.getCurrentTask();
    if (!cls || !task) return;

    const completedSet = new Set(task.completedStudents || []);
    const pendingList = cls.students.filter(s => !completedSet.has(s.id));

    document.getElementById('lotteryPendingCount').textContent = pendingList.length;
    document.getElementById('lotteryAllCount').textContent = cls.students.length;

    document.getElementById('lotteryNameBig').textContent = '准备就绪';
    document.getElementById('lotterySubInfoBig').textContent = '点击下方开始抽签';
    document.getElementById('lotteryCardBig').classList.remove('rolling');
    document.getElementById('lotteryStartBtn').style.display = 'inline-flex';
    document.getElementById('lotteryPassBtn').style.display = 'none';

    this.currentSelectedStudent = null;
    this.openModal('lotteryModal');
  }

  startLottery() {
    const cls = this.getCurrentClass();
    const task = this.getCurrentTask();
    if (!cls || !task) return;

    const completedSet = new Set(task.completedStudents || []);
    let candidatePool = [];

    if (this.lotteryScope === 'pending') {
      candidatePool = cls.students.filter(s => !completedSet.has(s.id));
      if (candidatePool.length === 0) {
        this.showToast('当前待完成名单为空，已自动切换为全班抽取', 'info');
        candidatePool = [...cls.students];
      }
    } else {
      candidatePool = [...cls.students];
    }

    if (candidatePool.length === 0) {
      this.showToast('班级暂无学生可抽取', 'error');
      return;
    }

    const card = document.getElementById('lotteryCardBig');
    const name = document.getElementById('lotteryNameBig');
    const subInfo = document.getElementById('lotterySubInfoBig');
    const startBtn = document.getElementById('lotteryStartBtn');
    const passBtn = document.getElementById('lotteryPassBtn');

    startBtn.disabled = true;
    card.classList.add('rolling');
    passBtn.style.display = 'none';

    let count = 0;
    const maxRolls = 25;
    let speed = 50;

    const roll = () => {
      const randomStu = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      name.textContent = randomStu.name;
      subInfo.textContent = randomStu.studentId ? `学号: ${randomStu.studentId} | ${randomStu.group || ''}` : (randomStu.group || '');
      count++;

      if (count < maxRolls) {
        if (count > maxRolls - 8) speed += 30;
        this.lotteryTimer = setTimeout(roll, speed);
      } else {
        card.classList.remove('rolling');
        startBtn.disabled = false;
        startBtn.textContent = '🎲 再抽一次';
        this.currentSelectedStudent = randomStu;
        this.playBeep('fanfare');

        const isDone = task.completedStudents && task.completedStudents.includes(randomStu.id);
        if (!isDone) {
          passBtn.style.display = 'inline-flex';
        }
      }
    };

    roll();
  }

  markLotteryStudentPassed() {
    if (!this.currentSelectedStudent) return;
    this.toggleStudentStatus(this.currentSelectedStudent.id);
    document.getElementById('lotteryPassBtn').style.display = 'none';
    this.showToast(`🎉 学生【${this.currentSelectedStudent.name}】检查通过，已完成打卡！`, 'success');
  }

  /* ================= 排座设置与布局 ================= */
  saveSeatDimensionConfig() {
    const rowInput = document.getElementById('seatRowsInput');
    const colInput = document.getElementById('seatColsInput');
    const aislesEl = document.getElementById('seatAislesInput');
    if (!rowInput || !colInput) return;

    const rows = parseInt(rowInput.value, 10) || 6;
    const cols = parseInt(colInput.value, 10) || 8;
    const aislesInput = (aislesEl ? aislesEl.value : '').trim();
    const cls = this.getCurrentClass();

    if (!cls.seating) cls.seating = { rows: 6, cols: 8, seats: {} };
    cls.seating.rows = Math.min(Math.max(rows, 1), 30);
    cls.seating.cols = Math.min(Math.max(cols, 1), 30);

    // 解析过道配置
    if (aislesInput) {
      const parsedAisles = aislesInput.split(/[,，\s]+/)
        .map(n => parseInt(n, 10))
        .filter(n => !isNaN(n) && n > 0 && n < cls.seating.cols);
      cls.seating.aisles = parsedAisles;
    } else {
      cls.seating.aisles = [];
    }

    this.saveState();
    this.renderSeatingView();
    this.closeModal('seatConfigModal');
    this.showToast(`座位与过道设置已保存！`, 'success');
  }

  /* ================= 智能排座 (按学号排好，无学号按顺序，默认 8 列) ================= */
  autoArrangeSeats(cls, force = true) {
    if (!cls || !cls.students || cls.students.length === 0) return;

    const cols = 8;
    const rows = Math.max(6, Math.ceil(cls.students.length / cols));
    const aisles = (cls.seating && Array.isArray(cls.seating.aisles) && cls.seating.aisles.length > 0)
      ? cls.seating.aisles
      : [2, 6];

    // 如果未强制重排且已有有效座位，则检查是否每个学生都有座位
    if (!force && cls.seating && cls.seating.seats && Object.values(cls.seating.seats).some(Boolean)) {
      const seatedIds = new Set(Object.values(cls.seating.seats).filter(Boolean));
      const unseated = cls.students.filter(s => !seatedIds.has(s.id));
      if (unseated.length === 0) return;
    }

    // 智能排序：优先按学号排序（提取数字），如果没有学号则按原顺序直接排好
    const sorted = [...cls.students].sort((a, b) => {
      const aId = (a.studentId != null) ? String(a.studentId).trim() : '';
      const bId = (b.studentId != null) ? String(b.studentId).trim() : '';

      if (aId && bId) {
        const matchA = aId.match(/\d+/);
        const matchB = bId.match(/\d+/);
        const numA = matchA ? parseInt(matchA[0], 10) : NaN;
        const numB = matchB ? parseInt(matchB[0], 10) : NaN;
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numA - numB;
        }
        return aId.localeCompare(bId, undefined, { numeric: true });
      }
      if (aId && !bId) return -1;
      if (!aId && bId) return 1;
      return 0; // 都没有学号时按列表原有顺序排好
    });

    const seats = {};
    let sIdx = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (sIdx < sorted.length) {
          seats[`${r}-${c}`] = sorted[sIdx].id;
          sIdx++;
        } else {
          seats[`${r}-${c}`] = null;
        }
      }
    }

    cls.seating = {
      rows: rows,
      cols: cols,
      aisles: aisles,
      seats: seats
    };
  }

  autoFillSeatsByStudentId() {
    const cls = this.getCurrentClass();
    if (!cls) return;
    this.autoArrangeSeats(cls, true);
    this.saveState();
    this.renderSeatingView();
    this.showToast('已自动按学号顺序排座（默认8列）！', 'success');
  }

  randomizeSeats() {
    const cls = this.getCurrentClass();
    if (!cls.seating) cls.seating = { rows: 6, cols: 8, seats: {} };
    const { rows, cols } = cls.seating;
    const seats = {};
    const shuffled = [...cls.students].sort(() => Math.random() - 0.5);
    let sIdx = 0;

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (sIdx < shuffled.length) {
          seats[`${r}-${c}`] = shuffled[sIdx].id;
          sIdx++;
        } else {
          seats[`${r}-${c}`] = null;
        }
      }
    }
    cls.seating.seats = seats;
    this.saveState();
    this.renderSeatingView();
    this.closeModal('seatConfigModal');
    this.showToast('已完成随机打乱排座！', 'success');
  }

  clearAllSeats() {
    const cls = this.getCurrentClass();
    if (!cls.seating) return;
    cls.seating.seats = {};
    this.saveState();
    this.renderSeatingView();
    this.closeModal('seatConfigModal');
    this.showToast('座位安排已清空', 'info');
  }

  /* ================= 学生花名册管理 ================= */
  renderStudentModal(filterVal = '') {
    const cls = this.getCurrentClass();
    if (!cls) return;

    document.getElementById('studentModalClassTitle').textContent = `${cls.name} (${cls.students.length}人)`;
    const tbody = document.getElementById('studentModalTableBody');
    tbody.innerHTML = '';

    const kw = filterVal.trim().toLowerCase();
    const filtered = cls.students.filter(s => {
      if (!kw) return true;
      return s.name.toLowerCase().includes(kw) || (s.studentId && s.studentId.toLowerCase().includes(kw));
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">未找到匹配的学生记录</td></tr>';
      return;
    }

    filtered.forEach(s => {
      let doneCount = 0;
      cls.tasks.forEach(t => {
        if (t.completedStudents && t.completedStudents.includes(s.id)) doneCount++;
      });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.studentId || '-'}</td>
        <td><strong>${s.name}</strong></td>
        <td>${s.gender || '-'}</td>
        <td>${s.group || (s.role || '-')}</td>
        <td>${s.parentPhone || s.phone || '-'}</td>
        <td><span style="font-size:0.75rem; color:var(--text-muted);">${s.note || '-'}</span></td>
        <td><strong style="color:var(--primary-700);">${doneCount}</strong> / ${cls.tasks.length}</td>
        <td>
          <div style="display:flex; gap:0.35rem;">
            <button class="btn btn-subtle btn-sm" onclick="app.editSingleStudentPrompt('${s.id}')">编辑</button>
            <button class="btn btn-danger-outline btn-sm" onclick="app.deleteSingleStudent('${s.id}')">删除</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  filterStudentModal(val) {
    this.renderStudentModal(val);
  }

  submitBatchAddStudents() {
    const textarea = document.getElementById('batchAddTextarea');
    const text = (textarea.value || '').trim();
    if (!text) {
      this.showToast('请输入学生名单或粘贴学号与姓名', 'error');
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) {
      this.showToast('未能识别出有效的学生数据', 'error');
      return;
    }

    const cls = this.getCurrentClass();
    const existingNames = new Set(cls.students.map(s => s.name));
    let addedCount = 0;

    const hasChinese = str => /[\u4e00-\u9fa5]/.test(str);
    const hasDigits = str => /\d/.test(str);

    lines.forEach(line => {
      // 拆分单行中的分隔符：Tab、逗号、顿号、分号、空格
      const parts = line.split(/[\t,，;；\s]+/).filter(Boolean);
      if (parts.length === 0) return;

      let studentId = '';
      let name = '';
      let gender = '男';
      let group = '未分组';
      let phone = '';

      if (parts.length === 1) {
        // 仅输入了姓名，自动按当前人数递增分配学号
        name = parts[0];
        studentId = String(cls.students.length + 1).padStart(2, '0');
      } else {
        const p0 = parts[0];
        const p1 = parts[1];

        // 识别学号与姓名：
        // 1. 一方无汉字且有数字，另一方有汉字：无汉字的是学号
        if (!hasChinese(p0) && hasDigits(p0) && hasChinese(p1)) {
          studentId = p0;
          name = p1;
        } else if (hasChinese(p0) && !hasChinese(p1) && hasDigits(p1)) {
          name = p0;
          studentId = p1;
        } else if (/^\d/.test(p0)) {
          // 2. 以数字开头的默认为第一列学号，第二列姓名
          studentId = p0;
          name = p1;
        } else if (/^\d/.test(p1)) {
          // 3. 姓名在前，学号在后
          name = p0;
          studentId = p1;
        } else {
          // 默认第一列学号，第二列姓名
          studentId = p0;
          name = p1;
        }

        // 可选字段解析：性别、小组、电话
        if (parts[2]) {
          if (parts[2] === '男' || parts[2] === '女') gender = parts[2];
          else group = parts[2];
        }
        if (parts[3]) {
          if (parts[3] === '男' || parts[3] === '女') gender = parts[3];
          else if (!group || group === '未分组') group = parts[3];
          else phone = parts[3];
        }
      }

      if (!name) return;

      if (!existingNames.has(name)) {
        cls.students.push({
          id: 'stu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          studentId: studentId,
          name: name,
          gender: gender,
          group: group,
          phone: phone,
          parentPhone: phone,
          role: '学生',
          note: ''
        });
        existingNames.add(name);
        addedCount++;
      }
    });

    textarea.value = '';
    this.autoArrangeSeats(cls, true);
    this.saveState();
    this.renderClassDropdown();
    this.renderCurrentClass();
    this.renderStudentModal();
    this.closeModal('batchAddModal');
    this.showToast(`成功导入 ${addedCount} 名学生（已保留学号并自动排座）！`, 'success');
  }

  saveSingleStudent() {
    const editId = document.getElementById('editStudentInternalId').value;
    const name = document.getElementById('singleStuName').value.trim();
    if (!name) {
      this.showToast('请输入学生姓名', 'error');
      return;
    }

    const cls = this.getCurrentClass();
    const studentId = document.getElementById('singleStuId').value.trim() || String(cls.students.length + 1).padStart(2, '0');
    const gender = document.getElementById('singleStuGender').value;
    const group = document.getElementById('singleStuGroup').value.trim();
    const parentPhone = document.getElementById('singleStuParentPhone').value.trim();
    const note = document.getElementById('singleStuNote').value.trim();

    if (editId) {
      const target = cls.students.find(s => s.id === editId);
      if (target) {
        target.name = name;
        target.studentId = studentId;
        target.gender = gender;
        target.group = group;
        target.parentPhone = parentPhone;
        target.note = note;
        this.showToast('学生信息已更新', 'success');
      }
    } else {
      cls.students.push({
        id: 'stu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        studentId: studentId,
        name: name,
        gender: gender,
        group: group,
        parentPhone: parentPhone,
        note: note,
        role: '学生'
      });
      this.autoArrangeSeats(cls, true);
      this.showToast(`学生【${name}】添加成功，已自动排座！`, 'success');
    }

    this.saveState();
    this.renderClassDropdown();
    this.renderCurrentClass();
    this.renderStudentModal();
    this.closeModal('addStudentSingleModal');
  }

  editSingleStudentPrompt(studentId) {
    const cls = this.getCurrentClass();
    const target = cls.students.find(s => s.id === studentId);
    if (!target) return;

    document.getElementById('studentSingleModalTitle').textContent = '编辑学生档案';
    document.getElementById('editStudentInternalId').value = target.id;
    document.getElementById('singleStuName').value = target.name;
    document.getElementById('singleStuId').value = target.studentId || '';
    document.getElementById('singleStuGender').value = target.gender || '男';
    document.getElementById('singleStuGroup').value = target.group || '';
    document.getElementById('singleStuParentPhone').value = target.parentPhone || target.phone || '';
    document.getElementById('singleStuNote').value = target.note || '';

    this.openModal('addStudentSingleModal');
  }

  deleteSingleStudent(studentId) {
    const cls = this.getCurrentClass();
    const target = cls.students.find(s => s.id === studentId);
    if (!target) return;

    if (!confirm(`确定要删除学生【${target.name}】吗？`)) return;

    cls.students = cls.students.filter(s => s.id !== studentId);
    if (cls.seating && cls.seating.seats) {
      for (let k in cls.seating.seats) {
        if (cls.seating.seats[k] === studentId) cls.seating.seats[k] = null;
      }
    }

    this.saveState();
    this.renderClassDropdown();
    this.renderCurrentClass();
    this.renderStudentModal();
    this.showToast(`学生【${target.name}】已删除`, 'info');
  }

  /* ================= Excel 导入与导出中心 (离线 SheetJS 引擎) ================= */
  exportCurrentClassDetailExcel() {
    if (typeof XLSX === 'undefined') {
      this.showToast('未检测到本地 Excel 模块', 'error');
      return;
    }

    const cls = this.getCurrentClass();
    const wb = XLSX.utils.book_new();

    // Sheet 1: 班级任务排行榜与总览
    const rankData = [
      ['名次', '学号', '学生姓名', '性别', '小组/职务', '家长电话', '累计达标次数', '班级总任务数', '完成率']
    ];
    const rankList = cls.students.map(stu => {
      let count = 0;
      cls.tasks.forEach(t => {
        if (t.completedStudents && t.completedStudents.includes(stu.id)) count++;
      });
      const rate = cls.tasks.length > 0 ? Math.round((count / cls.tasks.length) * 100) : 0;
      return { stu, count, rate };
    }).sort((a, b) => b.count - a.count || b.rate - a.rate);

    rankList.forEach((item, idx) => {
      rankData.push([
        idx + 1,
        item.stu.studentId || '',
        item.stu.name,
        item.stu.gender || '',
        item.stu.group || '',
        item.stu.parentPhone || '',
        item.count,
        cls.tasks.length,
        `${item.rate}%`
      ]);
    });
    const wsRank = XLSX.utils.aoa_to_sheet(rankData);
    XLSX.utils.book_append_sheet(wb, wsRank, '排行榜与统计');

    // Sheet 2: 任务全量对错打卡矩阵
    const matrixHeaders = ['学号', '姓名'];
    cls.tasks.forEach(t => matrixHeaders.push(`${t.name} (${t.category})`));
    const matrixData = [matrixHeaders];

    cls.students.forEach(s => {
      const row = [s.studentId || '', s.name];
      cls.tasks.forEach(t => {
        const isDone = t.completedStudents && t.completedStudents.includes(s.id);
        row.push(isDone ? '✓ 完成' : '— 未完成');
      });
      matrixData.push(row);
    });
    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
    XLSX.utils.book_append_sheet(wb, wsMatrix, '任务打卡全矩阵');

    // Sheet 3: 当前任务待完成催交名单
    const currentTask = this.getCurrentTask();
    if (currentTask) {
      const pendingData = [
        ['当前催交任务', currentTask.name, '任务类型', currentTask.category, '导出时间', this.formatDate(new Date())],
        [],
        ['序号', '学号', '待完成学生姓名', '小组', '家长联系电话']
      ];
      const completedSet = new Set(currentTask.completedStudents || []);
      const pendingStudents = cls.students.filter(s => !completedSet.has(s.id));

      pendingStudents.forEach((s, idx) => {
        pendingData.push([
          idx + 1,
          s.studentId || '',
          s.name,
          s.group || '',
          s.parentPhone || ''
        ]);
      });
      const wsPending = XLSX.utils.aoa_to_sheet(pendingData);
      XLSX.utils.book_append_sheet(wb, wsPending, '催交未完成名单');
    }

    const filename = `${cls.name}_任务管理与统计报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    this.showToast(`报表已成功导出: ${filename}`, 'success');
  }

  exportAllClassesMultiSheetExcel() {
    if (typeof XLSX === 'undefined') return;

    const wb = XLSX.utils.book_new();

    this.state.classes.forEach(c => {
      const rows = [
        ['学号', '姓名', '性别', '小组/职务', '家长联系电话', '备注', '累计达标任务数']
      ];
      c.students.forEach(s => {
        let count = 0;
        c.tasks.forEach(t => {
          if (t.completedStudents && t.completedStudents.includes(s.id)) count++;
        });
        rows.push([
          s.studentId || '',
          s.name,
          s.gender || '男',
          s.group || '',
          s.parentPhone || '',
          s.note || '',
          count
        ]);
      });

      const sheetName = c.name.slice(0, 30).replace(/[:\\/?*\[\]]/g, '_');
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const filename = `全校多班级汇总花名册_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    this.showToast(`多班级汇总工作簿已导出: ${filename}`, 'success');
  }

  downloadStandardTemplate() {
    window.location.href = 'src/templates/学生信息导入标准模板.xlsx';
    this.showToast('正在下载导入模板...', 'info');
  }

  handleExcelFileSelect(file) {
    if (!file) return;
    if (typeof XLSX === 'undefined') {
      this.showToast('未检测到本地 Excel 引擎', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        this.pendingParsedWorkbook = workbook;

        const sheetsContainer = document.getElementById('sheetsListContainer');
        sheetsContainer.innerHTML = '';

        workbook.SheetNames.forEach(sheetName => {
          const ws = workbook.Sheets[sheetName];
          const students = this.parseSheetToStudents(ws);
          const count = students.length;
          const hasStudentId = students.some(s => s.studentId && s.studentId.trim() !== '');

          const row = document.createElement('div');
          row.className = 'sheet-item-row';
          row.innerHTML = `
            <div>
              <label style="display:flex; align-items:center; gap:0.5rem; font-weight:700; cursor:pointer;">
                <input type="checkbox" class="sheet-select-checkbox" value="${sheetName}" checked />
                <span>工作表: ${sheetName}</span>
              </label>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); display:flex; gap:0.6rem; align-items:center;">
              <span>包含 <b>${count}</b> 名学生</span>
              <span style="padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; background: ${hasStudentId ? '#dcfce7; color: #15803d;' : '#fef3c7; color: #b45309;'} font-weight: 700;">
                ${hasStudentId ? '✓ 已识别学号列' : '⚠️ 自动生成学号'}
              </span>
            </div>
          `;
          sheetsContainer.appendChild(row);
        });

        document.getElementById('excelSheetsScanResult').style.display = 'block';
        this.showToast(`文件解析成功，共发现 ${workbook.SheetNames.length} 个工作表`, 'success');
      } catch (err) {
        console.error('Excel 解析出错:', err);
        this.showToast('Excel 文件解析失败，请确认文件格式正确', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  importSelectedSheetsToCurrentClass() {
    if (!this.pendingParsedWorkbook) return;
    const cls = this.getCurrentClass();
    const checkedSheets = Array.from(document.querySelectorAll('.sheet-select-checkbox:checked')).map(cb => cb.value);

    if (checkedSheets.length === 0) {
      this.showToast('请至少勾选一个工作表', 'error');
      return;
    }

    let totalImported = 0;
    const existingNames = new Set(cls.students.map(s => s.name));

    checkedSheets.forEach(sheetName => {
      const ws = this.pendingParsedWorkbook.Sheets[sheetName];
      const students = this.parseSheetToStudents(ws);
      students.forEach(s => {
        if (!existingNames.has(s.name)) {
          cls.students.push(s);
          existingNames.add(s.name);
          totalImported++;
        }
      });
    });

    this.autoArrangeSeats(cls, true);
    this.saveState();
    this.renderClassDropdown();
    this.renderCurrentClass();
    this.closeModal('excelModal');
    this.showToast(`成功将 ${totalImported} 名学生导入到【${cls.name}】，已自动按学号排座！`, 'success');
  }

  importAllSheetsAsNewClasses() {
    if (!this.pendingParsedWorkbook) return;
    const checkedSheets = Array.from(document.querySelectorAll('.sheet-select-checkbox:checked')).map(cb => cb.value);

    if (checkedSheets.length === 0) {
      this.showToast('请至少勾选一个工作表', 'error');
      return;
    }

    let createdClassCount = 0;
    let createdStudentCount = 0;

    checkedSheets.forEach(sheetName => {
      const ws = this.pendingParsedWorkbook.Sheets[sheetName];
      const students = this.parseSheetToStudents(ws);

      const newClassId = 'class_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
      const newClass = {
        id: newClassId,
        name: sheetName,
        grade: '导入年级',
        subject: '综合',
        students: students,
        tasks: [{
          id: 'task_' + Date.now(),
          name: '课堂任务',
          category: '背书',
          createTime: this.formatDate(new Date()),
          completedStudents: []
        }],
        activeTaskId: null,
        seating: { rows: 6, cols: 8, seats: {} }
      };
      newClass.activeTaskId = newClass.tasks[0].id;

      this.autoArrangeSeats(newClass, true);
      this.state.classes.push(newClass);
      createdClassCount++;
      createdStudentCount += students.length;
    });

    this.saveState();
    this.renderClassDropdown();
    this.renderCurrentClass();
    this.closeModal('excelModal');
    this.showToast(`批量导入成功！新建 ${createdClassCount} 个班级，已全自动按学号排座！`, 'success');
  }

  parseSheetToStudents(worksheet) {
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (!rawData || rawData.length === 0) return [];

    // 1. 多行智能查找表头所在行（部分表格前1-2行是居中标题“某某学校花名册”）
    let headerRowIdx = -1;
    let nameIdx = -1;
    let idIdx = -1;
    let genderIdx = -1;
    let groupIdx = -1;
    let phoneIdx = -1;
    let noteIdx = -1;

    const maxHeaderScan = Math.min(6, rawData.length);
    for (let r = 0; r < maxHeaderScan; r++) {
      const row = rawData[r];
      if (!Array.isArray(row)) continue;
      const rowStrs = row.map(cell => String(cell || '').trim());

      let tempNameIdx = -1;
      let tempIdIdx = -1;
      rowStrs.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (h.includes('姓名') || h.includes('名字') || h === '学生' || lower === 'name') {
          tempNameIdx = i;
        } else if (
          h.includes('学号') || h.includes('编号') || h.includes('序号') || h.includes('考号') ||
          h.includes('卡号') || h.includes('代码') || h.includes('证件号') || lower === 'id' ||
          lower === 'no' || lower === 'no.' || lower === 'studentid' || lower === 'stu_id'
        ) {
          tempIdIdx = i;
        }
      });

      if (tempNameIdx !== -1) {
        headerRowIdx = r;
        nameIdx = tempNameIdx;
        idIdx = tempIdIdx;

        // 识别其他可选列
        rowStrs.forEach((h, i) => {
          if (h.includes('性别')) genderIdx = i;
          else if (h.includes('组') || h.includes('大组') || h.includes('小组')) groupIdx = i;
          else if (h.includes('电话') || h.includes('手机') || h.includes('家长')) phoneIdx = i;
          else if (h.includes('备注') || h.includes('职务') || h.includes('说明')) noteIdx = i;
        });
        break;
      }
    }

    // 2. 如果未找到标准表头，进行无表头数据特征智能推断（找哪列是2-4字中文姓名，哪列是数字学号）
    let startDataRow = headerRowIdx + 1;
    if (headerRowIdx === -1) {
      const colStats = [];
      const sampleLimit = Math.min(25, rawData.length);

      for (let r = 0; r < sampleLimit; r++) {
        const row = rawData[r] || [];
        for (let c = 0; c < row.length; c++) {
          if (!colStats[c]) colStats[c] = { chineseCount: 0, digitCount: 0, total: 0 };
          const val = String(row[c] || '').trim();
          if (val) {
            colStats[c].total++;
            if (/^[\u4e00-\u9fa5]{2,4}$/.test(val)) colStats[c].chineseCount++;
            if (/^\d+$/.test(val) || /^[\dA-Za-z_-]{1,12}$/.test(val)) colStats[c].digitCount++;
          }
        }
      }

      let bestNameCol = -1;
      let maxChinese = 0;
      let bestIdCol = -1;
      let maxDigits = 0;

      colStats.forEach((stat, colIdx) => {
        if (stat.chineseCount > maxChinese && stat.chineseCount >= 2) {
          maxChinese = stat.chineseCount;
          bestNameCol = colIdx;
        }
        if (stat.digitCount > maxDigits && stat.digitCount >= 2) {
          maxDigits = stat.digitCount;
          bestIdCol = colIdx;
        }
      });

      if (bestNameCol !== -1) {
        nameIdx = bestNameCol;
        idIdx = bestIdCol !== bestNameCol ? bestIdCol : -1;
        startDataRow = 0;
      } else {
        return [];
      }
    }

    const students = [];
    for (let r = startDataRow; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !row[nameIdx]) continue;
      const name = String(row[nameIdx]).trim();
      if (!name || name === '姓名' || name === '名字') continue;

      let studentId = '';
      if (idIdx !== -1 && row[idIdx] != null) {
        studentId = String(row[idIdx]).trim();
      }
      if (!studentId) {
        studentId = String(students.length + 1).padStart(2, '0');
      }

      const gender = genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim() : '男';
      const group = groupIdx !== -1 && row[groupIdx] ? String(row[groupIdx]).trim() : '未分组';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : '';
      const note = noteIdx !== -1 && row[noteIdx] ? String(row[noteIdx]).trim() : '';

      students.push({
        id: 'stu_' + Date.now() + '_' + r + '_' + Math.random().toString(36).substr(2, 3),
        studentId: studentId,
        name: name,
        gender: gender,
        group: group,
        phone: phone,
        parentPhone: phone,
        note: note,
        role: '学生'
      });
    }

    return students;
  }

  /* ================= 本地数据备份与恢复 (JSON) ================= */
  backupDataJSON() {
    const dataStr = JSON.stringify(this.state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `班小记_完整备份_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('数据备份文件已导出！', 'success');
  }

  restoreDataJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported && imported.classes && Array.isArray(imported.classes)) {
          this.state = imported;
          this.saveState();
          this.renderClassDropdown();
          this.renderCurrentClass();
          this.closeModal('backupModal');
          this.showToast('系统数据已完美复原！', 'success');
        } else {
          this.showToast('导入的 JSON 备份格式无效', 'error');
        }
      } catch (err) {
        this.showToast('备份文件解析失败', 'error');
      }
    };
    reader.readAsText(file);
  }

  /* ================= 模态弹窗与 Toast ================= */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
    if (modalId === 'studentManageModal') {
      this.renderStudentModal();
    } else if (modalId === 'classManageModal') {
      this.renderClassListManage();
    } else if (modalId === 'historyModal') {
      this.renderHistoryModal();
    } else if (modalId === 'seatConfigModal') {
      const cls = this.getCurrentClass();
      if (cls && cls.seating) {
        const rowsEl = document.getElementById('seatRowsInput');
        const colsEl = document.getElementById('seatColsInput');
        const aislesEl = document.getElementById('seatAislesInput');
        if (rowsEl) rowsEl.value = cls.seating.rows || 6;
        if (colsEl) colsEl.value = cls.seating.cols || 8;
        if (aislesEl) aislesEl.value = (cls.seating.aisles || []).join(', ');
      }
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      }
    });
  }

  formatDate(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// 挂载全局实例
window.app = new StudentTaskManager();
