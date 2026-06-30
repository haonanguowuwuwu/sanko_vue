# Sanko Read 2.0 版本说明

**版本：** 2.0.0  
**日期：** 2026-06-25  
**定位：** 云端书城联调版 — 书城、评论、积分、公告、账号等前后端打通

---

## 1. 概述

2.0 在 1.x 个人书库 / 阅读器基础上，完成 **书城域** 与 **用户扩展功能** 的前后端联调。  
前端 `sanko_read` + 联调小后端 `sanko_server`（默认 **8083**）可通过 `VITE_USE_MOCK=false` 全链路验证。

| 项目 | 路径 | 默认地址 |
|------|------|----------|
| 前端 | `sanko_read/` | http://localhost:5173 |
| 小后端 | `sanko_server/` | http://127.0.0.1:8083 |

Mock 与联调切换详见 [INTEGRATION.md](./INTEGRATION.md) 第 2–3 节。

---

## 2. 2.0 新增 / 完善功能

### 2.1 书城与分类

| 功能 | 路由 | 后端接口 | 说明 |
|------|------|----------|------|
| 首页推荐 | `/` | `GET /api/catalog/home` | 关 Mock 后走 API |
| 书籍介绍 | `/book/:id` | `GET /api/catalog/books/:id` | 含版本、简介、综合评分 |
| 分类页 | `/categories` | `GET /api/catalog/filters`、`/books` | 支持属性/标签筛选 |
| 标签屏蔽 | 分类页弹窗 | `GET/PUT /api/catalog/blocked-tags` | 需登录 |

### 2.2 评分与评论

| 功能 | 前端 | 后端 | 备注 |
|------|------|------|------|
| **书籍综合评分** | 介绍页 `BookRatingBadge` | `GET /api/catalog/books/:id` 返回 `rating`、`ratingMax` | **静态种子**，发评论不会自动重算 |
| **评论星级** | 发评论时选星 | `POST /api/catalog/books/:id/comments` body: `{ content, rating? }` | 1–5 星，存内存 |
| 评论列表 | `BookCommentSection` | `GET /api/catalog/books/:id/comments` | 含回复、点赞、举报 |
| 回复 / 点赞 / 举报 | 同上 | `POST .../replies`、`.../like`、`.../report` | 需登录 |

### 2.3 用户与积分

| 功能 | 路由 | 后端接口 |
|------|------|----------|
| 顶栏积分 | Header | `GET /api/profile/points/summary` |
| 个人空间（三合一） | `/profile` | 账号 + 积分总览 / 充值 / 订单 |
| 阅读历史 | `/profile/history` | `GET /api/books/reading-history` |

> `/profile/points`、`/profile/account` 已重定向到 `/profile`。

### 2.4 公告与 AI

| 功能 | 触发 | 后端接口 |
|------|------|----------|
| **公告弹窗** | 每次登录成功 | `GET /api/announcement/latest` |
| 首页 AI | 首页 ChatPanel | `POST /api/chat`（`source: "home"`） |
| 介绍页 AI | 书籍介绍「AI 助手」 | `POST /api/chat`（`source: "book"`, `bookId`） |
| 阅读页 AI | 阅读器右下角 | `POST /api/chat`（`source: "reader"`, `bookId`） |

### 2.5 个人书库（1.x 延续，2.0 加固）

- 未登录书架为空；登录后 `bootstrap` 拉取个人数据
- `POST/GET/DELETE /api/books/*` 需登录
- 喜欢、书架、标注、书签、进度、上传文件等仍走原有用户域 API

---

## 3. 前端页面一览

