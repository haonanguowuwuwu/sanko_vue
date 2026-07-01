# Sanko Admin

Sanko 阅读平台管理后台，对接独立小后端 `sanko_server_admin`。

## 启动

**终端 1 — 管理小后端**

```bash
cd sanko_server_admin
npm install
npm run dev
```

**终端 2 — 管理前端**

```bash
cd sanko_admin
npm install
npm run dev
```

默认地址：http://127.0.0.1:5174

## 登录

- 用户名：`admin`
- 密码：`admin123`

## 书籍审核

书籍列表 → 待审核 → 点击「审核」进入独立审核页（`/books/:id/review`），左侧元数据与目录，右侧全文阅读区。

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 小后端地址，默认 `http://localhost:8084` |

## 模块

| 路由 | 功能 |
|------|------|
| `/login` | 管理员登录 |
| `/dashboard` | 概览 |
| `/books` | 书籍管理 |
| `/books/:id/review` | 书籍审核 / 详情 |
| 其他 | 用户、评论、积分、历史、AI、设置 |
