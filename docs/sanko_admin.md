# sanko_admin 管理后台说明

> Sanko 阅读平台的**独立管理后台前端**，与用户端 `sanko_read`（5173）及管理小后端 `sanko_server_admin`（8084）分离部署。  
> 用户端后端 `sanko_server`（8083）**不包含**管理接口，请勿混用。

**文档版本：** 1.0  
**更新日期：** 2026-07-01

---

## 1. 项目定位

| 项目 | 目录 | 端口 | 角色 |
|------|------|------|------|
| 管理前端 | `sanko_admin` | 5174 | 管理员 UI |
| 管理小后端（联调/参考实现） | `sanko_server_admin` | 8084 | Admin API |
| 用户前端 | `sanko_read` | 5173 | 读者 UI |
| 用户后端 | `sanko_server` | 8083 | 读者 API |

`sanko_admin` **没有内置 Mock**，启动后必须连接可用的 Admin API，否则无法登录与加载数据。

---

## 2. 技术栈

- Vue 3 + TypeScript + Vite
- Element Plus、Vue Router、Pinia
- HTTP：`src/api/request.ts` + `src/api/admin.ts`

关键目录：

```
sanko_admin/
├── src/
│   ├── api/           # HTTP 封装与接口定义
│   ├── stores/        # adminAuth、adminData
│   ├── views/         # 各业务页面
│   ├── types/         # AdminBook、AdminUser 等类型
│   └── router/        # 路由与登录守卫
├── .env.development   # VITE_API_BASE_URL
└── package.json
```

---

## 3. 本地启动

### 3.1 启动顺序

**终端 1 — 管理小后端**

```bash
cd sanko_server_admin
npm install
npm run dev
```

确认控制台输出类似：

```text
sanko_server_admin listening on http://localhost:8084
[books] b005 fullContent=1563 chars, preview=61 chars
```

或访问 `GET http://localhost:8084/health`，`sampleBookContentChars` 应大于 500。

**终端 2 — 管理前端**

```bash
cd sanko_admin
npm install
npm run dev
```

浏览器打开：http://127.0.0.1:5174

### 3.2 默认管理员账号（小后端 seed）

| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 密码 | `admin123` |

正式环境请替换为真实鉴权，勿使用默认密码。

### 3.3 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | Admin API 根地址 | `http://localhost:8084` |

修改方式：编辑 `sanko_admin/.env.development`，或新建 `.env.development.local`（本地覆盖，勿提交仓库）。

```env
VITE_API_BASE_URL=http://127.0.0.1:8084
```

生产构建：

```bash
cd sanko_admin
npm run build
# 构建产物在 dist/，部署时需注入正确的 VITE_API_BASE_URL
```

---

## 4. 功能模块

| 路由 | 页面 | 功能 |
|------|------|------|
| `/login` | 登录 | 管理员登录 |
| `/dashboard` | 概览 | 统计卡片、快捷入口、最近操作 |
| `/profile` | 个人资料 | 修改用户名/邮箱、密码 |
| `/users` | 用户管理 | 搜索、新建、编辑、启用/禁用 |
| `/books` | 书籍管理 | 分 tab：已上架 / 待审核 / 已驳回 / 已下架 |
| `/books/:id/review` | 书籍审核 | 独立审核页：左侧元数据，右侧全文阅读 |
| `/comments` | 评论管理 | 搜索、删除 |
| `/points` | 积分管理 | 流水、充值订单 |
| `/history` | 历史记录 | 操作日志、阅读历史 |
| `/chat` | AI 聊天 | 会话列表、功能开关 |
| `/settings` | 系统设置 | 站点名、维护模式、公告等 |

### 4.1 书籍审核流程

1. **书籍管理** → **待审核** tab  
2. 点击 **审核** → 跳转 `/books/:id/review`  
3. 阅读右侧 **正文审阅**（`fullContent`）  
4. **通过审核** 或 **驳回**（驳回必填原因）  
5. 已上架书籍可 **编辑**、**下架**；任意状态可 **查看**

---

## 5. 后端如何对接

### 5.1 总体原则

1. **接口前缀**：`/api/admin/*`（与用户端 `/api/auth`、`/api/catalog` 等分开）  
2. **响应格式**：与用户端小后端一致  

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

