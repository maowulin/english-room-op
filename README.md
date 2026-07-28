# English Room Operations

多人英语实时语音房间的私有运营平台仓库。

## 仓库定位

- 可见性：Private
- 运营界面：React Web（`apps/web`）
- 加载方式：由 App 的通用 WebView 容器加载（**生产 handoff 与白名单 URL 仍待 App + 部署联调**）
- 公开 App：`maowulin/english-room`
- 私有后端：`maowulin/english-room-backend`
- 是否随候选人交付：否

## 核心职责（目标能力）

- 展示 DAU、增长率、D1/D7 留存和核心转化漏斗。
- 按 App 版本、平台和环境筛选运营指标。
- 查看 Sentry Issue、受影响用户、版本分布和 Replay 跳转（**依赖 Backend Sentry 代理；未接通时为占位字段**）。
- 查看房间、录制和评分任务状态。
- 对允许重试的失败任务发起受审计的重试。
- 提供白名单 HTTPS 运营 URL，并通过 FastAPI 一次性交接码建立运营会话（**端到端未落地**）。

运营 Web 侧：`OpsApiClient`、`HttpOpsApiClient` 与五页 UI 已按上述路径预留；**本地 HTTP 模式可对接已实现的 `/admin/v1` 路由**（见下表）。

## 当前状态

| 层级 | 状态 |
| --- | --- |
| `apps/web` | 五页：总览、稳定性、房间、评分、审计；默认连接真实 Backend；可显式切换 Mock |
| API 适配器 | `HttpOpsApiClient`（默认）与显式 Mock 适配器已实现，映射 `/admin/v1/*` |
| `english-room-backend` | **`/admin/v1` 读路径与评分重试、会话/Bearer 认证已在本地 HTTP E2E 验证**；真实 Sentry 代理、handoff、生产多实例持久化 **未完成** |
| WebView / 会话交接 | App 侧一次性 code 交换与生产 Cookie 域 **未验收** |

`data_source` 含义（HTTP 成功响应）：`first_party` = Backend 提供的第一方业务/聚合数据；`placeholder` = 路由已通但部分域（常见为稳定性/Sentry 摘要）仍为占位；Mock 模式固定 `demo`。

详细设计与验收：

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/ops-acceptance.md`](./docs/ops-acceptance.md)
- [`docs/design/README.md`](./docs/design/README.md)

## 本地运行（`apps/web`）

在仓库根目录安装依赖并启动（pnpm workspace）：

```bash
pnpm install
cd apps/web
pnpm dev
```

常用校验（可在根目录执行，见 `package.json` scripts）：

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```

### Mock 模式（仅显式演示）

只有显式设置 `VITE_OPS_API_MODE=mock` 时使用 `MockOpsApiClient`，数据来自 `src/data/mock-ops-data.ts`。页面会展示演示数据提示，**不代表生产指标**。

未配置 `VITE_OPS_API_BASE_URL` 时不会回退 Mock，页面显示后端配置错误。

### HTTP 模式（本地 Backend 联调）

用于对接 FastAPI **`/admin/v1`**。Backend 路由与会话/Bearer 认证可在本机联调；**生产 HTTPS 运营站、CORS allowlist 与 App WebView handoff 仍待部署与集成**。

在 `apps/web/.env.local`（勿提交）中配置：

```bash
VITE_OPS_API_BASE_URL=http://127.0.0.1:8000
```

打开运营台后使用 Backend 配置的管理员账号密码登录（本地默认值为
`admin` / `english-room-admin`）。前端只在内存中保存短期 Bearer 会话，退出登录会调用
Backend 撤销会话；不要把管理员密码或 Token 写入前端环境变量。

生产或指向非 `localhost` / `127.0.0.1` 的 HTTPS 部署还必须配置 **`VITE_OPS_API_ALLOWED_ORIGINS`**（逗号分隔的 origin，例如 `https://api.example.com`）。`HttpOpsApiClient` 在发请求前会校验 base URL：**配置缺失或 origin 不在 allowlist 时 fail closed，不会发出携带 Cookie / Authorization 的请求**。本地 Vite DEV 对 `localhost` / `127.0.0.1` 联调免 allowlist；生产构建仅允许 HTTPS 且必须在 allowlist 内。

特殊联调场景可选：**仅本地 Vite DEV**（`.env.local`，勿提交）由 Backend 文档约定的 admin 头；正常登录不需要这些变量，生产构建也不应依赖它们：

| 环境变量 | HTTP 头 | 说明 |
| --- | --- | --- |
| `VITE_OPS_ADMIN_AUTHORIZATION` | `Authorization` | **仅 local dev**；Bearer 或 Backend 约定的会话凭证 |
| `VITE_OPS_ADMIN_MFA` | `X-Admin-MFA` | **仅 local dev**；MFA 证明（联调占位；**不代表** App/Web 已完成 MFA 流程） |
| `VITE_OPS_ADMIN_ROLE` | `X-Admin-Role` | **仅 local dev**；`viewer` / `operator` / `admin` 等 RBAC 角色 hint |

`setOpsRuntimeAuth` / `clearOpsRuntimeAuth`（内存桥，无 localStorage）供 WebView handoff 或登录壳注入当前 admin 头；可选 `expiresAt`（毫秒时间戳）到期后 getter 自动清空，**不替代**服务端 HttpOnly Cookie / Backend session 校验。`HttpOpsApiClient` 亦支持在代码中注入 `getAuthorizationHeader`、`getAdminMfaHeader`、`getAdminRoleHeader` 或通用 `getExtraHeaders`（不可覆盖 `Authorization`、`Cookie`、`X-Admin-MFA`、`X-Admin-Role`），不在仓库内硬编码 Token。

成功响应时页面读取 JSON `meta.data_source` 字段（`first_party` / `placeholder` / Mock 为 `demo`）并展示来源说明；Mock 模式固定为 `demo` 且顶部展示演示数据横幅。

`HttpOpsApiClient` 映射路径（合约以 Backend OpenAPI 为准）：

| 方法 | 路径 | Backend（本地联调） |
| --- | --- | --- |
| GET | `/admin/v1/metrics/overview` | 已实现 |
| GET | `/admin/v1/metrics/stability` | 已实现（Sentry 真实代理未接通时可能 `placeholder`） |
| GET | `/admin/v1/rooms` | 已实现 |
| GET | `/admin/v1/scoring` | 已实现 |
| POST | `/admin/v1/scoring/{taskId}/retry` | 已实现（RBAC 限制） |
| GET | `/admin/v1/audit/events` | 已实现 |

HTTP 模式下使用 `credentials: 'include'`；生产认证依赖 FastAPI 会话 Cookie 与 CORS 凭据，或 WebView handoff 后 `setOpsRuntimeAuth`。完整 MFA 流程与一次性 handoff 仍属集成待办。本地 DEV 可通过上表环境变量附带 admin 头，具体校验由 FastAPI 实现。

本地五页与 curl 验收步骤见 [`docs/ops-acceptance.md`](./docs/ops-acceptance.md)。

## 安全约束

- WebView、浏览器和 App 都不持有 Sentry 管理 Token。
- 运营读/写经 FastAPI `/admin/v1/*`；Web 侧客户端已按该前缀实现。
- 正式 App Store / Play Store Bundle 不包含本仓库代码。
