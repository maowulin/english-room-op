# English Room Operations

多人英语实时语音房间的私有运营平台仓库。

## 仓库定位

- 可见性：Private
- 运营界面：React Web（`apps/web`）
- 加载方式：由 App 的通用 WebView 容器加载（Phase 2 联调）
- 公开 App：`maowulin/english-room`
- 私有后端：`maowulin/english-room-backend`
- 是否随候选人交付：否

## 核心职责（目标能力）

以下能力由架构定义；**当前仓库仅完成运营 Web 骨架与 API 客户端适配层**，真实指标、Sentry 摘要与写操作需等后端 `/admin/v1` 落地后再接通。

- 展示 DAU、增长率、D1/D7 留存和核心转化漏斗。
- 按 App 版本、平台和环境筛选运营指标。
- 查看 Sentry Issue、受影响用户、版本分布和 Replay 跳转。
- 查看房间、录制和评分任务状态。
- 对允许重试的失败任务发起受审计的重试。
- 提供白名单 HTTPS 运营 URL，并通过 FastAPI 一次性交接码建立运营会话。

## 当前状态

| 层级 | 状态 |
| --- | --- |
| `apps/web` | 已实现五页骨架：总览、稳定性、房间、评分、审计；默认 **Mock** 数据，可本地 dev/build |
| API 适配器 | `MockOpsApiClient`（默认）与 `HttpOpsApiClient`（HTTP 模式）已实现；**仅客户端边界**，映射预期 FastAPI 路径 |
| `english-room-backend` | **尚无** `/admin/v1` 路由、MFA/RBAC、Sentry 代理；HTTP 模式不能查看真实线上数据 |
| WebView / 会话交接 | 未实现（Phase 2） |

详细设计见：

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/design/README.md`](./docs/design/README.md)

## 本地运行（`apps/web`）

在 `apps/web` 目录安装依赖并启动：

```bash
cd apps/web
npm install
npm run dev
```

常用校验：

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

### Mock 模式（默认）

未设置 `VITE_OPS_API_MODE`，或不为 `http`，或缺少 `VITE_OPS_API_BASE_URL` 时，使用 `MockOpsApiClient`，数据来自 `src/data/mock-ops-data.ts`。页面会展示演示数据提示，**不代表生产指标**。

### HTTP 模式（本地联调壳）

用于对接 FastAPI 管理 API。后端 `/admin/v1` 与 MFA/RBAC **尚未在生产落地**；本模式提供可注入请求头、统一 loading/error/重试 UI，便于与 mock 或 staging API 联调。

在 `apps/web/.env.local`（勿提交）中配置：

```bash
VITE_OPS_API_MODE=http
VITE_OPS_API_BASE_URL=http://127.0.0.1:8000
```

可选：本地联调时由 Backend 文档约定的 admin 头（**仅写入 `.env.local`，勿提交**）：

| 环境变量 | HTTP 头 | 说明 |
| --- | --- | --- |
| `VITE_OPS_ADMIN_AUTHORIZATION` | `Authorization` | Bearer 或 Backend 约定的会话凭证 |
| `VITE_OPS_ADMIN_MFA` | `X-Admin-MFA` | MFA 证明（联调占位；**不代表** App/Web 已完成 MFA 流程） |
| `VITE_OPS_ADMIN_ROLE` | `X-Admin-Role` | `viewer` / `operator` / `admin` 等 RBAC 角色 hint |

`HttpOpsApiClient` 亦支持在代码中注入 `getAuthorizationHeader`、`getAdminMfaHeader`、`getAdminRoleHeader` 或通用 `getExtraHeaders`（例如 WebView handoff 完成后由运行时提供），不在仓库内硬编码 Token。

成功响应时页面读取 JSON 中的 `dataSource` 字段（`backend` / `placeholder` / 联调 mock 可返回 `demo`）并展示来源说明；Mock 模式固定为 `demo` 且顶部展示演示数据横幅。

`HttpOpsApiClient` 当前映射的只读/写路径（合约以 OpenAPI 为准，后端 Phase 2 实现）：

| 方法 | 路径 |
| --- | --- |
| GET | `/admin/v1/metrics/overview` |
| GET | `/admin/v1/metrics/stability` |
| GET | `/admin/v1/rooms` |
| GET | `/admin/v1/scoring` |
| POST | `/admin/v1/scoring/{taskId}/retry` |
| GET | `/admin/v1/audit/events` |

HTTP 模式下使用 `credentials: 'include'`；服务端会话、一次性 handoff 与完整 MFA 仍属 Phase 2。本地联调可通过上表环境变量或客户端注入函数附带 `Authorization`、`X-Admin-MFA`、`X-Admin-Role`，具体校验由 FastAPI 实现。

## 安全约束

- WebView、浏览器和 App 都不持有 Sentry 管理 Token。
- 所有运营数据和写操作的设计目标是经 FastAPI `/admin/v1/*`；当前仅 Web 侧客户端已按该前缀预留。
- 正式 App Store / Play Store Bundle 不包含本仓库代码。
