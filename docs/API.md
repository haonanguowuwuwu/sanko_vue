# Sanko Read API 接口文档

> 前端阅读应用 `sanko_read` 与后端的接口契约。  
> 依据 `sanko_read/src/api/` 整理，供 Spring Boot + Knife4j 实现参考。  
> **完整需求（含书城、积分）见 [`BACKEND_API.md`](./BACKEND_API.md)。**

---

## 如何使用本文档

| 角色 | 操作 |
|------|------|
| **后端** | 按本文档实现接口；实现后在 Knife4j `/doc.html` 维护在线文档 |
| **前端** | 联调：`npm run dev:api`；Mock：`npm run dev:mock`（详见 [INTEGRATION.md](./INTEGRATION.md)） |
| **协作** | 可导入 [`openapi.yaml`](./openapi.yaml) 到 Apifox / Postman |
| **联调（关 Mock）** | [`INTEGRATION.md`](./INTEGRATION.md) |
| **后端完整需求** | [`BACKEND_API.md`](./BACKEND_API.md)（含积分、file-url、书城域） |

**源码对照**

| 文档模块 | 前端源码 |
|----------|----------|
| 请求封装 | `sanko_read/src/api/request.ts` |
| 类型定义 | `sanko_read/src/api/types.ts` |
| 各模块 API | `sanko_read/src/api/*.ts` |

---

## 通用约定

### Base URL

```
http://127.0.0.1:8083
```

对应前端环境变量 `VITE_API_BASE_URL`。

### 统一响应格式

所有 JSON 接口（除纯文件下载外）返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

| 字段 | 说明 |
|------|------|
| `code` | `0` 成功；非 `0` 业务错误 |
| `message` | 提示信息 |
| `data` | 业务数据；无数据时为 `null` |

前端 `request.ts` 逻辑：

- HTTP 401 → 清除 token，抛出「未登录或登录已过期」
- HTTP 非 2xx 或 `code !== 0` → 抛出 `ApiError`
- 响应 `Content-Type` 非 JSON 且 HTTP 200 → 返回 `undefined`（用于文件流等场景）

### 认证

除登录外，默认需要请求头：

```
Authorization: Bearer <token>
```

登录成功后前端将 token 存入 `localStorage`（键名 `sanko_auth_token`）。

---

## 数据模型

### UserInfo

```json
{ "id": "user-1", "username": "demo" }
```

### AuthResult

```json
{
  "token": "eyJhbG...",
  "user": { "id": "user-1", "username": "demo" }
}
```

### Book

```json
{
  "id": "book-1",
  "title": "《三体》",
  "author": "刘慈欣",
  "progress": 68.42,
  "coverColor": "#1c2833",
  "coverTitle": "三体",
  "coverSubtitle": "THE THREE-BODY PROBLEM",
  "coverUrl": "https://example.com/cover.jpg",
  "fileSize": "2.4 MB",
  "format": "EPUB",
  "addedAt": "2026-06-17",
  "category": "娱乐小说",
  "lastReadAt": "2026-06-17"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `progress` | number | 是 | 阅读进度百分比 |
| `coverUrl` | string | 否 | 封面图 URL |
| `coverSubtitle` | string | 否 | 封面副标题 |
| `lastReadAt` | string | 否 | 最后阅读日期 `YYYY-MM-DD` |
| `format` | string | 是 | `PDF` 或 `EPUB` |

### Bookshelf

```json
{
  "id": "shelf-1",
  "name": "学习资料",
  "bookIds": ["book-1", "book-3"]
}
```

### ReaderSpread / ReaderBlock

阅读页按「双页 spread」组织内容：

```json
{
  "chapter": "chapter 0",
  "left": {
    "page": 1,
    "blocks": [
      {
        "id": "s0-l-p1",
        "type": "paragraph",
        "text": "段落正文……",
        "defaultBg": "gray"
      }
    ]
  },
  "right": {
    "page": 2,
    "blocks": []
  }
}
```

`ReaderBlock.type`：`paragraph` | `title` | `subtitle`

### ReaderHighlight（标注：高亮 + 笔记）

```json
{
  "id": "hl-1",
  "bookId": "book-1",
  "blockId": "s0-l-p1",
  "spreadIndex": 0,
  "start": 0,
  "end": 12,
  "color": "blue",
  "quote": "本书精选雅思",
  "chapter": "chapter 0",
  "note": "重点段落",
  "createdAt": "2026-06-17T10:00:00.000Z"
}
```

| 字段 | 说明 |
|------|------|
| `start` / `end` | 在 `block.text` 中的字符偏移，`start` 含、`end` 不含 |
| `color` | `blue` \| `green` \| `cyan` \| `yellow` \| `purple` \| `gray` |
| `range` | kookit rangy 字符 range 的 JSON 字符串（可选） |
| `chapterDocIndex` | 章节文档索引（可选） |

### BookFileUrl

```json
{
  "url": "https://storage.example.com/books/book-1.epub?sign=...",
  "expiresAt": "2026-06-25T15:00:00.000Z",
  "contentType": "application/epub+zip",
  "contentLength": 2516582
}
```

阅读器通过 `file-url` 下载 EPUB/PDF 二进制，由客户端 kookit 解析（非 `/content` 接口）。

### PointsSummary / PointsOrder

```json
{ "balance": 12580, "totalEarned": 5260, "totalUsed": 4560 }
```

```json
{
  "id": "ORD20260625001",
  "time": "2026-06-25 14:30:00",
  "type": "recharge",
  "change": 500,
  "balance": 12580,
  "description": "积分充值-支付宝",
  "status": "completed"
}
```

充值汇率：**1 元 = 10 积分**。

### BookmarkRecord

```json
{ "id": "bm-1", "bookId": "book-1", "spreadIndex": 3 }
```

**业务规则**：每本书仅一个书签；新建时替换旧书签。

### AppSettingsDto

```json
{
  "disableRecycleBin": false,
  "hideBookshelfBooks": false,
  "directDeleteFromShelf": false,
  "noPdfCoverAsBookCover": true,
  "noCropBookCovers": false,
  "showBookshelfBookCount": true,
  "enableSoftwareProtection": false
}
```

| 字段 | 影响 |
|------|------|
| `disableRecycleBin` | `true` 时删除不进回收站 |
| `enableSoftwareProtection` | `true` 时启动/退出需登录 |
| `showBookshelfBookCount` | 侧栏显示书架图书数 |

> 以下设置目前仅存前端 localStorage，**不在 API 范围内**：`bookViewMode`、`cardCoverSize`、`bookReadStatusFilter`。

### ChatRequest / ChatResponse

```json
// 请求
{
  "message": "什么是逻辑词群？",
  "history": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "你好！" }
  ]
}

