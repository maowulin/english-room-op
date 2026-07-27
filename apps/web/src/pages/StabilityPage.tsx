import { useMemo, useState } from 'react';

import { opsApiClient } from '../api';
import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { DateRangeControl, EmptyState, Icon, MetricCard, Panel, StatusBadge, TrendChart } from '../components/ops-ui';
import { formatCount, formatPercent } from '../utils/formatters';
import { useOpsQuery } from '../hooks/useOpsQuery';

const DEFAULT_DAYS = 7;

function getRange(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(end.getDate() - (days - 1));
  return { dateFrom: start.toISOString().slice(0, 10), dateTo: end.toISOString().slice(0, 10) };
}

export function StabilityPage() {
  const [days, setDays] = useState(String(DEFAULT_DAYS));
  const range = useMemo(() => getRange(Number(days)), [days]);
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.getStabilitySummary(range), [range.dateFrom, range.dateTo]);

  return <OpsQueryStatus loading={loading} error={error} loadingLabel="加载稳定性数据…" onRetry={retry}>{data ? <div className="page-stack">
    <header className="page-header"><div><p className="eyebrow">English Room / Reliability</p><h1 className="page-title">稳定性中心</h1><p className="page-subtitle">发现用户受影响的位置，优先处理高风险问题</p></div><div className="page-actions"><DateRangeControl value={days} onChange={setDays} /><span className="environment-chip"><Icon name="server" size={16} /> Production</span><span className="updated-label">实时更新</span></div></header>
    {data.dataSource === 'demo' ? <p className="data-source-note">数据来源：演示数据（Mock 适配器）</p> : null}
    <section className="metric-grid metric-grid--four"><MetricCard label="App opened" value={formatCount(data.appOpenedCount)} delta={`${formatPercent(data.appOpenedFailureRate)} 失败`} icon="chart" values={[8, 9, 8, 10, 9, 8, 7]} /><MetricCard label="RTC failure" value={formatPercent(data.rtcFailureRate)} delta="连接失败率" icon="shield" tone="amber" values={[8, 7, 9, 7, 8, 6, 7]} /><MetricCard label="Recording failure" value={formatPercent(data.recordingFailureRate)} delta="录制失败率" icon="alert" tone="coral" values={[5, 7, 6, 8, 5, 6, 4]} /><MetricCard label="新增 Issue" value={formatCount(data.topIssues.length)} delta="近期开启" icon="alert" tone="coral" values={[7, 8, 6, 7, 5, 5, 4]} /></section>
    <div className="content-grid content-grid--stability"><Panel title="错误与崩溃趋势" className="panel--trend"><div className="chart-legend"><span><i className="legend-line" /> Error</span><span><i className="legend-line legend-line--dashed" /> Crash</span><span><i className="legend-line legend-line--faint" /> ANR</span></div><TrendChart values={data.errorTrend.map((point) => ({ label: point.date.slice(5), count: point.count }))} label="错误与崩溃趋势" /></Panel><Panel title="版本健康度"><VersionHealth items={data.versionHealth} /></Panel></div>
    <div className="content-grid content-grid--stability"><Panel title="高优先级问题" className="panel--issues"><IssuesTable items={data.topIssues} /></Panel><Panel title="设备与系统"><Breakdown title="设备分布" items={data.deviceBreakdown} /><Breakdown title="网络错误分布" items={data.networkBreakdown} /></Panel></div>
  </div> : null}</OpsQueryStatus>;
}

function VersionHealth({ items }: { items: Array<{ label: string; value: number; color?: string }> }) {
  if (!items.length) return <EmptyState title="暂无版本数据" description="版本分布将在客户端上报后显示。" />;
  let offset = 0;
  const stops = items.map((item) => { const start = offset * 360; offset += item.value; return `${item.color ?? '#16785a'} ${start}deg ${offset * 360}deg`; }).join(', ');
  return <div className="version-health"><div className="donut" style={{ background: `conic-gradient(${stops})` }}><span>版本<br />健康度</span></div><div className="version-legend">{items.map((item) => <div key={item.label}><i style={{ background: item.color ?? '#16785a' }} /><span>{item.label}</span><strong>{formatPercent(item.value, 0)}</strong></div>)}</div></div>;
}

function IssuesTable({ items }: { items: Array<{ id: string; title: string; count: number }> }) {
  if (!items.length) return <EmptyState title="暂无 Issue" description="当前没有需要处理的稳定性问题。" />;
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Issue</th><th>发生次数</th><th>状态</th><th>操作</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.id}</small></td><td>{formatCount(item.count)}</td><td><StatusBadge tone="amber">处理中</StatusBadge></td><td><button type="button" className="text-button">查看详情</button></td></tr>)}</tbody></table></div>;
}

function Breakdown({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return <div className="breakdown"><h3>{title}</h3>{items.length ? items.map((item) => <div className="breakdown__row" key={item.label}><span><Icon name={title === '设备分布' ? 'user' : 'chart'} size={17} />{item.label}</span><div className="progress"><i style={{ width: `${item.value * 100}%` }} /></div><strong>{formatPercent(item.value, 1)}</strong></div>) : <EmptyState title="暂无数据" />}</div>;
}
