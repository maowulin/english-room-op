import { useEffect, useState } from 'react';

import { opsApiClient } from '../api';
import type { OverviewMetricsResponse } from '../api/types';

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function OverviewPage() {
  const [metrics, setMetrics] = useState<OverviewMetricsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    opsApiClient
      .getOverviewMetrics()
      .then(setMetrics)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : '加载失败');
      });
  }, []);

  if (error) {
    return <p role="alert">{error}</p>;
  }

  if (!metrics) {
    return <p aria-busy="true">加载总览指标…</p>;
  }

  return (
    <>
      <h1 className="page-title">运营总览</h1>
      <p className="page-lead">数据来源：{metrics.dataSource} adapter（/admin/v1/metrics/* 占位）</p>
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
  );
}
