# 运营平台真实数据接入实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 `superpowers:executing-plans` 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 让运营 Web 默认连接 FastAPI 第一方管理 API，补齐真实房间查询，并在本地通过真实 HTTP 联调。

**架构：** 前端只有显式 `VITE_OPS_API_MODE=mock` 才使用 Mock；默认创建 `HttpOpsApiClient`，配置错误直接进入错误态。后端 `/admin/v1/rooms` 由数据库查询 `rooms`、`room_members`、`recording_tasks` 和 `score_jobs`，不生成演示记录。

**技术栈：** React 19、Vite、TypeScript、Vitest、FastAPI、SQLite、pytest。

---

### 任务 1：前端数据源选择改为默认 HTTP

**文件：**
- 修改：`apps/web/src/api/create-ops-api-client.ts`
- 修改：`apps/web/src/api/create-ops-api-client.test.ts`
- 修改：`apps/web/src/config/ops-api-mode.ts`
- 修改：`apps/web/src/components/AppLayout.tsx`
- 修改：`apps/web/src/components/AppLayout.test.tsx`
- 修改：`apps/web/.env.example`

- [ ] **步骤 1：编写失败测试**

新增测试断言：没有 `VITE_OPS_API_MODE` 但有 `VITE_OPS_API_BASE_URL` 时创建 HTTP 客户端；`VITE_OPS_API_MODE=mock` 时才创建 Mock；没有 Base URL 时创建客户端即抛出明确配置错误。调整布局测试断言只有 `dataSource=demo` 才显示演示横幅。

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm --filter @english-room-op/web test src/api/create-ops-api-client.test.ts src/components/AppLayout.test.tsx`

预期：新默认选择和缺失 Base URL 测试失败，原因是当前实现无条件回退 Mock。

- [ ] **步骤 3：实现最小逻辑**

将选择规则改为：`mode === 'mock'` 返回 `MockOpsApiClient`；否则要求非空 Base URL，校验 allowlist 后返回 `HttpOpsApiClient`。将配置错误保留为可供 `App`/查询状态捕获的错误，并把 `.env.example` 改为真实 HTTP 示例，Mock 标记为显式演示配置。

- [ ] **步骤 4：运行测试确认通过**

运行：`pnpm --filter @english-room-op test src/api/create-ops-api-client.test.ts src/components/AppLayout.test.tsx`

预期：PASS，且现有 runtime auth 和 base URL policy 测试保持通过。

- [ ] **步骤 5：Commit**

```bash
git add apps/web/src/api/create-ops-api-client.ts apps/web/src/api/create-ops-api-client.test.ts apps/web/src/config/ops-api-mode.ts apps/web/src/components/AppLayout.tsx apps/web/src/components/AppLayout.test.tsx apps/web/.env.example
git commit -m "feat(运营平台): 默认接入真实管理 API"
```

### 任务 2：后端管理房间接口读取真实状态

**文件：**
- 修改：`../english-room-backend/src/english_room_backend/admin/routes.py`
- 修改：`../english-room-backend/tests/test_admin_metrics.py`

- [ ] **步骤 1：编写失败测试**

在后端管理测试中创建真实 guest session、房间并加入成员，再请求 `GET /admin/v1/rooms`，断言响应包含房间 ID、标题、`member_count=1`、成员 player ID、真实状态和 `data_source=first_party`。

- [ ] **步骤 2：运行测试确认失败**

运行：`cd ../english-room-backend && PYTHONPATH=src .venv/bin/pytest tests/test_admin_metrics.py -q`

预期：测试失败，因为当前管理路由固定返回空 `items`。

- [ ] **步骤 3：实现最小查询**

在 `admin/routes.py` 使用 `request.app.state.database.read_connection()` 查询房间并按 `created_at DESC` 读取成员、录制任务、评分任务；输出前端 mapper 已支持的 wire 字段 `room_id`、`title`、`status`、`member_count`、`created_at`、`recording_status`、`scoring_status`、`members`。无记录的录制/评分字段保持空或 `idle`，不写入 demo 值。

- [ ] **步骤 4：运行后端测试确认通过**

运行：`cd ../english-room-backend && PYTHONPATH=src .venv/bin/pytest tests/test_admin_metrics.py tests/test_player_rooms_api.py -q`

预期：PASS。

- [ ] **步骤 5：Commit**

```bash
git -C ../english-room-backend add src/english_room_backend/admin/routes.py tests/test_admin_metrics.py
git -C ../english-room-backend commit -m "feat(运营控制面): 查询真实房间状态"
```

### 任务 3：前端 wire 映射和真实空态测试

**文件：**
- 修改：`apps/web/src/api/ops-admin-wire-mappers.test.ts`
- 修改：`apps/web/src/pages/RoomsPage.tsx`
- 修改：`apps/web/src/pages/RoomsPage.test.tsx`（如现有测试文件不存在则在该任务创建）
- 修改：`apps/web/src/pages/OverviewPage.tsx`
- 修改：`apps/web/src/pages/StabilityPage.tsx`

- [ ] **步骤 1：编写失败测试**

增加真实房间 payload 映射测试，断言成员、录制状态和评分状态不丢失；增加空列表页面测试，断言显示真实空态，不显示 demo 房间或 demo 趋势。

- [ ] **步骤 2：运行测试确认失败**

运行：`pnpm --filter @english-room-op/web test src/api/ops-admin-wire-mappers.test.ts src/pages/RoomsPage.test.tsx`

预期：新断言失败，原因是页面当前存在 demo 专用展示分支或缺少真实状态字段展示。

- [ ] **步骤 3：实现最小页面调整**

只保留后端响应中的真实趋势和状态；真实空列表使用现有 `EmptyState`；不为缺失 Sentry 数据生成假 Issue、Replay、设备或版本数据。

- [ ] **步骤 4：运行测试确认通过**

运行：`pnpm --filter @english-room-op/web test src/api/ops-admin-wire-mappers.test.ts src/pages/RoomsPage.test.tsx`

预期：PASS。

### 任务 4：文档、格式和完整本地验证

**文件：**
- 修改：`README.md`
- 修改：`docs/architecture.md`
- 修改：`docs/ops-acceptance.md`

- [ ] **步骤 1：更新运行说明**

明确默认 HTTP、显式 Mock、Vite `/admin/v1` 代理、管理员 token 只能通过本地 `.env.local` 或运行时会话注入；记录房间无数据时的真实空态。

- [ ] **步骤 2：运行前端完整验证**

运行：`pnpm run test && pnpm run typecheck && pnpm run lint && pnpm run build`

预期：全部命令退出码为 0。

- [ ] **步骤 3：运行后端完整相关验证**

运行：`cd ../english-room-backend && PYTHONPATH=src .venv/bin/pytest tests/test_admin_metrics.py tests/test_player_rooms_api.py tests/test_recording_scoring_api.py -q && .venv/bin/ruff check src tests && .venv/bin/mypy src`

预期：全部通过；不把真实凭证写入命令或日志。

- [ ] **步骤 4：本地 HTTP 联调**

启动后端和前端 DEV server，使用 `.env.local` 中的本地 token 访问 `/admin/v1/metrics/overview`、`/admin/v1/rooms`、`/admin/v1/scoring`、`/admin/v1/audit/events`，确认页面显示后端来源或真实空态，且没有 `DemoDataBanner`。

- [ ] **步骤 5：检查并汇报部署前状态**

运行 `git diff --check`、敏感信息扫描、`git status -sb`；记录腾讯云目标服务、镜像/静态托管配置、环境变量名称和可回滚版本。若仓库没有腾讯云部署映射，停止在本地验收并向用户报告缺失目标，不猜测资源。
