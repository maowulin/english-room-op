/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuditPage } from './AuditPage';
import { OverviewPage } from './OverviewPage';
import { RoomsPage } from './RoomsPage';
import { ScoringPage } from './ScoringPage';
import { StabilityPage } from './StabilityPage';

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
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

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
    expect(screen.queryByText('99.98%')).not.toBeInTheDocument();
    expect(screen.queryByText('98.7%')).not.toBeInTheDocument();
    expect(screen.queryByText('新增用户')).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: '趋势图' })).not.toBeInTheDocument();
    expect(screen.queryByText(/演示数据/)).not.toBeInTheDocument();
  });

  it('keeps stability empty data free of synthetic rates and issue trends', async () => {
    api.getStabilitySummary.mockResolvedValue({
      dataSource: 'backend',
      generatedAt: 'now',
      disclaimer: 'ok',
      errorTrend: [],
      topIssues: [],
      versionHealth: [],
      deviceBreakdown: [],
      networkBreakdown: [],
    });

    render(<StabilityPage />);
    await waitFor(() => expect(screen.getByRole('heading', { name: '稳定性中心' })).toBeInTheDocument());
    expect(screen.queryByText('99.98%')).not.toBeInTheDocument();
    expect(screen.queryByText('98.7%')).not.toBeInTheDocument();
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(screen.getAllByText('暂无数据').length).toBeGreaterThan(0);
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
    await waitFor(() => expect(screen.getByText(/重试请求已记录/)).toBeInTheDocument());
    expect(screen.queryByText(/本地占位/)).not.toBeInTheDocument();
    expect(api.retryScoringTask).toHaveBeenCalledWith('job-1');
  });

  it('filters scoring tasks by task, room, or player search', async () => {
    api.listScoringTasks.mockResolvedValue({
      dataSource: 'backend',
      generatedAt: 'now',
      disclaimer: 'ok',
      tasks: [
        { id: 'job-1', roomId: 'room-1', playerLabel: 'Player · 205f', status: 'queued', retryAllowed: false },
        { id: 'job-2', roomId: 'room-2', playerLabel: 'Player · ca31', status: 'queued', retryAllowed: false },
      ],
    });

    render(<ScoringPage />);
    await waitFor(() => expect(screen.getByText('Player · 205f')).toBeInTheDocument());
    fireEvent.change(screen.getByRole('textbox', { name: '搜索任务、房间或玩家' }), { target: { value: '205f' } });

    expect(screen.getByText('Player · 205f')).toBeInTheDocument();
    expect(screen.queryByText('Player · ca31')).not.toBeInTheDocument();
  });

  it('filters audit events by actor, action, target, and request id', async () => {
    api.listAuditLog.mockResolvedValue({
      dataSource: 'backend',
      generatedAt: 'now',
      disclaimer: 'ok',
      entries: [
        {
          id: 'event-1',
          actor: '林舟',
          action: 'retry',
          target: 'job-1',
          requestId: 'req-1',
          result: 'unknown',
          details: {},
          occurredAt: 'now',
        },
        {
          id: 'event-2',
          actor: 'Mia',
          action: 'view',
          target: 'room-2',
          requestId: 'req-2',
          result: 'success',
          details: {},
          occurredAt: 'now',
        },
      ],
    });

    render(<AuditPage />);
    await waitFor(() => expect(screen.getAllByText('未知').length).toBeGreaterThan(1));
    const search = screen.getAllByRole('textbox', { name: '搜索管理员、操作或资源' })[0];
    fireEvent.change(search, { target: { value: 'req-1' } });
    expect(screen.getAllByText('retry').length).toBeGreaterThan(1);
    expect(screen.getAllByText('view').every((element) => element.tagName === 'OPTION')).toBe(true);
  });

  it('exports audit data locally or gives a safe browser fallback', async () => {
    api.listAuditLog.mockResolvedValue({ dataSource: 'backend', generatedAt: 'now', disclaimer: 'ok', entries: [] });

    render(<AuditPage />);
    fireEvent.click(await screen.findByRole('button', { name: /导出记录/ }));
    expect(screen.getByRole('status')).toHaveTextContent(/下载|导出/);
    expect(api.listAuditLog).toHaveBeenCalledTimes(1);
  });

  it('opens a safe stability issue detail drawer', async () => {
    api.getStabilitySummary.mockResolvedValue({
      dataSource: 'backend',
      generatedAt: 'now',
      disclaimer: 'ok',
      errorTrend: [],
      topIssues: [{ id: 'issue-1', title: 'RTC connection failed', count: 3 }],
      versionHealth: [],
      deviceBreakdown: [],
      networkBreakdown: [],
    });

    render(<StabilityPage />);
    fireEvent.click(await screen.findByRole('button', { name: '查看详情' }));
    expect(screen.getAllByText('issue-1').length).toBeGreaterThan(1);
    expect(screen.getAllByText('RTC connection failed').length).toBeGreaterThan(1);
    expect(screen.getAllByText('3').length).toBeGreaterThan(1);
  });
});
