/**
 * 座位表排座神器 - 智能排座算法与轮换引擎 (Arrange Rules)
 * 包含：
 * 1. 完全随机打乱
 * 2. 男女同桌配对 (一男一女)
 * 3. 同性同桌配对 (男男、女女)
 * 4. 按成绩/名次排座 (正序、S型)
 * 5. 按身高由矮到高排座 (矮前高后防遮挡)
 * 6. 成绩优差互助同桌配对 (一帮一同桌)
 * 7. 视力优先保护排座 (视力不佳优先安排前排中心)
 * 8. 名单顺序排入
 * 9. S型/蛇形排座
 * 10. 指定步数的单列平移、整行平移、大组平移
 * 11. 区域自动分组 (按设定的行数和列数划分小组) 及手动分组工具
 */

const ArrangeRules = (function() {
  /**
   * Fisher-Yates 现代洗牌算法
   */
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * 收集当前未被锁定的有效座位插槽
   */
  function getUnlockedSlots(groups) {
    const slots = [];
    groups.forEach((group, gIdx) => {
      group.seats.forEach((seat, sIdx) => {
        if (!seat.disabled && (!seat.student || !seat.student.locked)) {
          slots.push({ gIdx, sIdx, seat });
        }
      });
    });
    return slots;
  }

  /**
   * 获取教室中所有的同桌对 (Pairs)
   */
  function getAllDeskPairs(groups) {
    const pairs = [];
    groups.forEach(group => {
      const rows = group.rows;
      const cols = group.colCount;
      for (let r = 1; r <= rows; r++) {
        for (let c = 0; c < cols; c += 2) {
          const seatLeft = group.seats.find(s => s.row === r && s.colInGroup === c && !s.disabled);
          const seatRight = (c + 1 < cols) ? group.seats.find(s => s.row === r && s.colInGroup === c + 1 && !s.disabled) : null;
          pairs.push({ seatLeft, seatRight });
        }
      }
    });
    return pairs;
  }

  /**
   * 1. 完全随机排座
   */
  function randomArrange(groups, studentsPool) {
    const unlockedSlots = getUnlockedSlots(groups);
    const shuffledStudents = shuffle(studentsPool);

    unlockedSlots.forEach((slot, index) => {
      if (index < shuffledStudents.length) {
        slot.seat.student = { ...shuffledStudents[index], locked: false };
      } else {
        slot.seat.student = null;
      }
    });

    return shuffledStudents.slice(unlockedSlots.length);
  }

  /**
   * 2. 男女同桌排座 (一男一女搭档)
   */
  function genderPairArrange(groups, studentsPool) {
    const boys = shuffle(studentsPool.filter(s => s.gender === 'boy'));
    const girls = shuffle(studentsPool.filter(s => s.gender === 'girl'));
    const neutrals = shuffle(studentsPool.filter(s => s.gender !== 'boy' && s.gender !== 'girl'));

    const deskPairs = getAllDeskPairs(groups);

    deskPairs.forEach(pair => {
      const leftAvail = pair.seatLeft && (!pair.seatLeft.student || !pair.seatLeft.student.locked);
      const rightAvail = pair.seatRight && (!pair.seatRight.student || !pair.seatRight.student.locked);

      if (leftAvail && rightAvail) {
        const boy = boys.pop();
        const girl = girls.pop();

        if (boy && girl) {
          if (Math.random() > 0.5) {
            pair.seatLeft.student = { ...boy, locked: false };
            pair.seatRight.student = { ...girl, locked: false };
          } else {
            pair.seatLeft.student = { ...girl, locked: false };
            pair.seatRight.student = { ...boy, locked: false };
          }
        } else if (boy) {
          pair.seatLeft.student = { ...boy, locked: false };
          const next = boys.pop() || neutrals.pop();
          pair.seatRight.student = next ? { ...next, locked: false } : null;
        } else if (girl) {
          pair.seatLeft.student = { ...girl, locked: false };
          const next = girls.pop() || neutrals.pop();
          pair.seatRight.student = next ? { ...next, locked: false } : null;
        } else {
          const s1 = neutrals.pop();
          const s2 = neutrals.pop();
          pair.seatLeft.student = s1 ? { ...s1, locked: false } : null;
          pair.seatRight.student = s2 ? { ...s2, locked: false } : null;
        }
      } else if (leftAvail) {
        const rightGender = pair.seatRight && pair.seatRight.student ? pair.seatRight.student.gender : null;
        let cand = null;
        if (rightGender === 'boy') cand = girls.pop() || neutrals.pop() || boys.pop();
        else if (rightGender === 'girl') cand = boys.pop() || neutrals.pop() || girls.pop();
        else cand = boys.pop() || girls.pop() || neutrals.pop();
        pair.seatLeft.student = cand ? { ...cand, locked: false } : null;
      } else if (rightAvail) {
        const leftGender = pair.seatLeft && pair.seatLeft.student ? pair.seatLeft.student.gender : null;
        let cand = null;
        if (leftGender === 'boy') cand = girls.pop() || neutrals.pop() || boys.pop();
        else if (leftGender === 'girl') cand = boys.pop() || neutrals.pop() || girls.pop();
        else cand = boys.pop() || girls.pop() || neutrals.pop();
        pair.seatRight.student = cand ? { ...cand, locked: false } : null;
      }
    });

    return [...boys, ...girls, ...neutrals];
  }

  /**
   * 3. 同性同桌排座 (男男同桌、女女同桌)
   */
  function sameGenderPairArrange(groups, studentsPool) {
    const boys = shuffle(studentsPool.filter(s => s.gender === 'boy'));
    const girls = shuffle(studentsPool.filter(s => s.gender === 'girl'));
    const neutrals = shuffle(studentsPool.filter(s => s.gender !== 'boy' && s.gender !== 'girl'));

    const deskPairs = getAllDeskPairs(groups);

    deskPairs.forEach(pair => {
      const leftAvail = pair.seatLeft && (!pair.seatLeft.student || !pair.seatLeft.student.locked);
      const rightAvail = pair.seatRight && (!pair.seatRight.student || !pair.seatRight.student.locked);

      if (leftAvail && rightAvail) {
        if (boys.length >= 2) {
          pair.seatLeft.student = { ...boys.pop(), locked: false };
          pair.seatRight.student = { ...boys.pop(), locked: false };
        } else if (girls.length >= 2) {
          pair.seatLeft.student = { ...girls.pop(), locked: false };
          pair.seatRight.student = { ...girls.pop(), locked: false };
        } else if (boys.length === 1) {
          pair.seatLeft.student = { ...boys.pop(), locked: false };
          pair.seatRight.student = neutrals.pop() ? { ...neutrals.pop(), locked: false } : null;
        } else if (girls.length === 1) {
          pair.seatLeft.student = { ...girls.pop(), locked: false };
          pair.seatRight.student = neutrals.pop() ? { ...neutrals.pop(), locked: false } : null;
        } else {
          const s1 = neutrals.pop();
          const s2 = neutrals.pop();
          pair.seatLeft.student = s1 ? { ...s1, locked: false } : null;
          pair.seatRight.student = s2 ? { ...s2, locked: false } : null;
        }
      } else if (leftAvail) {
        const rightGender = pair.seatRight && pair.seatRight.student ? pair.seatRight.student.gender : null;
        let cand = (rightGender === 'boy') ? (boys.pop() || neutrals.pop()) : (girls.pop() || neutrals.pop());
        pair.seatLeft.student = cand ? { ...cand, locked: false } : null;
      } else if (rightAvail) {
        const leftGender = pair.seatLeft && pair.seatLeft.student ? pair.seatLeft.student.gender : null;
        let cand = (leftGender === 'boy') ? (boys.pop() || neutrals.pop()) : (girls.pop() || neutrals.pop());
        pair.seatRight.student = cand ? { ...cand, locked: false } : null;
      }
    });

    return [...boys, ...girls, ...neutrals];
  }

  /**
   * 4. 按成绩/名次排座 (正序或S型由优到良排列)
   */
  function scoreRankArrange(groups, studentsPool, useSnake = false) {
    const sorted = [...studentsPool].sort((a, b) => {
      const rA = typeof a.rank === 'number' ? a.rank : 999;
      const rB = typeof b.rank === 'number' ? b.rank : 999;
      return rA - rB;
    });

    if (useSnake) {
      return snakeArrange(groups, sorted);
    } else {
      return sequentialArrange(groups, sorted);
    }
  }

  /**
   * 5. 按身高由矮到高排座 (矮前高后，保障前排视线不遮挡)
   */
  function heightArrange(groups, studentsPool) {
    const sorted = [...studentsPool].sort((a, b) => {
      const hA = typeof a.height === 'number' ? a.height : 160;
      const hB = typeof b.height === 'number' ? b.height : 160;
      return hA - hB;
    });
    return sequentialArrange(groups, sorted);
  }

  /**
   * 6. 成绩优差互助同桌搭配 (结对帮扶：前50%与后50%交叉成同桌)
   */
  function peerHelpArrange(groups, studentsPool) {
    const sorted = [...studentsPool].sort((a, b) => {
      const rA = typeof a.rank === 'number' ? a.rank : 999;
      const rB = typeof b.rank === 'number' ? b.rank : 999;
      return rA - rB;
    });

    const mid = Math.ceil(sorted.length / 2);
    const high = sorted.slice(0, mid);
    const low = sorted.slice(mid).reverse(); // 最好搭最差

    const deskPairs = getAllDeskPairs(groups);
    deskPairs.forEach(pair => {
      const leftAvail = pair.seatLeft && (!pair.seatLeft.student || !pair.seatLeft.student.locked);
      const rightAvail = pair.seatRight && (!pair.seatRight.student || !pair.seatRight.student.locked);

      if (leftAvail && rightAvail) {
        const sHigh = high.shift();
        const sLow = low.shift();
        pair.seatLeft.student = sHigh ? { ...sHigh, locked: false } : null;
        pair.seatRight.student = sLow ? { ...sLow, locked: false } : null;
      }
    });

    return [...high, ...low];
  }

  /**
   * 7. 视力优先保护排座 (视力差者优先安排在第1-2排中心大组)
   */
  function visionProtectArrange(groups, studentsPool) {
    const poorVision = shuffle(studentsPool.filter(s => s.vision === 'poor'));
    const normals = shuffle(studentsPool.filter(s => s.vision !== 'poor'));

    // 优先分配前两排靠近中间的大组
    const centerGroupIndices = [];
    const gLen = groups.length;
    if (gLen <= 2) {
      centerGroupIndices.push(0, 1);
    } else {
      centerGroupIndices.push(Math.floor(gLen / 2) - 1, Math.floor(gLen / 2));
    }

    // 先填前排中心视力保护位
    for (let r = 1; r <= 2; r++) {
      centerGroupIndices.forEach(gIdx => {
        const g = groups[gIdx];
        if (!g) return;
        for (let c = 0; c < g.colCount; c++) {
          const seat = g.seats.find(s => s.row === r && s.colInGroup === c && !s.disabled);
          if (seat && (!seat.student || !seat.student.locked)) {
            if (poorVision.length > 0) {
              seat.student = { ...poorVision.pop(), locked: false };
            }
          }
        }
      });
    }

    // 其余学生随机分配
    const remaining = [...poorVision, ...normals];
    return randomArrange(groups, remaining);
  }

  /**
   * 8. 顺序从前到后填入
   */
  function sequentialArrange(groups, studentsPool) {
    let sIdx = 0;
    const maxRows = Math.max(...groups.map(g => g.rows));

    for (let r = 1; r <= maxRows; r++) {
      for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        for (let c = 0; c < group.colCount; c++) {
          const seat = group.seats.find(s => s.row === r && s.colInGroup === c && !s.disabled);
          if (seat && (!seat.student || !seat.student.locked)) {
            if (sIdx < studentsPool.length) {
              seat.student = { ...studentsPool[sIdx], locked: false };
              sIdx++;
            } else {
              seat.student = null;
            }
          }
        }
      }
    }
    return studentsPool.slice(sIdx);
  }

  /**
   * 9. S型/蛇形排座
   */
  function snakeArrange(groups, studentsPool) {
    let sIdx = 0;
    const maxRows = Math.max(...groups.map(g => g.rows));

    for (let r = 1; r <= maxRows; r++) {
      const rowSeats = [];
      for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        for (let c = 0; c < group.colCount; c++) {
          const seat = group.seats.find(s => s.row === r && s.colInGroup === c && !s.disabled);
          if (seat) rowSeats.push(seat);
        }
      }

      if (r % 2 === 0) rowSeats.reverse();

      rowSeats.forEach(seat => {
        if (!seat.student || !seat.student.locked) {
          if (sIdx < studentsPool.length) {
            seat.student = { ...studentsPool[sIdx], locked: false };
            sIdx++;
          } else {
            seat.student = null;
          }
        }
      });
    }
    return studentsPool.slice(sIdx);
  }

  /**
   * 10. 大组整体轮换 (向左/向右)
   */
  function rotateGroups(groups, direction = 'right') {
    const groupCount = groups.length;
    if (groupCount <= 1) return;

    const snapshots = groups.map(g => {
      return g.seats.map(s => (s.student ? { ...s.student } : null));
    });

    groups.forEach((group, gIdx) => {
      let fromIdx = direction === 'right' ? (gIdx - 1 + groupCount) % groupCount : (gIdx + 1) % groupCount;
      const fromSnapshot = snapshots[fromIdx];

      group.seats.forEach((seat, sIdx) => {
        if (seat.student && seat.student.locked) return;
        const newStudent = fromSnapshot[sIdx];
        seat.student = newStudent ? { ...newStudent } : null;
      });
    });
  }

  function ensureGlobalCols(groups) {
    let offset = 0;
    groups.forEach((g, gIdx) => {
      const colCount = g.colCount || 2;
      if (g.seats) {
        g.seats.forEach((s, sIdx) => {
          if (s.colInGroup === undefined || isNaN(s.colInGroup)) {
            if (s.id) {
              const m = s.id.match(/_c(\d+)/);
              s.colInGroup = m ? parseInt(m[1], 10) : (sIdx % colCount);
            } else {
              s.colInGroup = sIdx % colCount;
            }
          }
          if (s.row === undefined || isNaN(s.row)) {
            if (s.id) {
              const m = s.id.match(/_r(\d+)/);
              s.row = m ? parseInt(m[1], 10) : (Math.floor(sIdx / colCount) + 1);
            } else {
              s.row = Math.floor(sIdx / colCount) + 1;
            }
          }
          s.globalCol = offset + s.colInGroup + 1;
        });
      }
      offset += colCount;
    });
  }

  function getFlatSeats(groups) {
    if (typeof SeatLayout !== 'undefined' && SeatLayout.getAllSeatsFlat) {
      return SeatLayout.getAllSeatsFlat(groups);
    }
    const list = [];
    groups.forEach(g => {
      if (g.seats) g.seats.forEach(s => list.push(s));
    });
    return list;
  }

  /**
   * 11. 列平移 (支持指定列号、方向向左/向右、指定步数 steps)
   * 严格契合小红书 buju.jpg：
   * 可以批量将整列的学生，按指定方向和步数进行移动，方便整体调整。
   * @param {Array} groups
   * @param {Array<Number>|null} targetColNumbers 1-based 列号数组，如 [1, 2, 3]；若为空或null则为全班所有列
   * @param {'left'|'right'} direction 向左或向右
   * @param {Number} steps 平移步数
   */
  function shiftColumns(groups, targetColNumbers = null, direction = 'right', steps = 1) {
    ensureGlobalCols(groups);
    const allSeats = getFlatSeats(groups);
    const maxRows = Math.max(...groups.map(g => g.rows || Math.max(...(g.seats ? g.seats.map(s => s.row) : [6]))));
    const allGlobalCols = [...new Set(allSeats.map(s => s.globalCol))].filter(Boolean).sort((a, b) => a - b);
    const totalCols = allGlobalCols.length;
    if (totalCols <= 1) return;

    // 解析目标列号
    let targetCols = [];
    if (Array.isArray(targetColNumbers) && targetColNumbers.length > 0) {
      targetCols = targetColNumbers.filter(c => allGlobalCols.includes(c));
    }
    if (targetCols.length === 0) {
      targetCols = [...allGlobalCols];
    }
    targetCols = [...new Set(targetCols)].sort((a, b) => a - b);

    // 若用户仅指定单个列（如只输入 1），则与移动方向上的目标列形成平移对
    if (targetCols.length === 1) {
      const c = targetCols[0];
      const destCol = direction === 'right'
        ? (((c - 1 + steps) % totalCols) + 1)
        : (((c - 1 - steps + totalCols * 100) % totalCols) + 1);
      targetCols = [c, destCol].sort((a, b) => a - b);
    }
    if (targetCols.length <= 1) return;

    // 对每一排进行平移
    for (let r = 1; r <= maxRows; r++) {
      const rowTargetSeats = targetCols.map(c => {
        return allSeats.find(s => s.row === r && s.globalCol === c && !s.disabled);
      }).filter(Boolean);

      // 提取未锁定的有效座位与对应学生快照
      const unlockedSeats = rowTargetSeats.filter(s => !s.student || !s.student.locked);
      const unlockedStudents = unlockedSeats.map(s => (s.student ? { ...s.student } : null));
      const M = unlockedSeats.length;
      if (M <= 1) continue;

      const effSteps = ((steps % M) + M) % M;
      if (effSteps === 0) continue;

      unlockedSeats.forEach((seat, idx) => {
        let fromIdx;
        if (direction === 'right') {
          fromIdx = (idx - effSteps + M) % M;
        } else {
          fromIdx = (idx + effSteps) % M;
        }
        seat.student = unlockedStudents[fromIdx];
      });
    }
  }

  /**
   * 12. 行平移 (支持指定行号、方向向前/向后、指定步数 steps)
   * 严格契合小红书 buju.jpg：
   * 可以批量将整行的学生，按指定方向和步数进行移动，方便整体调整。
   * @param {Array} groups
   * @param {Array<Number>|null} targetRowNumbers 1-based 行号数组，如 [1, 2, 3]；若为空或null则为全班所有行
   * @param {'forward'|'backward'} direction 向前(朝黑板/前排)或向后(朝教室后方)
   * @param {Number} steps 平移步数
   */
  function shiftRows(groups, targetRowNumbers = null, direction = 'backward', steps = 1) {
    ensureGlobalCols(groups);
    const allSeats = getFlatSeats(groups);
    const maxRows = Math.max(...groups.map(g => g.rows || Math.max(...(g.seats ? g.seats.map(s => s.row) : [6]))));
    const allGlobalCols = [...new Set(allSeats.map(s => s.globalCol))].filter(Boolean).sort((a, b) => a - b);

    // 解析目标行号
    let targetRows = [];
    if (Array.isArray(targetRowNumbers) && targetRowNumbers.length > 0) {
      targetRows = targetRowNumbers.filter(r => r >= 1 && r <= maxRows);
    }
    if (targetRows.length === 0) {
      for (let r = 1; r <= maxRows; r++) targetRows.push(r);
    }
    targetRows = [...new Set(targetRows)].sort((a, b) => a - b);

    // 若用户仅指定单个行（如只输入 1 或第一排），则与移动方向上的目标行形成平移对
    if (targetRows.length === 1) {
      const r = targetRows[0];
      const destRow = direction === 'backward'
        ? (((r - 1 + steps) % maxRows) + 1)
        : (((r - 1 - steps + maxRows * 100) % maxRows) + 1);
      targetRows = [r, destRow].sort((a, b) => a - b);
    }
    if (targetRows.length <= 1) return;

    // 对每一列进行行平移
    allGlobalCols.forEach(colNum => {
      const colTargetSeats = targetRows.map(r => {
        return allSeats.find(s => s.row === r && s.globalCol === colNum && !s.disabled);
      }).filter(Boolean);

      const unlockedSeats = colTargetSeats.filter(s => !s.student || !s.student.locked);
      const unlockedStudents = unlockedSeats.map(s => (s.student ? { ...s.student } : null));
      const M = unlockedSeats.length;
      if (M <= 1) return;

      const effSteps = steps % M;
      unlockedSeats.forEach((seat, idx) => {
        let fromIdx;
        if (direction === 'backward') {
          // 向后平移：前排挪向后排
          fromIdx = (idx - effSteps + M) % M;
        } else {
          // 向前平移：后排挪向前排
          fromIdx = (idx + effSteps) % M;
        }
        seat.student = unlockedStudents[fromIdx];
      });
    });
  }

  // 兼容别名
  function rotateColumns(groups, direction = 'right', steps = 1) {
    return shiftColumns(groups, null, direction, steps);
  }

  function rotateRows(groups, direction = 'backward', steps = 1) {
    return shiftRows(groups, null, direction, steps);
  }

  /**
   * 计算小组统计信息（平均名次、男女比例、角色标注）
   */
  function enrichGroupStats(group, blockRows = 2, blockCols = 2) {
    const validRanks = group.members.filter(m => typeof m.rank === 'number' && m.rank > 0).map(m => m.rank);
    let avgRank = null;
    if (validRanks.length > 0) {
      avgRank = (validRanks.reduce((a, b) => a + b, 0) / validRanks.length).toFixed(1);
    }
    const boys = group.members.filter(m => m.gender === 'boy').length;
    const girls = group.members.filter(m => m.gender === 'girl').length;

    // 标注角色 (优等领学⭐、帮扶互助🤝、中坚组员)
    if (validRanks.length >= 2) {
      const minR = Math.min(...validRanks);
      const maxR = Math.max(...validRanks);
      group.members.forEach(m => {
        if (m.rank === minR) {
          m.role = 'leader';
          m.roleLabel = '领学⭐';
        } else if (m.rank === maxR && maxR !== minR) {
          m.role = 'helpee';
          m.roleLabel = '互助🤝';
        } else {
          m.role = 'member';
          m.roleLabel = '组员';
        }
      });
    } else {
      group.members.forEach(m => {
        m.role = 'member';
        m.roleLabel = '组员';
      });
    }

    group.stats = {
      avgRank: avgRank,
      boys: boys,
      girls: girls,
      blockRows: blockRows,
      blockCols: blockCols
    };
    return group;
  }

  /**
   * 13. 区域自动分组算法 (根据设定的每组行数和列数划分物理相邻小组)
   * @param {Array} groups 
   * @param {Number} blockRows 每组行数 (如 2 行)
   * @param {Number} blockCols 每组列数 (如 2 列)
   */
  function autoAreaGroup(groups, blockRows = 2, blockCols = 2) {
    const groupList = [];
    let groupIdx = 1;

    groups.forEach((g, gIndex) => {
      const rows = g.rows;
      const cols = g.colCount;

      for (let rStart = 1; rStart <= rows; rStart += blockRows) {
        for (let cStart = 0; cStart < cols; cStart += blockCols) {
          const members = [];
          for (let r = rStart; r < rStart + blockRows && r <= rows; r++) {
            for (let c = cStart; c < cStart + blockCols && c < cols; c++) {
              const seat = g.seats.find(s => s.row === r && s.colInGroup === c && !s.disabled);
              if (seat && seat.student) {
                members.push({ ...seat.student, seatRow: r, seatCol: c });
              }
            }
          }

          if (members.length > 0) {
            const grp = {
              id: `group_${groupIdx}`,
              name: `第 ${groupIdx} 小组`,
              members: members
            };
            enrichGroupStats(grp, blockRows, blockCols);
            groupList.push(grp);
            groupIdx++;
          }
        }
      }
    });

    return groupList;
  }

  /**
   * 14. 成绩均衡异质分组算法 (S型蛇形优差互助搭配)
   * 将学生按成绩/名次排序后采用 S 型蛇形轮转，
   * 保证各个团队平均成绩/名次高度一致，并且优等生与潜能生同桌结对帮扶！
   * @param {Array} studentsPool 全体学生列表
   * @param {Number} groupSize 每组人数 (默认 4 人)
   * @param {Number} blockRows 课桌行数 (默认 2 行)
   * @param {Number} blockCols 课桌列数 (默认 2 列)
   */
  function serpentineBalancedGroup(studentsPool, groupSize = 4, blockRows = 2, blockCols = 2) {
    if (!studentsPool || studentsPool.length === 0) return [];

    // 拷贝并按成绩/名次排序 (名次1为最优，若无名次按999排在最后)
    const sorted = [...studentsPool].sort((a, b) => {
      const rA = (typeof a.rank === 'number' && a.rank > 0) ? a.rank : 999;
      const rB = (typeof b.rank === 'number' && b.rank > 0) ? b.rank : 999;
      return rA - rB;
    });

    const totalStudents = sorted.length;
    const groupCount = Math.max(1, Math.ceil(totalStudents / groupSize));

    // 初始化各个小组
    const groupList = [];
    for (let i = 0; i < groupCount; i++) {
      groupList.push({
        id: `team_${i + 1}`,
        name: `第 ${i + 1} 小组`,
        members: []
      });
    }

    // S型蛇形分发 (Serpentine distribution)
    let stuIdx = 0;
    let round = 0;
    while (stuIdx < totalStudents) {
      if (round % 2 === 0) {
        // 正向 0 -> groupCount - 1
        for (let g = 0; g < groupCount && stuIdx < totalStudents; g++) {
          groupList[g].members.push({ ...sorted[stuIdx] });
          stuIdx++;
        }
      } else {
        // 反向 groupCount - 1 -> 0
        for (let g = groupCount - 1; g >= 0 && stuIdx < totalStudents; g--) {
          groupList[g].members.push({ ...sorted[stuIdx] });
          stuIdx++;
        }
      }
      round++;
    }

    // 为每个小组内部分配座位位置 (例如 2x2: 前排左优、前排右差做同桌结对帮扶，后排坐中等生)
    groupList.forEach((group) => {
      const mCount = group.members.length;
      if (mCount >= 2) {
        // 组内排序
        group.members.sort((a, b) => {
          const rA = (typeof a.rank === 'number' && a.rank > 0) ? a.rank : 999;
          const rB = (typeof b.rank === 'number' && b.rank > 0) ? b.rank : 999;
          return rA - rB;
        });

        // 排布：0(优), last(困), 1(中1), 2(中2)...
        const arranged = [];
        arranged.push(group.members[0]); // 前排左: 优等生⭐
        if (mCount > 1) arranged.push(group.members[mCount - 1]); // 前排右: 互助生🤝 (同桌结对)
        for (let i = 1; i < mCount - 1; i++) {
          arranged.push(group.members[i]); // 后排坐中坚力量
        }
        group.members = arranged;
      }

      enrichGroupStats(group, blockRows, blockCols);
    });

    return groupList;
  }

  /**
   * 15. 将各个小组按物理区域映射排入班级座位表中 (实现组员坐在一起)
   * @param {Array} groups 班级座位组 (state.groups)
   * @param {Array} cooperativeGroups 小组列表 (state.cooperativeGroups)
   * @param {Number} blockRows 每组行数 (默认 2)
   * @param {Number} blockCols 每组列数 (默认 2)
   */
  function applyTeamsToSeats(groups, cooperativeGroups, blockRows = 2, blockCols = 2) {
    if (!groups || groups.length === 0 || !cooperativeGroups || cooperativeGroups.length === 0) return false;

    // 清空未锁定的座位
    groups.forEach(g => {
      g.seats.forEach(s => {
        if (s.student && !s.student.locked) {
          s.student = null;
        }
      });
    });

    // 收集所有区域块
    const areaBlocks = [];
    groups.forEach(g => {
      const rows = g.rows;
      const cols = g.colCount;
      for (let rStart = 1; rStart <= rows; rStart += blockRows) {
        for (let cStart = 0; cStart < cols; cStart += blockCols) {
          const blockSeats = [];
          for (let r = rStart; r < rStart + blockRows && r <= rows; r++) {
            for (let c = cStart; c < cStart + blockCols && c < cols; c++) {
              const seat = g.seats.find(s => s.row === r && s.colInGroup === c && !s.disabled);
              if (seat) blockSeats.push(seat);
            }
          }
          if (blockSeats.length > 0) {
            areaBlocks.push(blockSeats);
          }
        }
      }
    });

    // 将各个小组依次填入区域块
    cooperativeGroups.forEach((team, tIdx) => {
      if (tIdx < areaBlocks.length) {
        const seats = areaBlocks[tIdx];
        team.members.forEach((stu, mIdx) => {
          if (mIdx < seats.length) {
            if (!seats[mIdx].student || !seats[mIdx].student.locked) {
              seats[mIdx].student = { ...stu };
            }
          }
        });
      }
    });

    return true;
  }

  return {
    shuffle,
    randomArrange,
    genderPairArrange,
    sameGenderPairArrange,
    scoreRankArrange,
    heightArrange,
    peerHelpArrange,
    visionProtectArrange,
    sequentialArrange,
    snakeArrange,
    rotateGroups,
    rotateColumns,
    rotateRows,
    shiftColumns,
    shiftRows,
    autoAreaGroup,
    serpentineBalancedGroup,
    applyTeamsToSeats,
    enrichGroupStats
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ArrangeRules;
}
