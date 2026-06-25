# Sanko Read 后端接口需求文档

> 依据前端 `sanko_read` 整理，供后端实现参考。  
> 机器可读契约见 [`openapi.yaml`](./openapi.yaml)；精简版见 [`API.md`](./API.md)。

**版本：** 1.1.0  
**日期：** 2026-06-25

---

## 1. 概述

Sanko Read 是阅读类 Web 应用。联调时前端设置：

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8080
```

接口分为两类：

| 类型 | 说明 | 状态 |
|------|------|------|
| **用户域 API** | 登录、个人书库、书架、标注、设置、积分等 | 前端已定义路径，待后端实现 |
| **书城域 API** | 首页推荐、榜单、书籍详情、评论等 | 前端目前用静态数据，需后端新增 |

---

## 2. 通用约定

### 2.1 Base URL

```
http://localhost:8080
```

### 2.2 统一响应格式

除纯文件下载外，所有 JSON 接口返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

| 字段 | 说明 |
|------|------|
| `code` | `0` 表示成功；非 `0` 为业务错误 |
| `message` | 提示信息 |
| `data` | 业务数据；无数据时为 `null` |

### 2.3 认证

- 除 `POST /api/auth/login` 及书城只读接口外，默认需要请求头：
  ```
  Authorization: Bearer <token>
  ```
- 登录成功后前端将 `token` 存入 `localStorage`（键名：`sanko_auth_token`）
- HTTP **401** 时前端清除 token，提示「未登录或登录已过期」

### 2.4 CORS

开发环境需允许前端源，例如：`http://localhost:5173`

---

## 3. 数据模型

### 3.1 UserInfo

```json
{ "id": "user-1", "username": "demo" }
```

### 3.2 AuthResult

```json
{
  "token": "eyJhbG...",
  "user": { "id": "user-1", "username": "demo" }
}
```

### 3.3 Book（个人书库）

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
| `progress` | number | 是 | 阅读进度百分比 0–100 |
| `format` | string | 是 | 如 `PDF`、`EPUB` |
| `addedAt` | string | 是 | 加入书库日期 `YYYY-MM-DD` |
| `lastReadAt` | string | 否 | 最后阅读日期，阅读历史依赖此字段 |

### 3.4 BookFileUrl（书籍文件下载）

阅读器通过此接口获取临时下载地址，**不是**解析后的文本内容。

```json
{
  "url": "https://storage.example.com/books/book-1.epub?sign=...",
  "expiresAt": "2026-06-25T15:00:00.000Z",
  "contentType": "application/epub+zip",
  "contentLength": 2516582
}
```

### 3.5 Bookshelf

```json
{ "id": "shelf-1", "name": "学习资料", "bookIds": ["book-1", "book-3"] }
```

### 3.6 ReaderHighlight（高亮 / 笔记）

```json
{
  "id": "hl-1",
  "bookId": "book-1",
  "blockId": "s0-l-p1",
  "spreadIndex": 0,
  "start": 0,
  "end": 12,
  "color": "blue",
  "quote": "选中文字",
  "chapter": "chapter 0",
  "note": "可选笔记",
  "range": "{\"start\":...}",
  "chapterDocIndex": 0,
  "createdAt": "2026-06-17T10:00:00.000Z"
}
```

| 字段 | 说明 |
|------|------|
| `color` | `blue` \| `green` \| `cyan` \| `yellow` \| `purple` \| `gray` |
| `range` | kookit rangy 字符 range 的 JSON 字符串 |
| `chapterDocIndex` | 章节文档索引（可选） |

### 3.7 ReaderBookmark

```json
{
  "id": "bm-1",
  "bookId": "book-1",
  "spreadIndex": 3,
  "chapter": "第三章",
  "createdAt": "2026-06-17T10:00:00.000Z"
}
```

**业务建议：** 每本书仅保留一个书签，新建时替换旧书签。

### 3.8 AppSettingsDto

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

