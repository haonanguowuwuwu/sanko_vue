# Sanko Read 前后端联调指南

> 说明如何**关闭前端内置 Mock**、接入真实后端，以及联调时双方各自要做什么。  
> 接口契约见 [BACKEND_API.md](./BACKEND_API.md)，机器可读格式见 [openapi.yaml](./openapi.yaml)。

**版本：** 2.0.0  
**日期：** 2026-06-25  
**2.0 功能摘要：** 见 [VERSION_2.0.md](./VERSION_2.0.md)

---

## 1. 先读这句（给后端）

前端仓库 **默认开启 Mock**。不关闭 Mock 时：

- 浏览器 **不会** 向你的后端发送 `/api/*` 请求
- 登录、书库、积分等全部走内存假数据
- 你在 Network 里看不到任何联调痕迹

**要联调，必须按本文第 3 节关闭 Mock，并实现 [BACKEND_API.md](./BACKEND_API.md) 中的接口。**

---

## 2. Mock 是什么？影响哪些功能？

### 2.1 开关位置

| 项 | 说明 |
|----|------|
| 环境变量 | `VITE_USE_MOCK`（在 `sanko_read/.env.development`） |
| 联调本仓库小后端 | 复制 `sanko_read/.env.development.local.example` → `.env.development.local`，并启动 `sanko_server`（见 [sanko_server/README.md](../sanko_server/README.md)） |
| 默认值 | `true`（见 `sanko_read/.env.example`） |
| 代码逻辑 | `sanko_read/src/api/config.ts`：`USE_MOCK = env !== 'false'` |
| 生效方式 | 每个 `sanko_read/src/api/*.ts` 在 Mock 时短路，不调用 `request()` |

### 2.2 Mock 开启时（默认）

| 功能 | 行为 |
|------|------|
| 登录 | 任意非空密码即可，token 为 `mock-token-...` |
| 书库 / 回收站 / 喜欢 | 存在浏览器内存 `mockState`，刷新可能丢失 |
| 书架 / 设置 | 内存假数据 |
| 标注 / 书签 | 内存 + `localStorage` |
| 积分 | 写死余额与订单列表 |
| 导入书籍 | 文件存浏览器内存，不调后端 |
| 阅读文件 | 从内存读 buffer，**不调** `GET /api/books/{id}/file-url` |
| AI 聊天 | 固定模板回复 |
| 搜索（侧栏） | 前端本地过滤，**不调** `/api/books/search` |

### 2.3 关闭 Mock 后仍走静态 / 本地的部分

以下与 `VITE_USE_MOCK` 无关，或仅部分接 API：

| 页面 / 功能 | 数据来源 | 2.0 状态 |
|-------------|----------|----------|
| 首页推荐、书籍介绍、分类 | `/api/catalog/*` | ✅ 已接 API（`VITE_USE_MOCK=false`） |
| 评论、评分、标签屏蔽 | `/api/catalog/*` | ✅ 已接 API |
| 公告、账号、顶栏积分 | `/api/announcement`、`/api/profile/*` | ✅ 已接 API |
| 部分 UI 偏好 | `localStorage` | 仅前端，无需后端 |

> **2.0 之前**：书城域为静态数据；现已通过小后端联调。详见 [VERSION_2.0.md](./VERSION_2.0.md)。

---

## 3. 前端：如何关闭 Mock

在 **`sanko_read/`** 目录下操作（不是仓库根目录）。

### 3.1 创建环境文件

```bash
cd sanko_read
cp .env.example .env.development
```

编辑 `sanko_read/.env.development`：

```env
VITE_API_BASE_URL=http://localhost:8083
VITE_USE_MOCK=false
```

| 变量 | 说明 |
|------|------|
| `VITE_API_BASE_URL` | 后端 Base URL，不要末尾斜杠 |
| `VITE_USE_MOCK` | 必须为字符串 `false` 才关闭 Mock |

### 3.2 启动前端

```bash
cd sanko_read
npm install
npm run dev
```

默认开发地址：`http://localhost:5173`

> **修改 `.env.development` 后必须重启 `npm run dev`**，环境变量才会生效。

### 3.3 验证 Mock 已关闭

1. 打开浏览器开发者工具 → **Network**
2. 刷新页面或登录
3. 应能看到对 `http://localhost:8083/api/...` 的请求

若仍无请求，检查：

- `.env.development` 是否在 `sanko_read/` 下
- `VITE_USE_MOCK` 是否为 `false`（不是 `0` 或 `no`）
- 是否已重启 dev server

---

## 4. 后端：要提供什么

### 4.1 通用约定（必须遵守）

**响应格式：**

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

- 成功：`code === 0`
- 未登录：HTTP **401**，前端会清除 token

**认证：**

```
Authorization: Bearer <token>
```

登录接口 `POST /api/auth/login` 不需要 token。

**CORS：**

允许前端开发源，例如：

```
Access-Control-Allow-Origin: http://localhost:5173
```

### 4.2 分期实现（建议）

不要一次实现全部接口。按阶段联调：

#### P0 — 最小可跑通（优先）

