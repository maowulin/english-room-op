# 运营平台真实数据接入设计

## 目标

让 `english-room-op/apps/web` 默认展示 `english-room-backend` 提供的真实第一方运营数据，避免环境变量漏配时静默展示 Mock。Sentry 查询不在本轮范围内；稳定性页只展示后端已提供的第一方事件聚合和明确的缺失数据空态。

## 范围

- 默认使用 `HttpOpsApiClient` 请求 FastAPI `/admin/v1/*`。
- 仅当显式设置 `VITE_OPS_API_MODE=mock` 时使用 `MockOpsApiClient`。
- Base URL 缺失、非法或不在 allowlist 时显示配置/请求错误，不回退到 Mock。
- 总览、稳定性、评分、审计读取后端第一方数据。
- 房间接口读取 SQLite 中真实创建的房间、成员、生命周期和录制/评分状态；没有记录时返回真实空态。
- 保留现有管理员 token 只在本地开发注入的约束，生产使用服务端会话或受控 runtime auth，不把密钥写入前端源码。
- 本地通过 Vite 代理和 FastAPI 联调；腾讯云部署在本地验收后单独检查部署映射并验收。

## 数据流

```text
VITE_OPS_API_MODE=mock
  └── MockOpsApiClient（仅显式演示模式）

默认 / VITE_OPS_API_MODE=http
  └── HttpOpsApiClient
      └── FastAPI /admin/v1/*
          ├── 第一方分析事件 → 总览/稳定性
          ├── rooms + room_members + recording_tasks + score_jobs → 房间
          ├── score_jobs → 评分
          └── audit_events → 审计
```

HTTP 响应继续使用 `meta` + `data` envelope，客户端边界将 snake_case 映射为页面使用的 camelCase。`data_source=first_party` 表示后端第一方数据；稳定性中的 Sentry Issue、Replay、设备明细若未由后端提供，不填充 demo 值。

## 后端房间查询

新增只读管理查询方法，按创建时间倒序读取 `rooms`，聚合：

- 房间基础信息：`room_id`、`title`、`status`、`created_at`、成员数量。
- 成员：`player_id`、`joined_at`、`ready`；管理员响应只返回客户端可展示的脱敏标识。
- 录制：`recording_tasks.status`，无任务时为 `idle`。
- 评分：该房间最新 `score_jobs.state`，无任务时不填充演示状态。
- 生命周期：从真实房间时间和当前状态构造最小可用状态记录；不伪造不存在的事件。

当数据库没有房间时，接口返回 `items=[]` 和 `summary.total=0`，由前端展示“暂无真实房间数据”。

## 错误和认证

- `/admin/v1` 继续由后端校验 `X-Ops-Admin-Token`；前端只负责注入本地开发 token 或运行时会话头。
- HTTP 模式下的 401、403、404、422、500 和网络超时统一进入现有 `OpsQueryStatus` 错误态。
- 不对认证错误做 Mock 降级，不在错误文本中回显 token、数据库路径或服务端异常详情。

## 验证

- 前端测试验证默认客户端为 HTTP、显式 mock 才返回 Mock、真实房间 wire payload 能映射为页面类型。
- 后端测试验证创建房间/加入成员后 `/admin/v1/rooms` 返回真实房间、成员和状态，空库仍返回稳定空结构。
- 运行前端 `test`、`typecheck`、`lint`、`build`，后端管理员测试和房间相关测试。
- 本地启动 FastAPI 与 Vite，使用真实 admin token 访问页面并以 HTTP 响应/页面空态作为联调证据；不以 mock 数据作为真实链路完成证据。

## 非目标

- 不接入 Sentry API、Issue、Replay 或设备版本明细。
- 不在运营前端存储长期管理员凭证。
- 不在本轮实现生产 WebView handoff、DNS、HTTPS 证书或腾讯云资源创建；这些属于本地闭环后的部署工作。
