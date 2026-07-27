/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuditPage } from './AuditPage';
import { OverviewPage } from './OverviewPage';
import { RoomsPage } from './RoomsPage';
import { ScoringPage } from './ScoringPage';

const api = vi.hoisted(() => ({
  getOverviewMetrics: vi.fn(),
  getStabilitySummary: vi.fn(),
  listRooms: vi.fn(),
  listScoringTasks: vi.fn(),
  retryScoringTask: vi.fn(),
  listAuditLog: vi.fn(),
}));

vi.mock('../api', () => ({ opsApiClient: api }));
vi.mock('../config/ops-api-mode', () => ({ isOpsHttpMode: () => true }));

describe('operations page empty and action states', () => {
  afterEach(() => vi.clearAllMocks());

  it('renders a real empty state for HTTP overview data', async () => {
    api.getOverviewMetrics.mockResolvedValue({
      dataSource: 'backend',
      generatedAt: 'now',
      disclaimer: 'ok',
      dau: 0,
      sessionCount: 0,
      roomStartCount: 0,
      roomCompletionRate: 0,
      scoreReportViewRate: 0,
      d7RetentionRate: 0,
      activeTrend: [],
      retentionHeatmap: [],
      funnel: [],
    });

    render(<OverviewPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: '运营总览' })).toBeInTheDocument());
    expect(screen.getAllByText('暂无足够数据').length).toBeGreaterThan(0);
    expect(screen.queryByText(/演示数据/)).not.toBeInTheDocument();
  });

  it('renders empty rooms, scoring, and audit states', async () => {
    api.listRooms.mockResolvedValue({ dataSource: 'backend', generatedAt: 'now', disclaimer: 'ok', rooms: [] });
    api.listScoringTasks.mockResolvedValue({ dataSource: 'backend', generatedAt: 'now', disclaimer: 'ok', tasks: [] });
    api.listAuditLog.mockResolvedValue({ dataSource: 'backend', generatedAt: 'now', disclaimer: 'ok', entries: [] });

    render(<RoomsPage />);
    await waitFor(() => expect(screen.getByText('暂无活跃房间')).toBeInTheDocument());
    render(<ScoringPage />);
    await waitFor(() => expect(screen.getByText('暂无评分任务')).toBeInTheDocument());
    render(<AuditPage />);
    await waitFor(() => expect(screen.getByText('暂无审计事件')).toBeInTheDocument());
  });

  it('uses a safe generic error and shows local placeholder retry feedback', async () => {
    api.listScoringTasks.mockResolvedValue({
      dataSource: 'backend',
      generatedAt: 'now',
      disclaimer: 'ok',
      tasks: [{ id: 'job-1', playerLabel: 'Player · 0001', status: 'failed', failureReason: 'hidden', retryAllowed: true }],
    });
    api.retryScoringTask.mockResolvedValue({
      taskId: 'job-1',
      status: 'pending',
      execution: 'not_started',
      requestId: 'req-1',
      message: '本地占位：请求已提交，评分尚未启动。',
    });

    render(<ScoringPage />);
    await waitFor(() => screen.getByRole('button', { name: /重试任务/ }));
    screen.getByRole('button', { name: /重试任务/ }).click();
    await waitFor(() => expect(screen.getByText(/本地占位/)).toBeInTheDocument());
    expect(api.retryScoringTask).toHaveBeenCalledWith('job-1');
  });
});
