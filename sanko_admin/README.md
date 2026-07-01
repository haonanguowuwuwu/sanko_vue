# Sanko Admin

Sanko 阅读平台管理后台。当前使用**本地 Pinia 数据**演示完整交互，刷新后数据保留在浏览器 localStorage 中。

## 启动

```bash
cd sanko_admin
npm install
npm run dev
```

默认地址：http://127.0.0.1:5174

## 登录

任意用户名和密码均可登录（演示模式）。

## 模块

| 路由 | 功能 |
|------|------|
| `/login` | 管理员登录 |
| `/dashboard` | 概览（实时统计 + 最近操作） |
| `/profile` | 管理员个人资料 |
| `/users` | 用户管理（搜索、新建、编辑、启用/禁用） |
| `/books` | 书籍管理（待审核 tab → 点「审核」查看详情/预览正文 → 通过或填写原因驳回） |
| `/comments` | 评论管理（搜索、查看、删除） |
| `/points` | 积分流水与充值订单 |
| `/history` | 操作日志 + 阅读历史 |
| `/chat` | AI 会话列表 + 功能配置 |
| `/settings` | 系统设置与公告 |

## 数据说明

- 数据存储键：`sanko_admin_data_v2`（localStorage，版本变更时会自动弃用旧键）
- 后续对接后端 API 时，替换 `src/stores/adminData.ts` 中的读写逻辑即可
