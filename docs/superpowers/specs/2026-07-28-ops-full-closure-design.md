# 运营平台全链路闭环设计

## 目标

让当前多人房间会话产生的第一方数据能够被运营平台正确读取，并让埋点、房间监控、评分任务、评分重试、审计和本地 HTTP 认证形成可验证闭环。没有真实外部 provider 的能力必须显示明确的不可用状态，不能用 Mock 或默认值伪造成功。

## 范围

- App 埋点 wire contract 与 Backend `AnalyticsEvent` 统一：字段名、版本号、环境值、用户/会话 ID 格式一致。
- Backend `/admin/v1/rooms` 返回房主、成员显示名、生命周期基础状态、录音和评分关联状态。
- Backend `/admin/v1/scoring` 返回房间、玩家、音频、失败原因和执行状态；前端正确展示 waiting/processing/succeeded/failed/retryable。
- 管理评分重试使用既有 `RecordingService` 的真实执行入口；不满足可重试条件时返回明确错误，幂等键只产生一次审计记录。
- Backend 支持文档约定的 Bearer 管理认证，同时保留本地 `X-Ops-Admin-Token`；CORS 使用配置中的运营站来源。
- 审计响应补齐 actor/result/risk 等可展示字段，整数 ID 在 wire 层稳定序列化。

## 关键约束

- SQLite 是本地第一方数据源；Sentry、腾讯云录音、SOE 评分没有凭证时不标记为成功。
- 评分 provider 不可用时，任务保留真实失败原因，运营端展示失败/不可用，而不是 `pending` 假成功。
- 现有用户未提交改动必须保留，不执行 reset、checkout 或递归删除。

## 验证标准

- App 生成的一条真实 analytics record 可被 Backend 接收，并在总览/稳定性接口中计数。
- 真实房间的 member count、owner/display name、status、score/recording 状态与 SQLite 逐字段一致。
- 评分列表不再丢失 room/player/audio/failure 字段；retry 对合法任务产生一次可追踪状态变化，重复幂等请求不重复执行。
- Bearer、X-Ops token、CORS preflight 各有自动化测试。
- 三仓完成 typecheck、pytest/Jest、Ruff、mypy、lint、build，并完成本地浏览器五页 HTTP 验收。

