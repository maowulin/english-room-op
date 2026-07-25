# 运营平台架构边界

日期：2026-07-25

状态：架构已确认，待基础框架实现

## 组成

```text
english-room-op/
├── apps/
│   └── web/               # React Web 运营管理站
├── internal-app/          # internal-ops 入口和构建叠加配置
└── docs/
    └── architecture.md
```

运营 UI 使用 React Web。内部 App 不是另一套产品代码，而是私有仓库在构建期检出指定版本的公开 App，并叠加管理员入口和独立 Bundle Identifier/Application ID。

## 构建隔离

| 变体 | 代码来源 | 分发 | 运营入口 |
| --- | --- | --- | --- |
| `production` | 仅公开 App 仓库 | App Store / Play Store | 不存在 |
| `internal-ops` | 公开 App + 本私有仓库叠加层 | Ad Hoc、TestFlight 内测或企业分发 | 存在 |

运营平台实现不会进入公开仓库，也不会依赖正式包中的隐藏手势作为安全边界。

## 访问流程

```mermaid
sequenceDiagram
    participant Internal as 内部 App
    participant API as FastAPI
    participant Web as 运营 Web

    Internal->>API: 管理员账号 + MFA
    API-->>Internal: 单用途会话交换码
    Internal->>Web: 打开运营平台
    Web->>API: 交换短期 HttpOnly 会话
    API-->>Web: RBAC 权限和最小数据
```

运营 Web 只调用 FastAPI 管理 API。Sentry 查询由 FastAPI 使用服务端 Token 完成，Web 只接收展示所需的错误摘要、趋势和安全跳转信息。

## V1 页面

1. 总览：DAU、增长率、D1/D7 留存和核心转化率。
2. 稳定性：错误趋势、受影响用户、版本分布和 Replay 跳转。
3. 房间：成员、连接、录制和房间生命周期。
4. 评分：玩家任务状态、失败原因和受控重试。
5. 审计：管理员登录、查询和写操作记录。

## 权限

- `viewer`：只读指标、房间和错误摘要。
- `operator`：在只读能力外，可重试允许重试的任务。
- `admin`：管理运营账号和角色，不直接修改业务数据。

V1 不提供任意 SQL、任意后端命令、批量修改用户数据或直接读取私有音频。
