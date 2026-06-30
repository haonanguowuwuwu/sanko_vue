# sanko_read

Sanko 阅读器前端（Vue 3 + Vite）。

完整接口与联调说明见仓库 [`docs/`](../docs/README.md)。

## 开发

```bash
npm install
```

### Mock / 联调切换

**Mock 代码保留，通过命令切换，无需删除。**

| 模式 | 命令 | 说明 |
|------|------|------|
| 内置 Mock | `npm run dev:mock` | 不请求小后端，内存假数据 |
| 联调小后端 | `npm run dev:api` | 需先启动 `../sanko_server` |
| 默认 | `npm run dev` | 读 `.env.development` + 可选 `.env.development.local` |

联调推荐：

```bash
# 终端 1
cd ../sanko_server && npm run dev

# 终端 2
npm run dev:api
```

也可用本地覆盖：复制 `.env.development.local.example` → `.env.development.local`，设置 `VITE_USE_MOCK=false`。

- 小后端地址：`VITE_API_BASE_URL=http://127.0.0.1:8083`
- 修改 env 或切换命令后需 **重启** dev server
- **切换模式后请重新登录**（Mock token 与小后端不通用）
- 启动时终端会打印当前模式；浏览器控制台有 `[Sanko] …` 提示

详见 [INTEGRATION.md](../docs/INTEGRATION.md)。

### 构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## IDE

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