| 接口 | 用途 |
|------|------|
| `POST /api/auth/login` | 登录 |
| `GET /api/auth/me` | 恢复登录态 |
| `POST /api/auth/logout` | 登出 |
| `GET /api/books` | 书库列表 |
| `POST /api/books/import` | 导入 EPUB/PDF |
| `GET /api/books/{id}/file-url` | 阅读器下载书籍 |
| `PATCH /api/books/{id}/progress` | 阅读进度 |
| `GET /api/bookshelves` | 书架列表 |
| `GET /api/favorites` | 喜欢列表 |

P0 通后：可登录、导入、阅读、看书架。

#### P1 — 个人功能完整

标注、书签、设置、积分（`/api/profile/points/*`）等。详见 [BACKEND_API.md](./BACKEND_API.md) 第 4 节。

#### P2 — 书城（2.0 已实现）

首页、详情、评论、分类、评分、标签屏蔽、公告等 `/api/catalog/*`、`/api/announcement/*`。前端已接入，详见 [VERSION_2.0.md](./VERSION_2.0.md)。

完整路径与字段见 [openapi.yaml](./openapi.yaml)（可导入 Apifox）。

---

## 5. 联调步骤（双方）

### 第一步：后端起服务

```text
http://localhost:8083
```

可用 Apifox 按 `openapi.yaml` 自测，或 Knife4j `/doc.html`。

### 第二步：前端关 Mock

按本文第 3 节配置 `.env.development`。

### 第三步：按模块验证

| 顺序 | 操作 | 期望 Network 请求 |
|------|------|-------------------|
| 1 | 打开站点 | `GET /api/settings`（若已实现） |
| 2 | 登录 | `POST /api/auth/login` → `GET /api/announcement/latest` |
| 3 | 刷新页面 | `GET /api/auth/me` |
| 4 | 进入书库 | `GET /api/books`、`GET /api/favorites`、`GET /api/bookshelves` |
| 5 | 首页 / 三体介绍 | `GET /api/catalog/home`、`GET /api/catalog/books/n0` |
| 6 | 发评论（带星） | `POST /api/catalog/books/n0/comments` |
| 7 | 分类页 | `GET /api/catalog/filters`、`GET /api/catalog/books` |
| 8 | 账号 / 积分 / 历史 | `GET /api/profile/account`、`/points/summary`、`/books/reading-history` |
| 9 | 导入书籍 | `POST /api/books/import` |
| 10 | 打开阅读器 | `GET /api/books/{id}/file-url` |
| 11 | 翻页退出 | `PATCH /api/books/{id}/progress` |

### 第四步：对照响应

前端 `sanko_read/src/api/request.ts` 要求：

- JSON  body 为 `{ code, message, data }`
- `code !== 0` 或 HTTP 非 2xx → 前端弹错误
- HTTP 401 → 清除 token，提示未登录

---

## 6. 常见问题

### Q1：后端起了，前端 Network 还是没有 `/api` 请求

- 确认 `VITE_USE_MOCK=false` 且已重启 dev server
- 确认改的是 `sanko_read/.env.development`

### Q2：登录报 CORS 错误

后端需对 `http://localhost:5173` 放行，并允许 `Authorization` 头。

### Q3：登录成功但书库空的

正常。关 Mock 后初始书库来自 `GET /api/books`，需用户导入或从书城加入。

### Q4：阅读器打不开书

检查 `GET /api/books/{id}/file-url` 返回的 `url` 是否可在浏览器直接下载。

### Q5：首页、书籍详情还是「假数据」

2.0 起在 `VITE_USE_MOCK=false` 且小后端已启动时，应来自 `/api/catalog/*`。若仍为旧数据，检查后端是否重启、Network 是否 404。

### Q6：积分页报错

P1 接口。P0 阶段可暂不访问 `/profile/points`，或后端先实现积分 summary。

---

## 7. 联调 Checklist

**后端**

- [ ] 响应格式 `{ code, message, data }`，成功 `code = 0`
- [ ] 401 返回 HTTP 401
- [ ] CORS 允许 `http://localhost:5173`
- [ ] P0 接口可用（至少 login + books + file-url）
- [ ] `file-url` 返回可访问的临时 URL

**前端**

- [ ] `sanko_read/.env.development` 中 `VITE_USE_MOCK=false`
- [ ] `VITE_API_BASE_URL` 指向后端地址
- [ ] 已重启 `npm run dev`
- [ ] Network 中能看到 `/api/*` 请求

**协作**

- [ ] 双方约定当前阶段（P0 / P1 / P2）
- [ ] 问题反馈时附带：请求 URL、请求体、响应 JSON、Network 截图

---

## 8. 相关文档

| 文档 | 用途 |
|------|------|
| [VERSION_2.0.md](./VERSION_2.0.md) | **2.0 版本说明与联调清单** |
| [BACKEND_API.md](./BACKEND_API.md) | 完整接口与数据模型 |
| [API.md](./API.md) | 精简接口说明 |
| [openapi.yaml](./openapi.yaml) | 导入 Apifox / Postman |
| [README.md](./README.md) | 文档目录索引 |

**前端源码（争议时以代码为准）**

| 模块 | 路径 |
|------|------|
| Mock 开关 | `sanko_read/src/api/config.ts` |
| 请求封装 | `sanko_read/src/api/request.ts` |
| 各 API 模块 | `sanko_read/src/api/*.ts` |
| Mock 数据 | `sanko_read/src/api/mock/state.ts` |
| 书城静态数据 | `sanko_read/src/data/catalogBooks.ts` |
