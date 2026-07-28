# 运营平台全链路闭环实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 `superpowers:executing-plans` 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 修复多人房间会话到运营平台的埋点、房间、评分、重试、审计和认证闭环。

**架构：** Backend 继续作为管理 API 和业务状态真相源；App 适配 Backend analytics contract；Ops 只映射真实 wire 数据。评分重试调用既有 `RecordingService`，不可用 provider 返回明确失败，不创建伪造成功结果。

**技术栈：** React/Vite/TypeScript/Vitest、Expo TypeScript/Jest、FastAPI/Pydantic/SQLite/pytest/Ruff/mypy。

---

### 任务 1：统一 App 与 Backend analytics contract

**文件：**
- 修改：`/Volumes/SeamlessSSD/MacOffload/wulin/CodexWork/work/english-room-tonight/app/apps/mobile/src/services/analytics-client.ts`
- 修改：`/Volumes/SeamlessSSD/MacOffload/wulin/CodexWork/work/english-room-tonight/app/apps/mobile/src/services/analytics-factory.ts`
- 修改：`/Users/wulin/other/english-room-workspace/english-room-backend/tests/test_analytics_ingest.py`
- 修改：App analytics tests 中所有 wire record fixture

- [ ] 写测试：用 App 当前 wire shape 发送 `app_opened`，断言 Backend 返回 accepted=1；断言 `anonymous_user_id` 以 `anon_` 开头、`session_id` 以 `session_` 开头、`event_version=1`、environment 为 `local`。
- [ ] 运行测试确认当前失败：`cd english-room-backend && .venv/bin/pytest tests/test_analytics_ingest.py -q`。
- [ ] 最小实现：App 将 `user_id/app_session_id/schema_version` 改为 Backend 字段，将 `development` 映射为 `local`，ID 生成器增加规范前缀；保留 App 内部 API 的语义不变。
- [ ] 运行 Backend analytics tests 与 App analytics tests，确认红转绿。

### 任务 2：补齐管理房间 wire 数据

**文件：**
- 修改：`english-room-backend/src/english_room_backend/admin/routes.py`
- 修改：`english-room-backend/tests/test_admin_metrics.py`
- 修改：`english-room-op/apps/web/src/api/ops-admin-wire-mappers.ts`
- 修改：`english-room-op/apps/web/src/api/ops-admin-wire-mappers.test.ts`

- [ ] 写失败测试：创建房主和成员后断言 rooms 返回 `owner_label`、成员 `display_name`、`ended_at`/生命周期基础记录；processing 房间必须保持 processing。
- [ ] 运行 `pytest tests/test_admin_metrics.py -q` 验证失败。
- [ ] 查询 `rooms`、`guest_sessions`、`room_members`、`recording_tasks`、`score_jobs`，只返回数据库真实字段；前端优先使用 display name，缺失时才脱敏 ID。
- [ ] 运行 Backend admin tests 和 Ops wire mapper tests。

### 任务 3：补齐评分列表并实现真实重试语义

**文件：**
- 修改：`english-room-backend/src/english_room_backend/analytics/repository.py`
- 修改：`english-room-backend/src/english_room_backend/admin/routes.py`
- 修改：`english-room-backend/tests/test_admin_metrics.py`
- 修改：`english-room-op/apps/web/src/api/ops-admin-wire-mappers.ts`
- 修改：`english-room-op/apps/web/src/pages/ScoringPage.tsx`
- 修改：对应 Ops API/page tests

- [ ] 写失败测试：评分列表返回 room/player/audio/failure/execution；waiting 任务不能 retry；failed/retryable 任务调用一次真实 service；重复 idempotency key 返回同一结果。
- [ ] 运行相关 pytest 确认失败。
- [ ] 最小实现：扩展 SQL 字段；retry 校验任务状态，写入 queued/processing/failed 的真实结果，调用 `RecordingService.retry`；provider 不可用时写失败原因并返回可展示状态。
- [ ] 前端显示真实关联字段和失败原因，只有 retryAllowed 才显示按钮。
- [ ] 运行 Backend scoring/admin tests 与 Ops scoring tests。

### 任务 4：统一管理认证、CORS 与审计 wire

**文件：**
- 修改：`english-room-backend/src/english_room_backend/main.py`
- 修改：`english-room-backend/src/english_room_backend/analytics/repository.py`
- 修改：`english-room-backend/tests/test_admin_metrics.py`
- 修改：`english-room-op/apps/web/src/api/ops-admin-wire-mappers.ts`
- 修改：`english-room-op/docs/ops-acceptance.md`

- [ ] 写失败测试：Bearer token 能访问 admin；错误 token 仍 401；CORS 允许配置的 5173 origin；审计 ID/actor/result/risk 类型稳定。
- [ ] 运行测试确认失败。
- [ ] 实现认证优先读取 Bearer，再兼容 X-Ops token；审计使用请求头中的 admin role 作为 actor，缺失字段返回明确 unknown；不回显敏感值。
- [ ] 运行 Backend admin tests 与 Ops audit/http tests。

### 任务 5：全链路验证与回归

**文件：**
- 修改：必要的验收文档和测试 fixture，不修改无关用户文件

- [ ] 运行 App analytics tests/typecheck。
- [ ] 运行 Backend `pytest`、`ruff check`、`mypy`。
- [ ] 运行 Ops `pnpm run test`、`typecheck`、`lint`、`build`。
- [ ] 启动本地 Backend/Ops，用真实 SQLite 数据验证总览、稳定性、房间、评分、审计五页和 retry HTTP；核对页面字段与数据库。
- [ ] 运行 `git diff --check`、敏感信息扫描、三仓 `git status -sb`，报告仍受真实云 provider 限制的能力。

