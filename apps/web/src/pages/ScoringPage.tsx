import { useCallback, useState } from 'react';

import { opsApiClient } from '../api';
import type { ScoringTask } from '../api/types';
import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { EmptyState, Icon, MetricCard, Panel, StatusBadge } from '../components/ops-ui';
import { isOpsHttpMode } from '../config/ops-api-mode';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { formatCount } from '../utils/formatters';

const statusLabels: Record<ScoringTask['status'], string> = { queued: '等待评分', running: '处理中', succeeded: '评分完成', failed: '评分失败', retryable: '可重试' };

export function ScoringPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.listScoringTasks(), []);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const httpMode = isOpsHttpMode();

  const onRetryTask = useCallback(async (task: ScoringTask) => {
    setPendingId(task.id); setFeedback(null); setActionError(null);
    try {
      const result = await opsApiClient.retryScoringTask(task.id);
      setFeedback(result.status === 'pending' ? '本地占位 / 未启动：重试请求已记录，评分尚未开始。' : result.message);
    } catch {
      setActionError('接口暂不可用');
    } finally {
      setPendingId(null);
    }
  }, []);

  return <OpsQueryStatus loading={loading} error={error} loadingLabel="加载评分任务…" onRetry={retry}>{data ? <div className="page-stack">
    <header className="page-header"><div><p className="eyebrow">English Room / Scoring pipeline</p><h1 className="page-title">评分任务</h1><p className="page-subtitle">追踪音频、评分任务与报告状态</p></div><div className="page-actions"><label className="search-control"><Icon name="search" size={18} /><input name="scoring-search" aria-label="搜索任务、房间或玩家" placeholder="搜索任务、房间或玩家" /></label><span className="environment-chip"><Icon name="server" size={16} /> Production</span></div></header>
    {data.dataSource === 'demo' ? <p className="data-source-note">数据来源：演示数据（Mock 适配器）</p> : null}
    <section className="metric-grid metric-grid--five"><MetricCard label="处理中" value={formatCount(data.tasks.filter((task) => task.status === 'running').length)} icon="play" values={[3, 4, 3, 5, 4, 6, 5]} /><MetricCard label="等待中" value={formatCount(data.tasks.filter((task) => task.status === 'queued').length)} icon="clock" tone="amber" values={[4, 5, 4, 6, 5, 7, 6]} /><MetricCard label="今日成功" value={formatCount(data.tasks.filter((task) => task.status === 'succeeded').length)} icon="check" values={[4, 5, 6, 5, 7, 8, 7]} /><MetricCard label="今日失败" value={formatCount(data.tasks.filter((task) => task.status === 'failed' || task.status === 'retryable').length)} icon="alert" tone="coral" values={[3, 4, 3, 5, 4, 3, 4]} /><MetricCard label="成功率" value={data.tasks.length ? `${Math.round(data.tasks.filter((task) => task.status === 'succeeded').length / data.tasks.length * 100)}%` : '—'} delta="本地统计" icon="chart" values={[6, 7, 6, 8, 7, 9, 8]} /></section>
    {actionError ? <p role="alert" className="ops-query-error">{actionError}</p> : null}{feedback ? <p role="status" className="retry-feedback">{feedback}</p> : null}
    <Panel title="任务队列"><ScoringTable tasks={data.tasks} httpMode={httpMode} pendingId={pendingId} onRetry={onRetryTask} /></Panel>
  </div> : null}</OpsQueryStatus>;
}

function ScoringTable({ tasks, httpMode, pendingId, onRetry }: { tasks: ScoringTask[]; httpMode: boolean; pendingId: string | null; onRetry: (task: ScoringTask) => void }) {
  if (!tasks.length) return <EmptyState title="暂无评分任务" description="评分任务会在后端收到音频后出现在这里。" />;
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>任务 ID</th><th>房间</th><th>玩家</th><th>音频</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id} className={task.status === 'failed' || task.status === 'retryable' ? 'is-danger' : ''}><td><strong>{task.id}</strong></td><td>{task.roomId ?? '—'}</td><td>{task.playerLabel}</td><td>{task.audioAssetId ?? '—'}</td><td><StatusBadge tone={task.status === 'failed' || task.status === 'retryable' ? 'coral' : task.status === 'queued' ? 'amber' : task.status === 'running' ? 'blue' : 'mint'}>{statusLabels[task.status]}</StatusBadge>{task.failureReason ? <small className="table-subtext">{task.failureReason}</small> : null}</td><td>{task.createdAt ?? '—'}</td><td>{task.retryAllowed ? <button type="button" className="btn btn--small btn-secondary" aria-label={`重试任务 ${task.id}`} disabled={pendingId === task.id} onClick={() => onRetry(task)}>{pendingId === task.id ? '进行中…' : httpMode ? '重试（本地占位）' : '重试（演示）'}</button> : task.status === 'succeeded' ? <span className="muted-text">查看结果</span> : <span className="muted-text">—</span>}</td></tr>)}</tbody></table><div className="table-footer">共 {tasks.length} 条 <span>&lt; 1 &gt;</span></div></div>;
}
