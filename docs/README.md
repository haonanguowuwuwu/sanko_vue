# Sanko Read 前后端对接文档

本目录为前端 `sanko_read` 与后端的接口契约，供后端实现与联调使用。

**当前版本：2.0.0** — 详见 [**VERSION_2.0.md**](./VERSION_2.0.md)

## 文档索引

| 文件 | 读者 | 说明 |
|------|------|------|
| [**VERSION_2.0.md**](./VERSION_2.0.md) | **全员（版本必读）** | 2.0 功能清单、新增接口、联调验证、已知限制 |
| [**INTEGRATION.md**](./INTEGRATION.md) | **后端 / 前端（联调必读）** | 如何关闭 Mock、验证真接口、分期联调步骤 |
| [**FRONTEND_DATA_AND_MOCK.md**](./FRONTEND_DATA_AND_MOCK.md) | **前端 / 后端** | 各页面需要什么数据、哪些仍是内置 Mock / 静态、对接顺序 |
| [**BACKEND_API.md**](./BACKEND_API.md) | **后端（首选）** | 完整需求：数据模型、全部接口、页面映射、实现优先级 |
| [API.md](./API.md) | 后端 / 前端 | 精简版接口说明 |
| [openapi.yaml](./openapi.yaml) | 后端 / 测试 | OpenAPI 3.0 契约，可导入 Apifox / Postman / Knife4j |

## 后端快速开始

1. **先读 [VERSION_2.0.md](./VERSION_2.0.md)** — 了解 2.0 功能与联调清单
2. **再读 [INTEGRATION.md](./INTEGRATION.md)** — Mock / 联调切换（`dev:mock` / `dev:api`）
3. 接口细节见 [BACKEND_API.md](./BACKEND_API.md)；可导入 [openapi.yaml](./openapi.yaml) 到 Apifox
4. 启动：

```bash
cd sanko_server && npm run dev          # 8083
cd sanko_read && npm run dev:api        # 联调
# 或 npm run dev:mock                   # 纯 Mock
```

详见 [sanko_server/README.md](../sanko_server/README.md)。

## 前端源码对照

| 模块 | 路径 |
|------|------|
| **联调小后端** | [`sanko_server/`](../sanko_server/)（Node.js Express，与前端分离） |
| Mock / 联调切换 | `sanko_read/package.json`：`dev:mock`、`dev:api`；环境文件见 INTEGRATION.md |
| 请求封装 | `sanko_read/src/api/request.ts` |
| 各模块 API | `sanko_read/src/api/*.ts` |
| 类型定义 | `sanko_read/src/api/types.ts`、`sanko_read/src/types/` |