失败时 `code !== 0`，HTTP 状态码建议 4xx/5xx。

3. **鉴权**：除登录外，请求头携带  

```http
Authorization: Bearer <token>
```

4. **Token 存储**（浏览器 localStorage，与用户端隔离）  
   - `sanko_admin_token`  
   - `sanko_admin_profile`

5. **CORS**：需允许管理前端源  
   - `http://localhost:5174`  
   - `http://127.0.0.1:5174`  
   - 生产环境改为实际管理域名

6. **缓存**：建议 Admin API 响应头  

```http
Cache-Control: no-store, no-cache, must-revalidate
```

前端 `fetch` 已设置 `cache: 'no-store'`。

### 5.2 对接步骤（给后端同学）

| 步骤 | 说明 |
|------|------|
| ① 参考实现 | 阅读 `sanko_server_admin/src/routes/`，行为与字段以此为准 |
| ② 实现接口 | 按下方 **§6 接口清单** 实现；类型见 `sanko_admin/src/types/modules.ts` |
| ③ 配置前端 | 将 `VITE_API_BASE_URL` 指向你的服务地址 |
| ④ 验证 | 登录 → bootstrap 有数据 → 待审核书籍审核页有 `fullContent` |

**不必改前端业务代码的情况**：只要 API 路径、响应 envelope、字段名与类型与小后端一致，仅改环境变量即可切换。

**需要改前端的情况**：路径或字段不一致时，改 `sanko_admin/src/api/admin.ts` 及 `src/types/`。

### 5.3 与用户端后端的关系

```
sanko_read  ──→  sanko_server:8083     （读者 API，只读/用户操作）
sanko_admin ──→  sanko_server_admin:8084  （管理 API，联调参考）
              ──→  将来：正式 Admin 服务   （同一套 /api/admin 契约）
```

**不要把 Admin 路由塞进 `sanko_server`**：权限模型、数据范围、部署方式不同，应独立服务或独立模块+独立网关。

### 5.4 登录与 Bootstrap

**登录** `POST /api/admin/auth/login`

```json
// Request
{ "username": "admin", "password": "admin123" }

// Response data
{
  "token": "…",
  "profile": {
    "id": "admin-1",
    "username": "admin",
    "email": "admin@sanko.admin",
    "role": "超级管理员",
    "lastLoginAt": "2026-07-01 18:00:00"
  }
}
```

**全量数据** `GET /api/admin/bootstrap`（登录后）

返回 `AdminDataState`，结构见 `sanko_admin/src/types/modules.ts`：

- `users`、`books`、`comments`、`pointRecords`、`pointOrders`  
- `readingHistory`、`auditLogs`、`chatSessions`  
- `chatConfig`、`settings`

前端登录成功后会调用 bootstrap 填充 Pinia；各页面的增删改后再调具体接口并 `reloadBootstrap()`。

### 5.5 书籍对象（审核重点）

```typescript
interface AdminBook {
  id: string
  title: string
  author: string
  category: string
  purchaseType: string        // 如「免费」「积分」
  status: 'pending' | 'approved' | 'rejected' | 'offline'
  uploader?: string
  uploadedAt?: string
  updatedAt: string
  format: string
  fileSize: string
  coverColor: string
  coverTitle: string
  synopsis: string
  tableOfContents: string[]
  previewExcerpt: string      // 列表/摘要用短文本
  fullContent?: string        // 审核页正文，必须提供可读全文或 HTML/纯文本
  rejectReason?: string
}
```

审核页优先展示 `fullContent`，缺失时回退 `previewExcerpt`。

**编辑书籍**：`PATCH /api/admin/books/:id` 若字段无变化，**不应**写审计日志、不应改 `updatedAt`（小后端已实现，正式后端建议一致）。

---

## 6. 接口清单

基准路径：`{VITE_API_BASE_URL}`，以下路径均相对于该根地址。

### 6.1 认证 `/api/admin/auth`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/login` | 登录，body: `{ username, password }` |
| POST | `/logout` | 登出（需 token） |
| GET | `/me` | 当前管理员信息 |
| PATCH | `/profile` | body: `{ username, email }` |
| PATCH | `/password` | body: `{ current, next }` |

