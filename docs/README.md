# Sanko Read 前后端对接文档

本目录为前端 `sanko_read` 与后端的接口契约，供后端实现与联调使用。

## 文档索引

| 文件 | 读者 | 说明 |
|------|------|------|
| [**INTEGRATION.md**](./INTEGRATION.md) | **后端 / 前端（联调必读）** | 如何关闭 Mock、验证真接口、分期联调步骤 |
| [**BACKEND_API.md**](./BACKEND_API.md) | **后端（首选）** | 完整需求：数据模型、全部接口、页面映射、实现优先级 |
| [API.md](./API.md) | 后端 / 前端 | 精简版接口说明 |
| [openapi.yaml](./openapi.yaml) | 后端 / 测试 | OpenAPI 3.0 契约，可导入 Apifox / Postman / Knife4j |

## 后端快速开始

1. **先读 [INTEGRATION.md](./INTEGRATION.md)** — 了解默认 Mock 行为及如何关闭
2. 阅读 [BACKEND_API.md](./BACKEND_API.md) 第 2 节（通用约定）和第 8 节（实现优先级）
3. 按 **P0** 先实现：认证 → 书库 → `file-url` → 进度 → 书架 → 喜欢
4. 将 [openapi.yaml](./openapi.yaml) 导入 Apifox 进行自测
5. 联调时前端在 `sanko_read/.env.development` 设置 `VITE_USE_MOCK=false`（详见 INTEGRATION.md）

## 前端源码对照

| 模块 | 路径 |
|------|------|
| 请求封装 | `sanko_read/src/api/request.ts` |
| 各模块 API | `sanko_read/src/api/*.ts` |
| 类型定义 | `sanko_read/src/api/types.ts`、`sanko_read/src/types/` |
