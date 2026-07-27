import { useCallback, useState } from 'react';

import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { opsApiClient } from '../api';
import type { ScoringTask } from '../api/types';
import { isOpsHttpMode } from '../config/ops-api-mode';
import { formatDataSourceLead } from '../utils/data-source-label';

export function ScoringPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.listScoringTasks(), []);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const httpMode = isOpsHttpMode();

  const onRetryTask = useCallback(async (task: ScoringTask) => {
    setPendingId(task.id);
    setFeedback(null);
    setActionError(null);
    try {
      const result = await opsApiClient.retryScoringTask(task.id);
      setFeedback(result.message);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : '重试请求失败');
    } finally {
      setPendingId(null);
    }
  }, []);

  return (
    <OpsQueryStatus loading={loading} error={error} loadingLabel="加载评分任务…" onRetry={retry}>
      {data ? (
        <>
          <h1 className="page-title">评分任务</h1>
          <p className="page-lead">{formatDataSourceLead(data.dataSource)}</p>
          {actionError ? (
            <p role="alert" className="ops-query-error">
              {actionError}
            </p>
          ) : null}
          {feedback ? (
            <p className="retry-feedback" role="status">
              {feedback}
            </p>
          ) : null}
          <table className="data-table">
            <caption className="sr-only">评分任务队列</caption>
            <thead>
              <tr>
                <th scope="col">玩家</th>
                <th scope="col">状态</th>
                <th scope="col">失败原因</th>
                <th scope="col">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.playerLabel}</td>
                  <td>
                    <span className="status-pill">{task.status}</span>
                  </td>
                  <td>{task.failureReason ?? '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn"
                      disabled={!task.retryAllowed || pendingId === task.id}
                      aria-label={
                        httpMode
                          ? `重试任务 ${task.id}`
                          : `重试任务 ${task.id}（演示）`
                      }
                      onClick={() => void onRetryTask(task)}
                    >
                      {pendingId === task.id
                        ? '处理中…'
                        : httpMode
                          ? '重试'
                          : '重试（演示）'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </OpsQueryStatus>
  );
}
