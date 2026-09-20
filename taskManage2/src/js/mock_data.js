/**
 * 默认演示数据：包含典型班级、200+人大班级示范、历史任务、座位分布
 */
(function(window) {
  const SURNAMES = ['张', '王', '李', '赵', '陈', '刘', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文'];
  const GIVEN_NAMES = ['子涵', '欣怡', '梓轩', '浩宇', '宇轩', '浩然', '博文', '思源', '天宇', '泽洋', '俊杰', '雨桐', '梦洁', '佳琪', '诗涵', '若曦', '雨萱', '美琳', '雅婷', '晨曦', '奕诺', '一诺', '梓涵', '语晨', '梓豪', '俊熙', '俊豪', '宇泽', '文博', '浩轩', '皓轩', '致远', '弘文', '嘉懿', '煜祺', '智宸', '正豪', '昊天', '思齐', '立果', '安然', '文杰', '雅琪', '依诺', '梓晴', '可馨', '晓彤', '佩琪', '敏敏', '志强'];
  
  function generateStudentList(count, prefix) {
    const list = [];
    const usedNames = new Set();
    for (let i = 1; i <= count; i++) {
      let surname = SURNAMES[(i - 1) % SURNAMES.length];
      let given = GIVEN_NAMES[(i * 3 + 7) % GIVEN_NAMES.length];
      let name = surname + given;
      if (usedNames.has(name)) {
        name = surname + given + (i > 50 ? i % 10 : '');
      }
      usedNames.add(name);
      
      const gender = i % 2 === 0 ? '女' : '男';
      const groupNum = Math.ceil(i / 6);
      const studentId = `${prefix}${String(i).padStart(3, '0')}`;
      
      list.push({
        id: 'stu_' + prefix + '_' + i,
        studentId: studentId,
        name: name,
        gender: gender,
        group: `第${groupNum}组` + (i % 6 === 1 ? ' (组长)' : ''),
        phone: '138' + String(10000000 + i * 17).slice(0, 8),
        parentPhone: '139' + String(20000000 + i * 23).slice(0, 8),
        role: i === 1 ? '班长' : (i === 2 ? '学习委员' : (i === 3 ? '纪律委员' : (i % 6 === 1 ? '小组长' : '学生'))),
        note: i === 1 ? '全面负责班级事务' : (i % 7 === 0 ? '课代表' : '')
      });
    }
    return list;
  }

  // 1. 七年级(1)班：标准中班 48 人
  const class1Students = generateStudentList(48, '10');
  
  // 2. 阶梯大班示范：208 人（完美满足“每个班级至少管理200个学生，自动适配多个学生”要求）
  const class2Students = generateStudentList(208, '20');

  // 3. 高一(3)班：标准大班 64 人
  const class3Students = generateStudentList(64, '30');

  // 构建历史任务与默认当前任务
  const mockTasksClass1 = [
    {
      id: 'task_c1_1',
      name: '《论语十二章》前六章背诵',
      category: '背书',
      createTime: '2026-09-16 08:30',
      description: '要求字音准确，停顿恰当，当堂过关。',
      completedStudents: class1Students.slice(0, 42).map(s => s.id) // 42人完成
    },
    {
      id: 'task_c1_2',
      name: '数学有理数加减混合运算P18-20',
      category: '作业',
      createTime: '2026-09-17 14:00',
      description: '必须包含规范演算步骤，错题红笔订正。',
      completedStudents: class1Students.slice(5, 45).map(s => s.id) // 40人完成
    },
    {
      id: 'task_c1_3',
      name: '英语 Unit 1 重点单词听写与背诵',
      category: '听写',
      createTime: '2026-09-18 09:15',
      description: '全对或订正三次后达标过关。',
      completedStudents: class1Students.slice(0, 32).map(s => s.id) // 32人完成
    }
  ];

  // 为每个班级生成座位图布局 (行数、列数、座位与学生对应)
  function generateSeats(students, rows, cols) {
    const seatMap = {};
    let sIdx = 0;
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        if (sIdx < students.length) {
          seatMap[`${r}-${c}`] = students[sIdx].id;
          sIdx++;
        } else {
          seatMap[`${r}-${c}`] = null;
        }
      }
    }
    return { rows, cols, seats: seatMap };
  }

  const initialData = {
    version: '2.0',
    currentClassId: 'class_1',
    classes: [
      {
        id: 'class_1',
        name: '七年级(1)班',
        grade: '初一',
        subject: '语文/综合',
        students: class1Students,
        tasks: mockTasksClass1,
        activeTaskId: 'task_c1_3',
        seating: generateSeats(class1Students, 6, 8) // 6行8列 = 48座
      },
      {
        id: 'class_2',
        name: '年级大课/阶梯班(208人超大班示范)',
        grade: '初一年级',
        subject: '公共课/素养拓展',
        students: class2Students,
        tasks: [
          {
            id: 'task_c2_1',
            name: '开学安全与行为规范承诺书签署打卡',
            category: '打卡',
            createTime: '2026-09-15 10:00',
            description: '全员签署安全责任书并完成回执上交。',
            completedStudents: class2Students.slice(0, 195).map(s => s.id) // 195人完成
          },
          {
            id: 'task_c2_2',
            name: '青年大学习/道德法治第一讲心得过关',
            category: '背书',
            createTime: '2026-09-18 10:30',
            description: '当堂背诵核心价值观及守则。',
            completedStudents: class2Students.slice(0, 138).map(s => s.id) // 138人完成
          }
        ],
        activeTaskId: 'task_c2_2',
        seating: generateSeats(class2Students, 14, 15) // 14行15列 = 210座
      },
      {
        id: 'class_3',
        name: '高一(3)班',
        grade: '高一',
        subject: '重点班',
        students: class3Students,
        tasks: [
          {
            id: 'task_c3_1',
            name: '必修一古文《劝学》全文默写',
            category: '背书',
            createTime: '2026-09-17 16:30',
            description: '一字不错满分过关。',
            completedStudents: class3Students.slice(0, 52).map(s => s.id)
          }
        ],
        activeTaskId: 'task_c3_1',
        seating: generateSeats(class3Students, 8, 8) // 8行8列 = 64座
      }
    ]
  };

  window.MOCK_DATA = initialData;
})(window);
