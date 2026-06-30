# Sanko Server — 联调用小后端

独立于 `sanko_read` 前端的 Node.js + Express 服务，用于练习 **RESTful API** 前后端联调。

## 快速开始

```bash
# 1. 安装依赖
cd sanko_server
npm install

# 2. 启动后端（默认 http://localhost:8083）
npm run dev

# 3. 另开终端，启动前端
cd ../sanko_read
npm run dev
```

## 切换 Mock / 真实后端

前端通过环境变量切换，**不需要删 Mock 代码**：

| 模式 | 配置 | 行为 |
|------|------|------|
| 内置 Mock（默认） | `VITE_USE_MOCK=true` | 不请求本服务 |
| 联调本服务 | `VITE_USE_MOCK=false` | 请求 `VITE_API_BASE_URL` |

推荐：复制 `sanko_read/.env.development.local.example` 为 `.env.development.local`：

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://127.0.0.1:8083
```

修改 `.env*` 后需 **重启** 前端 `npm run dev`。

## 已实现接口（联调够用）

| 模块 | 路径 |
|------|------|
| 健康检查 | `GET /health` |
| 认证 | `POST /api/auth/login`、`/logout`、`GET /me` |
| 设置 | `GET/PATCH /api/settings` |
| 书城 | `GET /api/catalog/home`、`/filters`、`/books`、`/books/:id`、评论（含 `rating`）、标签屏蔽 |
| 公告 | `GET /api/announcement/latest` |
| 账号 | `GET /api/profile/account` |
| 阅读历史 | `GET /api/books/reading-history`（需登录） |
| 个人书库 | `GET/POST /api/books`、`/search`、`POST /:id/file`、`DELETE /:id`、`/:id/file-url`、`/:id/progress`（需登录） |
| 喜欢 | `GET/POST/DELETE /api/favorites/:bookId` |
| 书架 | `GET/POST/PATCH/DELETE /api/bookshelves/*` |
| 标注 / 书签 | `GET/POST /api/annotations`、`/api/bookmarks` |
| 积分 | `GET /api/profile/points/summary`、`/orders`、`POST /recharge` |
| AI 聊天 | `POST /api/chat`（支持 `source`、`bookId`） |
| 样本书 | `GET /files/demo.epub` 等 |

响应格式与前端一致：

```json
{ "code": 0, "message": "ok", "data": { ... } }
```

## 联调验证

1. 后端 `npm run dev`，访问 http://localhost:8083/health
2. 前端 `VITE_USE_MOCK=false`，打开 DevTools → Network
3. 登录：任意用户名 + 非空密码
4. 首页 5 本书应来自 `GET /api/catalog/home`
5. 点《三体》→ `GET /api/catalog/books/n0`
6. 首页 AI 聊天 → `POST /api/chat`，body 含 `"source":"home"`
7. 登录后 → `GET /api/announcement/latest`（公告弹窗）
8. 三体介绍页发评论 → `POST /api/catalog/books/n0/comments`（可带 `rating`）
9. 账号页 → `GET /api/profile/account`

完整 2.0 说明见 [`docs/VERSION_2.0.md`](../docs/VERSION_2.0.md)。

## 说明

- 数据存在 **内存**，重启后端会清空（登录、个人书库等）
- 书城种子数据在 `src/seed.js`，与前端《三体》示例对齐
- 阅读文件通过 `/files/*` 提供，指向前端 `sanko_read/public/sample-books`
- 用户上传的书文件保存在 `uploads/`，通过 `GET /files/uploads/:filename` 访问

## 脚本

| 命令 | 说明 |
|------|------|
| `npm start` | 启动服务 |
| `npm run dev` | 启动并监听文件变化（Node --watch） |