> 以下设置仅存前端 localStorage，**不需要后端**：`bookViewMode`、`cardCoverSize`、`bookReadStatusFilter`、导出格式偏好等。

### 3.9 PointsSummary / PointsOrder

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

`type`：`recharge` \| `earn` \| `use`；`status`：`completed` \| `pending` \| `failed`  
充值汇率：**1 元 = 10 积分**

### 3.10 CatalogBook / CatalogComment（书城，待实现）

```json
{
  "id": "n0",
  "title": "三体",
  "author": "刘慈欣",
  "coverColor": "#f0c419",
  "coverTitle": "三体",
  "description": "榜单短描述",
  "category": "科幻 · 长篇",
  "updateStatus": "已完结",
  "latestChapter": "死神永生",
  "tags": ["科幻", "硬核"],
  "synopsis": "完整简介……"
}
```

---

## 4. 接口清单（用户域）

### 4.1 认证

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 否 | 登录，body: `{ username, password }` → `AuthResult` |
| POST | `/api/auth/logout` | 是 | 登出 |
| GET | `/api/auth/me` | 是 | 当前用户 → `UserInfo` |

### 4.2 积分

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profile/points/summary` | 积分总览 → `PointsSummary` |
| GET | `/api/profile/points/orders` | 订单列表，query: `type`, `page`, `pageSize`, `startDate`, `endDate` |
| POST | `/api/profile/points/recharge` | body: `{ amount, method: 'wechat'\|'alipay' }` → `{ orderId }` |

### 4.3 图书（个人书库）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/books` | 书库列表 |
| POST | `/api/books` | 将书城书加入个人库 |
| GET | `/api/books/trash` | 回收站 |
| GET | `/api/books/search?q=` | 搜索 |
| GET | `/api/books/{id}` | 详情 |
| POST | `/api/books/import` | multipart 导入 EPUB/PDF |
| POST | `/api/books/{id}/trash` | 移入回收站 |
| POST | `/api/books/{id}/restore` | 恢复 |
| DELETE | `/api/books/{id}` | 删除，可选 body `{ permanent: true }` |
| PATCH | `/api/books/{id}/progress` | 更新进度 / `lastReadAt` |
| GET | `/api/books/{id}/file-url` | 书籍文件临时下载地址 → `BookFileUrl` |

### 4.4 喜欢

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/favorites` | `string[]` bookId 列表 |
| POST | `/api/favorites/{bookId}` | 添加 |
| DELETE | `/api/favorites/{bookId}` | 取消 |

### 4.5 书架

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/bookshelves` | 列表 |
| POST | `/api/bookshelves` | 创建 `{ name }` |
| PATCH | `/api/bookshelves/{id}` | 重命名 |
| DELETE | `/api/bookshelves/{id}` | 删除 |
| PUT | `/api/bookshelves/reorder` | `{ orderedIds }` |
| POST | `/api/bookshelves/{id}/books` | `{ bookId }` |
| DELETE | `/api/bookshelves/{id}/books/{bookId}` | 移除 |

### 4.6 标注 / 书签

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST/PATCH/DELETE | `/api/annotations` | 高亮与笔记 CRUD |
| GET/POST/DELETE | `/api/bookmarks` | 书签 CRUD |

### 4.7 设置 / 备份 / AI

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PATCH | `/api/settings` | 用户设置 |
| POST | `/api/backup` | 创建备份 |
| POST | `/api/restore` | multipart 恢复 JSON |
| POST | `/api/chat` | 全局 AI 聊天 |
| POST | `/api/books/{id}/ai/chat` | 阅读页 AI |

### 4.8 阅读内容（可选）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/books/{id}/content` | Mock 用；真实阅读走 `file-url` |
| GET | `/api/books/{id}/content/spreads/{index}` | 单个 spread |

---