// 响应 data
{ "reply": "逻辑词群是……" }
```

### BackupResult

```json
{
  "message": "备份已创建",
  "downloadUrl": "https://example.com/backup/xxx.json"
}
```

备份 JSON 文件结构（`/api/restore` 上传）：

```json
{
  "books": [],
  "trashedBooks": [],
  "favoriteIds": [],
  "shelves": [],
  "highlights": [],
  "bookmarks": [],
  "settings": { },
  "exportedAt": "2026-06-17T12:00:00.000Z"
}
```

---

## 接口清单

### 1. 认证

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 否 | 登录 |
| POST | `/api/auth/logout` | 是 | 登出 |
| GET | `/api/auth/me` | 是 | 当前用户 |

**POST `/api/auth/login`**

请求：

```json
{ "username": "demo", "password": "123456" }
```

响应 `data`：`AuthResult`

---

### 1.5 积分

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profile/points/summary` | 积分总览 |
| GET | `/api/profile/points/orders` | 订单列表（分页、筛选） |
| POST | `/api/profile/points/recharge` | 充值 `{ amount, method }` |

---

### 2. 图书

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/books` | 书库列表（不含回收站） |
| GET | `/api/books/trash` | 回收站 |
| GET | `/api/books/search?q={keyword}` | 搜索 |
| GET | `/api/books/{id}` | 详情 |
| POST | `/api/books` | 将书城书加入个人库 |
| POST | `/api/books/import` | 导入（multipart） |
| POST | `/api/books/{id}/trash` | 移入回收站 |
| POST | `/api/books/{id}/restore` | 恢复 |
| DELETE | `/api/books/{id}` | 删除 |
| PATCH | `/api/books/{id}/progress` | 更新进度 |
| GET | `/api/books/{id}/file-url` | 书籍文件临时下载地址 |

**GET `/api/books/{id}/file-url`**

响应 `data`：`BookFileUrl`。前端用 `url` 直接下载文件交给阅读器。

**POST `/api/books/import`**

- Content-Type: `multipart/form-data`
- 字段：`file`（EPUB / PDF）

**DELETE `/api/books/{id}`**

可选 body：

```json
{ "permanent": true }
```

- 无 body：从书库删除（是否进回收站结合 `disableRecycleBin`）
- `permanent: true`：永久删除（回收站场景）

**PATCH `/api/books/{id}/progress`**

```json
{ "progress": 36.5, "lastReadAt": "2026-06-17" }
```

可只传 `progress` 或只传 `lastReadAt`。响应 `data` 为更新后的 `Book`。

---

### 3. 喜欢

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/favorites` | 返回 `string[]`（bookId 列表） |
| POST | `/api/favorites/{bookId}` | 添加 |
| DELETE | `/api/favorites/{bookId}` | 取消 |

---

### 4. 书架

