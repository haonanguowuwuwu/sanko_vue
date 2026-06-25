# Sanko Read 前后端对接文档

本目录为前端 `sanko_read` 与后端的接口契约，供后端实现与联调使用。

## 文档索引

| 文件 | 读者 | 说明 |
|------|------|------|
| [**BACKEND_API.md**](./BACKEND_API.md) | **后端（首选）** | 完整需求：数据模型、全部接口、页面映射、实现优先级、联调清单 |
| [API.md](./API.md) | 后端 / 前端 | 精简版接口说明 |
| [openapi.yaml](./openapi.yaml) | 后端 / 测试 | OpenAPI 3.0 契约，可导入 Apifox / Postman / Knife4j |

## 后端快速开始

1. 阅读 [BACKEND_API.md](./BACKEND_API.md) 第 2 节（通用约定）和第 8 节（实现优先级）
2. 按 **P0** 先实现：认证 → 书库 → `file-url` → 进度 → 书架 → 喜欢
3. 将 [openapi.yaml](./openapi.yaml) 导入 Apifox 进行 Mock 或自测
4. 联调时前端设置 `VITE_USE_MOCK=false`、`VITE_API_BASE_URL=http://localhost:8080`

## 前端源码对照

| 模块 | 路径 |
|------|------|
| 请求封装 | `sanko_read/src/api/request.ts` |
| 各模块 API | `sanko_read/src/api/*.ts` |
| 类型定义 | `sanko_read/src/api/types.ts`、`sanko_read/src/types/` |
