import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { opsApiClient } from '../api';
import { formatDataSourceLead } from '../utils/data-source-label';

export function AuditPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.listAuditLog(), []);

  return (
    <OpsQueryStatus loading={loading} error={error} loadingLabel="加载审计日志…" onRetry={retry}>
      {data ? (
        <>
          <h1 className="page-title">审计日志</h1>
          <p className="page-lead">{formatDataSourceLead(data.dataSource)}</p>
          <table className="data-table">
            <caption className="sr-only">审计事件</caption>
            <thead>
              <tr>
                <th scope="col">时间</th>
                <th scope="col">操作者</th>
                <th scope="col">动作</th>
                <th scope="col">目标</th>
                <th scope="col">结果</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.occurredAt}</td>
                  <td>{entry.actor}</td>
                  <td>{entry.action}</td>
                  <td>{entry.target}</td>
                  <td>{entry.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </OpsQueryStatus>
  );
}
