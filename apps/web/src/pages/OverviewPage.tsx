import { useMemo, useState, type CSSProperties } from 'react';

import { opsApiClient } from '../api';
import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { DateRangeControl, EmptyState, Icon, MetricCard, Panel, TrendChart } from '../components/ops-ui';
import { formatCount, formatPercent, formatUpdatedAt } from '../utils/formatters';
import { useOpsQuery } from '../hooks/useOpsQuery';

const DEFAULT_DAYS = 7;

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  return { dateFrom: iso(start), dateTo: iso(end) };
}

export function OverviewPage() {
  const [days, setDays] = useState(String(DEFAULT_DAYS));
  const range = useMemo(() => getDateRange(Number(days)), [days]);
  const { data: metrics, error, loading, retry } = useOpsQuery(() => opsApiClient.getOverviewMetrics(range), [range.dateFrom, range.dateTo]);

  return <OpsQueryStatus loading={loading} error={error} loadingLabel="加载总览指标…" onRetry={retry}>
    {metrics ? <div className="page-stack">
      <header className="page-header"><div><p className="eyebrow">English Room / Operations</p><h1 className="page-title">运营总览</h1><p className="page-subtitle">关注增长、转化与今日服务状态</p></div><div className="page-actions"><DateRangeControl value={days} onChange={setDays} /><span className="environment-chip"><Icon name="server" size={16} /> Production</span><span className="updated-label">更新于 {formatUpdatedAt(metrics.generatedAt)}</span></div></header>
      {metrics.dataSource === 'demo' ? <p className="data-source-note">数据来源：演示数据（Mock 适配器）</p> : null}
      <section className="metric-grid metric-grid--four">
        <MetricCard label="DAU" value={formatCount(metrics.dau)} delta={`${(metrics.dauDeltaPercent ?? 0) >= 0 ? '+' : ''}${(metrics.dauDeltaPercent ?? 0).toFixed(1)}% ↑`} icon="user" values={[8, 10, 9, 12, 11, 14, 13]} />
        <MetricCard label="会话数" value={formatCount(metrics.sessionCount)} delta="+3.2% ↑" icon="users" values={[4, 5, 6, 5, 8, 7, 9]} />
        <MetricCard label="房间开始" value={formatCount(metrics.roomStartCount)} delta={`${formatPercent(metrics.roomConversionRate)} 转化`} icon="home" values={[3, 4, 4, 5, 7, 6, 8]} />
        <MetricCard label="评分查看率" value={formatPercent(metrics.scoreReportViewRate ?? 0)} delta={`${formatPercent(metrics.scoringCompletionRate ?? 0)} 完成`} icon="star" values={[8, 7, 9, 8, 10, 9, 11]} />
      </section>
      <div className="content-grid content-grid--overview"><Panel title="活跃用户趋势" className="panel--trend"><div className="chart-legend"><span><i className="legend-line" /> DAU</span><span><i className="legend-line legend-line--dashed" /> 新增用户</span></div>{metrics.activeTrend.length ? <TrendChart values={metrics.activeTrend.map((point) => ({ label: point.day, count: point.count }))} label="活跃用户趋势" /> : <EmptyState title="暂无足够数据" description="后端尚未上报趋势事件。" />}</Panel><Panel title="留存表现"><RetentionHeatmap rows={metrics.retentionHeatmap} /></Panel></div>
      <div className="content-grid content-grid--overview"><Panel title="核心转化漏斗" className="panel--funnel"><Funnel items={metrics.funnel} /></Panel><Panel title="今日系统状态"><SystemStatus /></Panel></div>
    </div> : null}
  </OpsQueryStatus>;
}

function RetentionHeatmap({ rows }: { rows: Array<{ label: string; d1: number; d7: number; d30: number }> }) {
  if (!rows.length) return <EmptyState title="暂无足够数据" description="留存队列生成后会显示在这里。" />;
  return <div className="heatmap"><div className="heatmap__row heatmap__header"><span /><span>D1</span><span>D7</span><span>D30</span></div>{rows.map((row) => <div className="heatmap__row" key={row.label}><span>{row.label}</span><span style={{ '--heat': row.d1 } as CSSProperties}>{formatPercent(row.d1)}</span><span style={{ '--heat': row.d7 } as CSSProperties}>{formatPercent(row.d7)}</span><span style={{ '--heat': row.d30 } as CSSProperties}>{formatPercent(row.d30)}</span></div>)}</div>;
}

function Funnel({ items }: { items: Array<{ label: string; count: number; rate: number }> }) {
  if (!items.length) return <EmptyState title="暂无足够数据" description="房间事件上报后会形成转化漏斗。" />;
  return <div className="funnel">{items.map((item, index) => <div className="funnel__step" key={item.label}><span className="funnel__icon"><Icon name={index === 0 ? 'home' : index === items.length - 1 ? 'star' : 'users'} size={22} /></span><span className="funnel__label">{item.label}</span><strong>{formatPercent(item.rate)}</strong><small>{formatCount(item.count)}</small>{index < items.length - 1 ? <span className="funnel__arrow">›</span> : null}</div>)}</div>;
}

function SystemStatus() {
  const rows = [
    { label: 'API', value: '99.98%', icon: 'server' as const, tone: 'mint' },
    { label: 'RTC 入房', value: '98.7%', icon: 'chart' as const, tone: 'mint' },
    { label: '评分', value: 'Not configured', icon: 'star' as const, tone: 'amber' },
    { label: '新增长 Issue', value: '—', icon: 'alert' as const, tone: 'neutral' },
  ] as const;
  return <div className="system-status">{rows.map((row) => <div className="system-status__row" key={row.label}><span className={`metric-icon metric-icon--${row.tone}`}><Icon name={row.icon} size={18} /></span><span>{row.label}</span><strong>{row.value}</strong><MiniStatusBars /></div>)}</div>;
}

function MiniStatusBars() {
  return <span className="mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>;
}
