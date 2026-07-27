import { useCallback, useEffect, useState } from 'react';

import { opsApiClient } from '../api';
import type { ScoringTask } from '../api/types';

export function ScoringPage() {
  const [tasks, setTasks] = useState<ScoringTask[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    void opsApiClient.listScoringTasks().then((res) => setTasks(res.tasks));
  }, []);

  const onRetry = useCallback(async (task: ScoringTask) => {
    setPendingId(task.id);
    setFeedback(null);
    try {
      const result = await opsApiClient.retryScoringTask(task.id);
      setFeedback(result.message);
    } finally {
      setPendingId(null);
    }
  }, []);

  return (
    <>
      <h1 className="page-title">评分任务</h1>
      <p className="page-lead">/admin/v1/scoring/* — 重试按钮为 mock，不发起真实写操作</p>
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
          {tasks.map((task) => (
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
                  aria-label={`重试任务 ${task.id}（演示）`}
                  onClick={() => void onRetry(task)}
                >
                  {pendingId === task.id ? '处理中…' : '重试（演示）'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
