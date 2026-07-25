# English Room Operations

多人英语实时语音房间的私有运营平台仓库。

## 仓库定位

- 可见性：Private
- 运营界面：React Web
- 加载方式：由 App 的通用 WebView 容器加载
- 公开 App：`maowulin/english-room`
- 私有后端：`maowulin/english-room-backend`
- 是否随候选人交付：否

## 核心职责

- 展示 DAU、增长率、D1/D7 留存和核心转化漏斗。
- 按 App 版本、平台和环境筛选运营指标。
- 查看 Sentry Issue、受影响用户、版本分布和 Replay 跳转。
- 查看房间、录制和评分任务状态。
- 对允许重试的失败任务发起受审计的重试。
- 提供白名单 HTTPS 运营 URL，并通过 FastAPI 一次性交接码建立运营会话。

## 当前状态

仓库已完成边界和架构初始化，尚未生成运营 Web 或内部 App 构建代码。

详细设计见 [`docs/architecture.md`](./docs/architecture.md)。

## 安全约束

- WebView、浏览器和 App 都不持有 Sentry 管理 Token。
- 所有运营数据和写操作都通过 FastAPI `/admin/v1/*`。
- 正式 App Store / Play Store Bundle 不包含本仓库代码。
