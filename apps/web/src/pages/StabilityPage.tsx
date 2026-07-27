import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { opsApiClient } from '../api';
import { formatDataSourceLead } from '../utils/data-source-label';

export function StabilityPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.getStabilitySummary(), []);

  return (
    <OpsQueryStatus loading={loading} error={error} loadingLabel="加载稳定性数据…" onRetry={retry}>
      {data ? (
        <>
          <h1 className="page-title">稳定性中心</h1>
          <p className="page-lead">{formatDataSourceLead(data.dataSource)}</p>
          <section className="panel" aria-labelledby="affected-heading">
            <h2 id="affected-heading">受影响用户</h2>
            <p>
              近 7 日估算受影响用户：
              <strong>{data.affectedUsersPlaceholder}</strong>
              {data.dataSource === 'demo' ? '（演示）' : null}
            </p>
          </section>
          <section className="panel" aria-labelledby="trend-heading">
            <h2 id="trend-heading">错误趋势</h2>
            <StabilityTrendTable errorTrend={data.errorTrend} />
          </section>
          <section className="panel" aria-labelledby="issues-heading">
            <h2 id="issues-heading">Top Issue{data.dataSource === 'demo' ? '（演示）' : ''}</h2>
            <ul>
              {data.topIssues.map((issue) => (
                <li key={issue.id}>
                  {issue.title}
                  {' '}
                  <span className="status-pill">{issue.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </OpsQueryStatus>
  );
}

function StabilityTrendTable({
  errorTrend,
}: {
  errorTrend: Array<{ date: string; count: number }>;
}) {
  const trendSummary = errorTrend.map((point) => `${point.date} ${point.count} 次`).join('；');

  return (
    <>
      <p className="chart-summary" role="img" aria-label={`错误趋势：${trendSummary}`}>
        图表文本摘要：近 7 日错误次数分别为 {trendSummary}。
      </p>
      <table className="data-table">
        <caption className="sr-only">错误趋势明细</caption>
        <thead>
          <tr>
            <th scope="col">日期</th>
            <th scope="col">错误数</th>
          </tr>
        </thead>
        <tbody>
          {errorTrend.map((row) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