| 页面 | 路由 | 需登录 | 主要 API |
|------|------|--------|----------|
| 首页 | `/` | 否 | catalog/home, chat |
| 书籍介绍 | `/book/:id` | 部分操作需登录 | catalog/books/:id, comments, chat |
| 分类 | `/categories` | 屏蔽标签需登录 | catalog/filters, books, blocked-tags |
| 本地书架 | `/library` | 否（数据需登录） | books |
| 喜欢 | `/favorites` | 否 | favorites, books |
| 书架分组 | `/shelf/:shelfId` | 否 | bookshelves, books |
| 个人空间 | `/profile` | 是 | profile/account, profile/points/* |
| 阅读历史 | `/profile/history` | 是 | books/reading-history |
| 阅读器 | `/read/:id` | 是 | books/file-url, progress, annotations |

---

## 4. 2.0 新增后端接口

| 模块 | 方法 | 路径 | 认证 |
|------|------|------|------|
| 公告 | GET | `/api/announcement/latest` | 否 |
| 账号 | GET | `/api/profile/account` | 是 |
| 书城评论 | GET | `/api/catalog/books/:bookId/comments` | 否 |
| 书城评论 | POST | `/api/catalog/books/:bookId/comments` | 是 |
| 回复 | POST | `/api/catalog/comments/:id/replies` | 是 |
| 点赞 | POST/DELETE | `/api/catalog/comments/:id/like` | 是 |
| 举报 | POST | `/api/catalog/comments/:id/report` | 是 |
| 标签屏蔽 | GET/PUT | `/api/catalog/blocked-tags` | 是 |
| 阅读历史 | GET | `/api/books/reading-history` | 是 |

`GET /api/auth/me` 扩展字段：`email`、`registeredAt`（小后端为演示拼出）。

### 数据模型补充（CatalogBook）

```json
{
  "rating": 5.0,
  "ratingMax": 5.0
}
```

### 数据模型补充（CatalogComment）

```json
{
  "rating": 5
}
```

---

## 5. 联调配置

### 5.1 推荐命令（Mock 可切换，无需删代码）

```bash
# 终端 1：小后端
cd sanko_server && npm run dev

# 终端 2：前端联调
cd sanko_read && npm run dev:api
```

纯 Mock（不启小后端）：

```bash
cd sanko_read && npm run dev:mock
```

### 5.2 环境变量（备选）

复制 `sanko_read/.env.development.local.example` → `.env.development.local`：

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://127.0.0.1:8083
```

然后 `npm run dev`。修改后需重启前端。

| 文件 | 说明 |
|------|------|
| `.env.mock` | `npm run dev:mock` |
| `.env.api` | `npm run dev:api` |
| `.env.development.local` | 覆盖 `npm run dev` 的默认值 |

启动时终端会打印当前模式；浏览器控制台有 `[Sanko] …` 提示。**切换模式后请重新登录。**

完整说明见 [INTEGRATION.md](./INTEGRATION.md)。

---

## 6. 2.0 联调验证清单

| 步骤 | 操作 | 期望请求 |
|------|------|----------|
| 1 | 登录 | `POST /api/auth/login` |
| 2 | 登录成功 | `GET /api/announcement/latest`（公告弹窗） |
| 3 | 顶栏 | 显示积分；`GET /api/profile/points/summary` |
| 4 | 首页 | `GET /api/catalog/home` |
| 5 | 点《三体》 | `GET /api/catalog/books/n0`（含 rating） |
| 6 | 发评论带星 | `POST /api/catalog/books/n0/comments` |
| 7 | 分类页 | `GET /api/catalog/filters`、`/books` |
| 8 | 个人空间 | `GET /api/profile/account`、`/points/summary` |
| 9 | 阅读历史 | `GET /api/books/reading-history` |
| 10 | 介绍页 AI | `POST /api/chat`（source=book） |

---

## 7. 已知限制（2.0）

1. **小后端数据在内存**，重启丢失登录态、新评论、个人书库等（种子书城数据在 `seed.js` 保留）。
2. **书籍综合评分** 来自种子静态值，用户评论评分 **不会** 自动更新介绍页 `rating`。
3. **无独立「只评分不写评论」** 接口。
4. 账号邮箱等为演示字段，非真实用户系统。
5. Mock 模式（`VITE_USE_MOCK=true` 或 `npm run dev:mock`）仍可用，逻辑与 API 层一致；与联调模式通过命令或 env 切换，**无需删除 Mock 代码**。

---

## 8. 源码对照（2.0 新增）

| 功能 | 路径 |
|------|------|
| 公告 | `sanko_read/src/components/AnnouncementDialog.vue` |
| 公告 API | `sanko_read/src/api/announcement.ts` |
| 书籍评分 | `sanko_read/src/components/book/BookRatingBadge.vue` |
| 评论评分 | `sanko_read/src/components/book/StarRatingInput.vue` |
| 积分 Store | `sanko_read/src/stores/profile.ts` |
| 个人空间页 | `sanko_read/src/views/ProfileView.vue` |
| 积分面板组件 | `sanko_read/src/components/profile/ProfilePointsSection.vue` |
| Mock/联调切换 | `sanko_read/package.json`（`dev:mock` / `dev:api`）、`.env.mock`、`.env.api` |
| 小后端公告 | `sanko_server/src/routes/announcement.js` |
| 小后端账号 | `sanko_server/src/routes/profileAccount.js` |

---

## 9. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| **2.0.1** | 2026-06-30 | Mock/联调一键切换（`dev:mock` / `dev:api`）；个人页三合一 `/profile`；小后端补 `POST /api/books/import` |
| **2.0.0** | 2026-06-25 | 书城联调、评论评分、公告、账号、顶栏积分、介绍页 AI；分类/历史/标签屏蔽接 API |
| 1.1.0 | 2026-06-25 | 积分、file-url、书城域接口定义 |
| 1.0.0 | 2026-06-17 | 用户域接口初版 |
