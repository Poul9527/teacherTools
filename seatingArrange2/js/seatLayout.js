/**
 * 座位表排座神器 - 座位布局引擎 (Seat Layout Engine)
 * 支持 4大组(2-2-2-2)、3大组(2-4-2)、单人单座(1*8)、小组讨论(拼桌)及自由自定义
 */

const SeatLayout = (function() {
  // 预设配置库
  const PRESETS = {
    'group4_pair': {
      id: 'group4_pair',
      name: '经典4大组 (2-2-2-2)',
      description: '最常见的教室排布：4个大组，每组2列同桌，组间宽走廊',
      groupCols: [2, 2, 2, 2],
      defaultRows: 6,
      aisleWidth: 28, // px
      type: 'paired'
    },
    'group3_242': {
      id: 'group3_242',
      name: '3大组组合 (2-4-2)',
      description: '两侧各2列同桌，中间大组4列拼桌，常用于大教室',
      groupCols: [2, 4, 2],
      defaultRows: 6,
      aisleWidth: 30,
      type: 'paired'
    },
    'group3_333': {
      id: 'group3_333',
      name: '3大组排布 (3-3-3)',
      description: '三大组各3列共9列，适合阶梯教室或大班额教学',
      groupCols: [3, 3, 3],
      defaultRows: 6,
      aisleWidth: 32,
      type: 'paired'
    },
    'group3_equal': {
      id: 'group3_equal',
      name: '3大组均分 (2-2-2)',
      description: '适合中小班额：3个大组，每组2列同桌',
      groupCols: [2, 2, 2],
      defaultRows: 6,
      aisleWidth: 32,
      type: 'paired'
    },
    'single_row': {
      id: 'single_row',
      name: '单人单座 (考试模式)',
      description: '每列独立一列，列列有走道，适合模拟考试防作弊',
      groupCols: [1, 1, 1, 1, 1, 1, 1],
      defaultRows: 7,
      aisleWidth: 16,
      type: 'single'
    },
    'group_island': {
      id: 'group_island',
      name: '小组讨论模式 (4人拼桌)',
      description: '4人一个独立讨论小组，对坐拼桌，新课改互动教学',
      groupCols: [2, 2, 2, 2],
      defaultRows: 6,
      aisleWidth: 36,
      type: 'island'
    }
  };

  // 中文大组名称映射
  const GROUP_NAMES = ['第一大组', '第二大组', '第三大组', '第四大组', '第五大组', '第六大组', '第七大组', '第八大组'];

  /**
   * 生成指定配置下的所有座位插槽 (Slots)
   * @param {Object} config { groupCols: [2,2,2,2], rows: 6 }
   * @returns {Array} groups 数组，每个元素包含组信息和该组的二维座位数据
   */
  function generateSeatGrid(config) {
    const groupCols = config.groupCols || [2, 2, 2, 2];
    const rows = config.rows || 6;
    
    const groups = [];
    let globalColOffset = 0;

    groupCols.forEach((colCount, gIdx) => {
      const groupData = {
        groupIndex: gIdx,
        groupName: GROUP_NAMES[gIdx] || `第 ${gIdx + 1} 组`,
        colCount: colCount,
        rows: rows,
        seats: [] // 扁平或排列表
      };

      // 生成每个座位的占位
      for (let r = 1; r <= rows; r++) {
        for (let c = 0; c < colCount; c++) {
          const seatId = `seat_r${r}_g${gIdx}_c${c}`;
          groupData.seats.push({
            id: seatId,
            row: r,
            colInGroup: c,
            globalCol: globalColOffset + c + 1,
            groupIndex: gIdx,
            student: null, // 绑定的学生对象
            disabled: false // 是否被标记为不需要该座位
          });
        }
      }

      globalColOffset += colCount;
      groups.push(groupData);
    });

    return groups;
  }

  /**
   * 将当前座位表的所有有效座位扁平化输出（按大组、按排顺序）
   */
  function getAllSeatsFlat(groups) {
    const seats = [];
    groups.forEach(g => {
      g.seats.forEach(s => {
        seats.push(s);
      });
    });
    return seats;
  }

  /**
   * 计算当前总座位容量
   */
  function calculateTotalCapacity(config) {
    const groupCols = config.groupCols || [2, 2, 2, 2];
    const rows = config.rows || 6;
    const totalCols = groupCols.reduce((sum, c) => sum + c, 0);
    return totalCols * rows;
  }

  /**
   * 解析自定义布局表达式 (如 "2-1-2-1", "2-2-2-2", "3-3-3", "2+4+2")
   */
  function parseLayoutExpression(exprStr) {
    if (!exprStr || typeof exprStr !== 'string') return null;
    const parts = exprStr.trim().split(/[-+,，\s/]+/).filter(p => p.length > 0);
    const cols = [];
    for (const p of parts) {
      const num = parseInt(p, 10);
      if (isNaN(num) || num < 1 || num > 8) return null;
      cols.push(num);
    }
    return cols.length > 0 ? cols : null;
  }

  return {
    PRESETS,
    GROUP_NAMES,
    generateSeatGrid,
    getAllSeatsFlat,
    calculateTotalCapacity,
    parseLayoutExpression
  };
})();

// 如果在模块环境也可以兼容
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeatLayout;
}