## 5. 接口清单（书城域 — 建议新增）

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/catalog/home` | 否 | 推荐位 + 榜单 |
| GET | `/api/catalog/books` | 否 | 分类筛选分页列表 |
| GET | `/api/catalog/filters` | 否 | 筛选项配置 |
| GET | `/api/catalog/books/{id}` | 否 | 书城书籍详情 |
| GET | `/api/catalog/books/{id}/comments` | 否 | 评论列表 |
| POST | `/api/catalog/books/{id}/comments` | 是 | 发表评论 |
| POST | `/api/catalog/comments/{id}/replies` | 是 | 回复 |
| POST/DELETE | `/api/catalog/comments/{id}/like` | 是 | 点赞 / 取消 |
| POST | `/api/catalog/comments/{id}/report` | 是 | 举报 `{ reason }` |
| POST/DELETE | `/api/catalog/books/{id}/block` | 是 | 屏蔽 / 取消屏蔽 |
| GET | `/api/catalog/blocks` | 是 | 屏蔽列表 |

### 书城与个人书库关系

```
浏览书城 → GET /api/catalog/books/{id}
  ↓ 开始阅读 / 加入书架
POST /api/books（bookId 与书城 ID 关联）
  ↓
GET /api/books/{id}/file-url → 阅读器
PATCH /api/books/{id}/progress
```

---

## 6. 页面与接口映射

| 前端页面 | 路由 | 依赖接口 |
|----------|------|----------|
| 登录 | — | `/api/auth/*` |
| 首页 | `/` | `/api/catalog/home`（当前静态） |
| 书籍详情 | `/book/:id` | `/api/catalog/books/{id}` + 评论 |
| 分类 | `/categories` | `/api/catalog/filters`，`/api/catalog/books` |
| 本地书库 | `/library` | `/api/books` |
| 书架 | `/shelf/:shelfId` | `/api/bookshelves`，`/api/books` |
| 喜欢 | `/favorites` | `/api/favorites`，`/api/books` |
| 笔记 / 高亮 | `/notes`，`/highlights` | `/api/annotations` |
| 回收站 | `/recycle-bin` | `/api/books/trash` |
| 阅读历史 | `/profile/history` | `/api/books`（`lastReadAt`） |
| 积分中心 | `/profile/points` | `/api/profile/points/*` |
| 阅读器 | `/read/:id` | `file-url`，`progress`，标注，书签 |
| AI 聊天 | `/chat` | `/api/chat` |

---

## 7. 应用启动请求顺序

`bootstrap.ts` 启动时并行请求：

1. `GET /api/auth/me`（有 token 时）
2. `GET /api/settings`
3. `GET /api/books`、`/api/books/trash`、`/api/favorites`
4. `GET /api/bookshelves`
5. `GET /api/annotations`、`/api/bookmarks`

---

## 8. 实现优先级

| 优先级 | 模块 |
|--------|------|
| P0 | 认证、图书 CRUD、`file-url`、进度、书架、喜欢 |
| P1 | 标注、书签、设置、积分 |
| P2 | 书城首页、详情、评论、分类 |
| P3 | 备份、AI 聊天 |

---

## 9. 联调 Checklist

- [ ] 响应格式 `{ code, message, data }`，成功 `code = 0`
- [ ] 401 返回 HTTP 401
- [ ] CORS 已配置
- [ ] `file-url` 返回可访问临时 URL
- [ ] 书城书加入个人库后可下载阅读
- [ ] `lastReadAt` 更新后阅读历史正确排序
- [ ] 积分充值 1 元 = 10 积分
- [ ] 前端 `VITE_USE_MOCK=false`

---

## 10. 前端源码对照

| 模块 | 文件 |
|------|------|
| 请求封装 | `sanko_read/src/api/request.ts` |
| 认证 | `sanko_read/src/api/auth.ts` |
| 图书 | `sanko_read/src/api/books.ts` |
| 积分 | `sanko_read/src/api/profile.ts` |
| 书城静态数据 | `sanko_read/src/data/catalogBooks.ts` |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.0 | 2026-06-25 | 新增积分、`file-url`、书城域接口；补充标注字段 |
| 1.0.0 | 2026-06-17 | 初版用户域接口 |