| 方法 | 路径 | 请求体 |
|------|------|--------|
| GET | `/api/bookshelves` | — |
| POST | `/api/bookshelves` | `{ "name": "新书架" }` |
| PATCH | `/api/bookshelves/{id}` | `{ "name": "重命名" }` |
| DELETE | `/api/bookshelves/{id}` | — |
| PUT | `/api/bookshelves/reorder` | `{ "orderedIds": ["shelf-2", "shelf-1"] }` |
| POST | `/api/bookshelves/{id}/books` | `{ "bookId": "book-1" }` |
| DELETE | `/api/bookshelves/{id}/books/{bookId}` | — |

`PUT /reorder` 响应 `data` 为排序后的完整 `Bookshelf[]`。

---

### 5. 阅读内容

| 方法 | 路径 | 响应 `data` |
|------|------|-------------|
| GET | `/api/books/{id}/content` | `ReaderSpread[]` |
| GET | `/api/books/{id}/content/spreads/{index}` | `ReaderSpread` |

`index` 从 `0` 开始。

---

### 6. 标注

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/annotations?bookId=` | 列表，bookId 可选 |
| POST | `/api/annotations` | 创建 |
| PATCH | `/api/annotations/{id}` | 更新 |
| DELETE | `/api/annotations/{id}` | 删除 |

**POST 请求体**（无 `id`、`createdAt`，由服务端生成）：

```json
{
  "bookId": "book-1",
  "blockId": "s0-l-p1",
  "spreadIndex": 0,
  "start": 0,
  "end": 12,
  "color": "blue",
  "quote": "选中文字",
  "chapter": "chapter 0",
  "note": "可选笔记"
}
```

**PATCH 可更新字段**：`color`、`note`、`quote`、`start`、`end`、`spreadIndex`、`chapter`

---

### 7. 书签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/bookmarks?bookId=` | 列表 |
| POST | `/api/bookmarks` | 创建/替换 |
| DELETE | `/api/bookmarks/{id}` | 删除 |

**POST 请求体**：

```json
{ "bookId": "book-1", "spreadIndex": 3 }
```

---

### 8. 用户设置

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/settings` | 获取 |
| PATCH | `/api/settings` | 部分更新，返回完整设置 |

---

### 9. 备份

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/backup` | 创建备份 |
| POST | `/api/restore` | 上传 JSON 恢复 |

**POST `/api/restore`**

- Content-Type: `multipart/form-data`
- 字段：`file`（JSON 备份文件）

---

### 10. AI 聊天

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | 全局聊天 |
| POST | `/api/books/{id}/ai/chat` | 阅读页 AI 助手 |

请求体：`ChatRequest`，响应 `data`：`ChatResponse`。

> 当前前端为同步 JSON 响应。后续可扩展 SSE 流式，需前后端协商后更新文档。

---

### 11. 书城（建议新增，详见 BACKEND_API.md）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/catalog/home` | 首页推荐与榜单 |
| GET | `/api/catalog/books` | 分类筛选列表 |
| GET | `/api/catalog/books/{id}` | 书城书籍详情 |
| GET/POST | `/api/catalog/books/{id}/comments` | 评论列表 / 发表 |

前端当前用 `catalogBooks.ts` 静态数据；完整接口见 [`BACKEND_API.md`](./BACKEND_API.md) 第 5 节。

---

## 前端 Store 与 API 映射

| 前端 Store / 组件 | 相关 API |
|-------------------|----------|
| `stores/user.ts` | `/api/auth/*` |
| `stores/books.ts` | `/api/books/*`、`/api/favorites/*` |
| `stores/bookshelves.ts` | `/api/bookshelves/*` |
| `stores/readerAnnotations.ts` | `/api/annotations/*`、`/api/bookmarks/*` |
| `stores/settings.ts` | `/api/settings` |
| `AppBackupDialog.vue` | `/api/backup`、`/api/restore` |
| `ProfilePointsView.vue` | `/api/profile/points/*` |
| `ChatView.vue` | `/api/chat` |
| `ReaderAiPanel.vue` | `/api/books/{id}/ai/chat` |

---

## 联调 Checklist

- [ ] 后端 CORS 允许前端开发源（如 `http://localhost:5173`）
- [ ] 登录接口返回 `{ token, user }`，且 `/api/auth/me` 可用
- [ ] 所有接口响应 `{ code, message, data }`，成功时 `code = 0`
- [ ] 401 时 HTTP 状态码为 401
- [ ] 前端联调使用 `npm run dev:api`（或 `.env.development.local` 中 `VITE_USE_MOCK=false`）
- [ ] 按模块逐步联调：认证 → 图书 → 书架 → 阅读 → 标注

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.0 | 2026-06-25 | 新增 BACKEND_API.md；补充积分、file-url、书城域；标注颜色与 range 字段 |
| 1.0.0 | 2026-06-17 | 初版，依据前端 `src/api/` 整理 |
