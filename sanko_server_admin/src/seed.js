/** 与 sanko_admin 前端 seed 对齐的初始数据 */

import { applyBookContent } from './bookContent.js'



function book(partial) {

  return applyBookContent(partial)

}



export function createSeedData() {

  return {

    users: [

      { id: 'u001', username: 'reader_a', email: 'a@sanko.local', registeredAt: '2026-01-10', status: '正常' },

      { id: 'u002', username: 'bookworm', email: 'b@sanko.local', registeredAt: '2026-02-03', status: '正常' },

      { id: 'u003', username: 'demo_user', email: 'demo@sanko.local', registeredAt: '2026-03-15', status: '禁用' },

    ],

    books: [

      book({

        id: 'b001',

        title: '三体',

        author: '刘慈欣',

        category: '科幻',

        purchaseType: '免费',

        status: 'approved',

        updatedAt: '2026-06-01',

        format: 'EPUB',

        fileSize: '1.4 MB',

        coverColor: '#2d6a4f',

        coverTitle: '三体',

        synopsis: '地球文明向宇宙发出第一声啼鸣，却引来了三体文明的回应。一部硬科幻史诗的开篇。',

        tableOfContents: ['第一部 科学边界', '第二部 三体游戏', '第三章 射手与农场主', '第四章 三体、周文王、长夜'],

      }),

      book({

        id: 'b002',

        title: '活着',

        author: '余华',

        category: '文学',

        purchaseType: '积分',

        status: 'approved',

        updatedAt: '2026-05-20',

        format: 'EPUB',

        fileSize: '860 KB',

        coverColor: '#bc4749',

        coverTitle: '活着',

        synopsis: '讲述了在大时代背景下，徐福贵的人生和家庭不断经受苦难的故事。',

        tableOfContents: ['第一章', '第二章', '第三章', '第四章', '第五章'],

      }),

      book({

        id: 'b003',

        title: '小王子',

        author: '圣埃克苏佩里',

        category: '出版',

        purchaseType: '免费',

        status: 'approved',

        updatedAt: '2026-04-12',

        format: 'PDF',

        fileSize: '2.1 MB',

        coverColor: '#e09f3e',

        coverTitle: '小王子',

        synopsis: '一个来自外星球的小王子，讲述自己星球和玫瑰的故事，以及在地球上遇到的各类人物。',

        tableOfContents: ['第一章 画羊', '第二章 遇见飞行员', '第三章 玫瑰', '第四章 狐狸'],

      }),

      book({

        id: 'b004',

        title: '我的学习笔记',

        author: 'reader_a',

        category: '学习资料',

        purchaseType: '免费',

        status: 'pending',

        uploader: 'reader_a',

        uploadedAt: '2026-06-10 15:30',

        updatedAt: '2026-06-10',

        format: 'PDF',

        fileSize: '2.4 MB',

        coverColor: '#457b9d',

        coverTitle: '学习笔记',

        synopsis: '个人整理的高等数学与线性代数复习笔记，含例题与公式汇总。',

        tableOfContents: ['第一章 函数与极限', '第二章 导数与微分', '第三章 积分', '附录 公式速查'],

      }),

      book({

        id: 'b005',

        title: '原创短篇集',

        author: 'bookworm',

        category: '文学',

        purchaseType: '免费',

        status: 'pending',

        uploader: 'bookworm',

        uploadedAt: '2026-06-09 09:45',

        updatedAt: '2026-06-09',

        format: 'EPUB',

        fileSize: '1.1 MB',

        coverColor: '#6d597a',

        coverTitle: '短篇集',

        synopsis: '作者原创短篇小说合集，共五篇，题材涵盖都市、悬疑与科幻。',

        tableOfContents: ['雨夜', '最后一班地铁', '镜中人', '信', '无人接听'],

      }),

    ],

    comments: [

      { id: 'c001', user: 'reader_a', book: '三体', content: '非常好看，强力推荐！', date: '2026-06-02', likes: 30, reported: 0 },

      { id: 'c002', user: 'demo_user', book: '活着', content: '读哭了……', date: '2026-05-28', likes: 12, reported: 1 },

      { id: 'c003', user: 'bookworm', book: '小王子', content: '经典永不过时。', date: '2026-06-08', likes: 8, reported: 0 },

    ],

    pointRecords: [

      { id: 'p001', user: 'reader_a', type: '充值', amount: '+500', balance: 1250, time: '2026-06-10 14:30' },

      { id: 'p002', user: 'bookworm', type: '消费', amount: '-80', balance: 320, time: '2026-06-09 09:15' },

      { id: 'p003', user: 'demo_user', type: '充值', amount: '+100', balance: 100, time: '2026-06-08 18:00' },

    ],

    pointOrders: [

      { id: 'o001', user: 'reader_a', amount: 50, method: '微信', status: '已完成', time: '2026-06-10 14:30' },

      { id: 'o002', user: 'demo_user', amount: 10, method: '支付宝', status: '已完成', time: '2026-06-08 18:00' },

      { id: 'o003', user: 'bookworm', amount: 20, method: '微信', status: '处理中', time: '2026-06-07 11:20' },

    ],

    readingHistory: [

      { id: 'h001', user: 'reader_a', book: '三体', action: '阅读', progress: '45%', time: '2026-06-10 20:10' },

      { id: 'h002', user: 'bookworm', book: '活着', action: '阅读', progress: '100%', time: '2026-06-10 19:00' },

      { id: 'h003', user: 'demo_user', book: '小王子', action: '加入书架', progress: '-', time: '2026-06-09 11:22' },

    ],

    auditLogs: [

      { id: 'a001', type: 'file', target: '我的学习笔记.pdf', operator: 'reader_a', action: '上传文件', detail: '用户上传 PDF 文件，大小 2.4 MB', time: '2026-06-10 15:30' },

      { id: 'a002', type: 'book', target: '三体', operator: 'admin', action: '修改书籍条目', detail: '分类由「出版」改为「科幻」', time: '2026-06-01 10:00' },

    ],

    chatSessions: [

      {

        id: 's001',

        user: 'reader_a',

        source: '首页',

        messageCount: 4,

        lastMessage: '推荐几本科幻书',

        updatedAt: '2026-06-10 21:00',

        messages: [

          { role: 'user', content: '推荐几本科幻书' },

          { role: 'assistant', content: '可以试试《三体》《球状闪电》。' },

        ],

      },

      {

        id: 's002',

        user: 'bookworm',

        source: '阅读器',

        messageCount: 2,

        lastMessage: '总结第三章',

        updatedAt: '2026-06-10 16:30',

        messages: [

          { role: 'user', content: '总结第三章' },

          { role: 'assistant', content: '第三章主要讲述了主人公面对命运转折的关键情节……' },

        ],

      },

    ],

    chatConfig: {

      enabled: true,

      homeChat: true,

      readerAi: true,

      bookAi: true,

    },

    settings: {

      siteName: 'Sanko Read',

      maintenanceMode: false,

      allowRegister: true,

      announcementEnabled: true,

      announcementTitle: '系统公告',

      announcementContent: '欢迎使用 Sanko 阅读平台。',

    },

  }

}



export const DEFAULT_ADMIN = {

  id: 'admin-1',

  username: 'admin',

  email: 'admin@sanko.admin',

  role: '超级管理员',

  password: 'admin123',

  lastLoginAt: '',

}

