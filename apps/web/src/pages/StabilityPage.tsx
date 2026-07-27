import { useEffect, useState } from 'react';

import { opsApiClient } from '../api';
import type { StabilitySummaryResponse } from '../api/types';

export function StabilityPage() {
  const [data, setData] = useState<StabilitySummaryResponse | null>(null);

  useEffect(() => {
    void opsApiClient.getStabilitySummary().then(setData);
  }, []);

  if (!data) {
    return <p aria-busy="true">加载稳定性数据…</p>;
  }

  const trendSummary = data.errorTrend
    .map((point) => `${point.date} ${point.count} 次`)
    .join('；');

  return (
    <>
      <h1 className="page-title">稳定性中心</h1>
      <p className="page-lead">/admin/v1/sentry/* 摘要占位（无 Sentry Token）</p>
      <section className="panel" aria-labelledby="affected-heading">
        <h2 id="affected-heading">受影响用户（占位）</h2>
        <p>
          近 7 日估算受影响用户：
          <strong>{data.affectedUsersPlaceholder}</strong>
          （演示）
        </p>
      </section>
      <section className="panel" aria-labelledby="trend-heading">
        <h2 id="trend-heading">错误趋势</h2>
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
            {data.errorTrend.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="panel" aria-labelledby="issues-heading">
        <h2 id="issues-heading">Top Issue（演示）</h2>
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
  );
}
