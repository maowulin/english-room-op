import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { opsApiClient } from '../api';
import { formatDataSourceLead } from '../utils/data-source-label';

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function OverviewPage() {
  const { data: metrics, error, loading, retry } = useOpsQuery(
    () => opsApiClient.getOverviewMetrics(),
    [],
  );

  return (
    <OpsQueryStatus loading={loading} error={error} loadingLabel="加载总览指标…" onRetry={retry}>
      {metrics ? (
        <>
          <h1 className="page-title">运营总览</h1>
          <p className="page-lead">{formatDataSourceLead(metrics.dataSource)}</p>
          <dl className="metric-grid">
            <div className="metric-card">
              <dt>DAU</dt>
              <dd>{metrics.dau.toLocaleString()}</dd>
            </div>
            <div className="metric-card">
              <dt>DAU 环比</dt>
              <dd>
                {metrics.dauDeltaPercent > 0 ? '+' : ''}
                {metrics.dauDeltaPercent.toFixed(1)}%
              </dd>
            </div>
            <div className="metric-card">
              <dt>D1 留存</dt>
              <dd>{formatPercent(metrics.d1RetentionRate)}</dd>
            </div>
            <div className="metric-card">
              <dt>D7 留存</dt>
              <dd>{formatPercent(metrics.d7RetentionRate)}</dd>
            </div>
            <div className="metric-card">
              <dt>房间转化率</dt>
              <dd>{formatPercent(metrics.roomConversionRate)}</dd>
            </div>
            <div className="metric-card">
              <dt>评分完成率</dt>
              <dd>{formatPercent(metrics.scoringCompletionRate)}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </OpsQueryStatus>
  );
}