### 6.2 数据 `/api/admin`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/bootstrap` | 全量管理数据 |
| GET | `/dashboard/stats` | 概览统计 `[{ label, value, sub }]` |

### 6.3 用户

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/users?keyword=` | 列表 |
| POST | `/users` | 新建，body: `{ username, email }` |
| PATCH | `/users/:id` | 编辑；无变化不写日志 |
| POST | `/users/:id/toggle-status` | 启用/禁用 |

### 6.4 书籍

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/books?keyword=&status=` | 列表，`status`: pending / approved / rejected / offline / all |
| GET | `/books/:id` | 详情（含 fullContent） |
| POST | `/books` | 管理员新建 |
| PATCH | `/books/:id` | 编辑元数据；无变化不写日志 |
| POST | `/books/:id/approve` | 审核通过 |
| POST | `/books/:id/reject` | 驳回，body: `{ reason }`，必填 |
| POST | `/books/:id/offline` | 下架 |

### 6.5 评论 / 积分 / 历史

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/comments?keyword=` | 评论列表 |
| DELETE | `/comments/:id` | 删除评论 |
| GET | `/points/records?keyword=` | 积分流水 |
| GET | `/points/orders?keyword=` | 充值订单 |
| GET | `/history/reading?keyword=` | 阅读历史 |
| GET | `/history/audit-logs?keyword=&type=` | 操作日志，`type`: file / book / all |

### 6.6 AI / 设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/chat/sessions?keyword=` | 会话列表 |
| GET | `/chat/sessions/:id` | 会话详情（含 messages） |
| GET | `/chat/config` | AI 开关配置 |
| PATCH | `/chat/config` | 更新 ChatConfig |
| GET | `/settings` | 系统设置 |
| PATCH | `/settings` | 更新 SystemSettings |

### 6.7 健康检查（无需登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | `{ status, service, sampleBookContentChars }` |

---

## 7. 前端代码入口（二次开发）

| 用途 | 文件 |
|------|------|
| API 根地址 | `src/api/config.ts` |
| 请求封装、错误、超时 | `src/api/request.ts` |
| 全部 Admin 接口 | `src/api/admin.ts` |
| 登录态 | `src/stores/adminAuth.ts` |
| 业务数据 | `src/stores/adminData.ts` |
| 启动拉 bootstrap | `src/bootstrap.ts` |
| 类型定义 | `src/types/modules.ts`、`src/types/admin.ts` |

新增模块建议：在 `admin.ts` 增加方法 → `adminData` store 封装 → 新建 `views/` 页面 → `router/index.ts` 与 `config/menu.ts` 注册菜单。

---

## 8. 常见问题

### 8.1 登录报「无法连接后端」

- 确认 `sanko_server_admin` 或正式 Admin 服务已启动  
- 确认 `VITE_API_BASE_URL` 与后端端口一致  
- Windows 下可尝试 `http://127.0.0.1:8084` 代替 `localhost`

### 8.2 审核页正文只有一句话

- 检查 `GET /api/admin/books/:id` 响应是否含 `fullContent`  
- 重启管理小后端，确认 `/health` 中 `sampleBookContentChars > 500`  
- 若 8084 被旧进程占用：`netstat -ano | findstr :8084` 后结束旧 PID

### 8.3 401 未登录

- 管理 API 必须在 Header 带 `Authorization: Bearer <token>`  
- 浏览器直接打开 API URL 会 401，属正常现象  
- Token 过期后重新登录

### 8.4 与用户端 Token 混淆

管理端使用 `sanko_admin_token`，用户端为 `sanko_auth_token`，互不影响。

---

## 9. 相关文档

| 文档 | 说明 |
|------|------|
| [INTEGRATION.md](./INTEGRATION.md) | **用户端** sanko_read ↔ sanko_server 联调 |
| [BACKEND_API.md](./BACKEND_API.md) | **用户端** API 契约 |
| `sanko_server_admin/README.md` | 管理小后端快速说明 |
| `sanko_admin/README.md` | 管理前端简要 README |

---

## 10. 版本记录

| 日期 | 说明 |
|------|------|
| 2026-07-01 | 初版：独立 admin 前端 + sanko_server_admin；无 Mock；独立审核页；fullContent 审核正文 |
