# sanko_server_admin

Sanko 管理后台专用小后端，与用户端 `sanko_server`（8083）分离。

## 启动

```bash
npm install
npm run dev
```

默认端口 **8084**，可通过环境变量 `PORT` 修改。

启动成功后控制台应显示类似：

```text
[books] b005 fullContent=1563 chars, preview=61 chars
```

也可访问 `GET /health`，确认 `sampleBookContentChars` 大于 500。若为 0，说明 8084 端口被旧进程占用，需先结束旧进程再启动。

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

## 主要接口

| 模块 | 路径 |
|------|------|
| 健康检查 | `GET /health` |
| 登录 | `POST /api/admin/auth/login` |
| 登出 | `POST /api/admin/auth/logout` |
| 当前管理员 | `GET /api/admin/auth/me` |
| 更新资料 | `PATCH /api/admin/auth/profile` |
| 修改密码 | `PATCH /api/admin/auth/password` |
| 全量数据 | `GET /api/admin/bootstrap` |
| 概览统计 | `GET /api/admin/dashboard/stats` |
| 用户 | `GET/POST /api/admin/users`、`PATCH /:id`、`POST /:id/toggle-status` |
| 书籍 | `GET/POST /api/admin/books`、`GET/PATCH /:id`、审核 `POST /:id/approve|reject|offline` |

书籍对象含 `previewExcerpt`（摘要）与 `fullContent`（审核用全文）。
| 评论 | `GET /api/admin/comments`、`DELETE /:id` |
| 积分 | `GET /api/admin/points/records`、`GET /api/admin/points/orders` |
| 历史 | `GET /api/admin/history/reading`、`GET /api/admin/history/audit-logs` |
| AI | `GET /api/admin/chat/sessions`、`GET /config`、`PATCH /config` |
| 设置 | `GET/PATCH /api/admin/settings` |

响应格式：`{ code: 0, message: 'ok', data: ... }`，失败时 `code !== 0`。

## 前端联调

在 `sanko_admin` 目录：

```bash
npm run dev:api
```

需同时启动本服务（8084）。
