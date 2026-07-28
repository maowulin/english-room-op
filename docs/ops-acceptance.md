# 运营 Web 本地联调与验收

日期：2026-07-27

本文描述 **`english-room-op` 运营 Web** 与 **`english-room-backend` `/admin/v1`** 的本地 HTTP 验收步骤。不包含生产 Sentry 管理查询、云录制回放或 App WebView 一次性交接的验收（这些能力尚未在端到端链路中落地）。

## 前提

- 本机已启动 FastAPI，并挂载与 `HttpOpsApiClient` 对齐的只读/写路由（OpenAPI 为合约真相源）。
- 管理员先调用 `POST /admin/v1/auth/login` 使用后端配置的账号密码登录；之后所有接口使用短期 **`Authorization: Bearer …`**。本地脚本仍兼容 `X-Ops-Admin-Token`；HttpOnly 会话 Cookie 仍属于交接部署契约，尚未在本地后端实现。
- 运营 Web 使用 HTTP 模式时 **不持有** Sentry 管理 Token；稳定性页若 Backend 未接真实 Sentry，响应中 `data_source` 可能为 `placeholder`，页面会标注「占位/部分字段」。

## 本地联调命令

在仓库根目录（pnpm workspace）：

```bash
pnpm install
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

启动运营 Web（默认真实 HTTP 模式）：

```bash
cd apps/web
cp .env.example .env.local
# 编辑 .env.local：VITE_OPS_API_BASE_URL=http://127.0.0.1:8000
# 登录账号使用 Backend 的 OPS_ADMIN_USERNAME / OPS_ADMIN_PASSWORD（默认 admin / english-room-admin）
pnpm dev
```

在 **另一个终端** 启动 Backend（命令与端口以 `english-room-backend` README 为准，默认示例 `http://127.0.0.1:8000`）。

### curl 探活（与 Web 同路径）

将 `<BEARER>` 替换为本地联调 Bearer；若使用 Cookie 会话，改用 `-b` 携带 Backend 下发的 Cookie。

```bash
export OPS_BASE=http://127.0.0.1:8000
export AUTH_HEADER="Authorization: Bearer <BEARER>"

curl -sS -H "$AUTH_HEADER" "$OPS_BASE/admin/v1/metrics/overview" | head -c 400
curl -sS -H "$AUTH_HEADER" "$OPS_BASE/admin/v1/metrics/stability" | head -c 400
curl -sS -H "$AUTH_HEADER" "$OPS_BASE/admin/v1/rooms" | head -c 400
curl -sS -H "$AUTH_HEADER" "$OPS_BASE/admin/v1/scoring" | head -c 400
curl -sS -H "$AUTH_HEADER" "$OPS_BASE/admin/v1/audit/events" | head -c 400
```

期望：HTTP **200**（或 Backend 文档约定的成功码），JSON 含 **`meta.data_source`** 字段（`first_party` 或 `placeholder`）。**401/403** 表示认证或 RBAC 未通过，Web 应展示 error 态并可重试，不应静默降级为 Mock。

## 五页验收清单

| 路由 | 页面 | 验收要点 |
| --- | --- | --- |
| `/` | 总览 | 页眉「数据来源：…」为 **后端响应** 或 **占位**（非 Mock 演示横幅）；Network 出现 `GET …/metrics/overview` |
| `/stability` | 稳定性 | 同上；`GET …/metrics/stability`；**不得**将本地联调结果表述为「生产 Sentry 已接通」 |
| `/rooms` | 房间 | `GET …/rooms`；列表字段可读；无 TRTC 媒体面直连 |
| `/scoring` | 评分 | `GET …/scoring`；operator 角色下重试按钮触发 `POST …/scoring/{taskId}/retry` 且 UI 反馈结果 |
| `/audit` | 审计 | `GET …/audit/events`；条目时间与操作类型可读 |

Mock 模式（显式设置 `VITE_OPS_API_MODE=mock`）：五页均应显示 **演示数据（Mock 适配器）** 与顶部演示横幅，Network **不应** 请求 `/admin/v1`。缺少 Base URL 时应显示配置错误，不应显示演示数据。

## 浏览器证据（fetch / Console）

HTTP 模式打开 DevTools → **Network**：

1. 筛选 `admin/v1`，确认五页各至少一条对应 GET（评分重试另计 POST）。
2. 选中请求：Request Headers 含 `Authorization` 和/或 Cookie（`credentials: include`）；**不应**出现 Sentry 域名或管理 Token。
3. Response JSON：记录 `data_source` 值；若为 `placeholder`，截图页眉占位文案与响应片段一并留存。

可选 Console 自检（同源、已登录/已带头时）：

```javascript
fetch('/admin/v1/metrics/overview', { credentials: 'include' })
  .then((r) => r.json())
  .then((j) => console.log('data_source', j.meta?.data_source));
```

若 Vite 未代理 Backend，上述 fetch 会打运营站 origin 而非 API；**以 Network 中指向 `VITE_OPS_API_BASE_URL` 的请求为准**。

## 真实数据与能力边界

| 能力 | 本地 HTTP 联调 | 说明 |
| --- | --- | --- |
| `/admin/v1` 读路径 + 评分重试 | 可验收 | 依赖 Backend 实现与 RBAC；数据可能是种子/内存，**不代表**生产 DAU 或多实例一致视图 |
| `data_source: first_party` | 可验收 | Backend 声明字段来自持久化或真实聚合 |
| `data_source: placeholder` | 可验收 | 路由已通，部分字段（常见：稳定性/Sentry 摘要）仍为占位 |
| 真实 Sentry 管理 API 代理 | **不可** 在本仓验收 | 无生产 Token 链路；勿虚构 Issue/Replay 生产数据 |
| 云录制 / COS 音频回放 | **不可** 在本仓验收 | 房间/评分页仅展示 Backend 返回的元数据 |
| App WebView + handoff 换会话 | **未** 验收 | 使用 DEV 环境变量或 `setOpsRuntimeAuth` 注入；生产 Cookie 域与 CORS 待部署 |
| 生产 HTTPS 运营站 + allowlist | **未** 验收 | 非 localhost 构建需 `VITE_OPS_API_ALLOWED_ORIGINS` |

## 通过标准（Ops 交付口径）

- 显式 Mock 与默认 HTTP 两种模式行为与 README / `docs/architecture.md` 描述一致。
- HTTP 模式五页均可加载，`data_source` 标注与 Backend JSON 一致，错误态可重试。
- `pnpm run typecheck`、`pnpm run lint`、`pnpm run test`、`pnpm run build` 在仓库根目录通过。
- 文档与演示中 **未** 宣称生产 Sentry、云录制或 WebView handoff 已完成。
