import { useMemo, useState } from 'react';

import { opsApiClient } from '../api';
import type { AuditLogEntry } from '../api/types';
import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { Drawer, EmptyState, Icon, MetricCard, Panel, StatusBadge } from '../components/ops-ui';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { formatCount } from '../utils/formatters';

export function AuditPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.listAuditLog(), []);
  const [resultFilter, setResultFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return data?.entries.filter((entry) => {
      const searchable = `${entry.actor} ${entry.action} ${entry.target} ${entry.requestId ?? ''}`.toLowerCase();
      return (resultFilter === 'all' || entry.result === resultFilter) && (actionFilter === 'all' || entry.action === actionFilter) && (!normalizedSearch || searchable.includes(normalizedSearch));
    }) ?? [];
  }, [actionFilter, data?.entries, resultFilter, search]);
  const actions = [...new Set(data?.entries.map((entry) => entry.action) ?? [])];
  const selected = data?.entries.find((entry) => entry.id === selectedId);

  const exportEntries = () => {
    const payload = JSON.stringify(entries, null, 2);
    if (typeof URL.createObjectURL !== 'function') {
      setExportFeedback('当前环境不支持下载，请手动复制审计记录。');
      return;
    }
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'english-room-audit-events.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setExportFeedback('已导出当前筛选的审计记录。');
  };

  return <OpsQueryStatus loading={loading} error={error} loadingLabel="加载审计日志…" onRetry={retry}>{data ? <div className="page-stack">
    <header className="page-header"><div><p className="eyebrow">English Room / Governance</p><h1 className="page-title">审计日志</h1><p className="page-subtitle">记录所有管理员查询与写操作</p></div><div className="page-actions"><label className="search-control"><Icon name="search" size={18} /><input name="audit-search" aria-label="搜索管理员、操作或资源" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索管理员、操作或资源" /></label><button type="button" className="btn btn-secondary" onClick={exportEntries}><Icon name="download" size={16} /> 导出记录</button></div></header>
    {data.dataSource === 'demo' ? <p className="data-source-note">数据来源：演示数据（Mock 适配器）</p> : null}
    <section className="metric-grid metric-grid--four"><MetricCard label="今日操作" value={formatCount(data.entries.length)} delta={data.dataSource === 'demo' ? '+18.6% ↑' : undefined} icon="chart" values={data.dataSource === 'demo' ? [5, 6, 5, 7, 6, 8, 7] : undefined} /><MetricCard label="写操作" value={formatCount(data.entries.filter((entry) => entry.action.includes('retry') || entry.action.includes('write')).length)} delta={data.dataSource === 'demo' ? '+12.5% ↑' : undefined} icon="list" values={data.dataSource === 'demo' ? [3, 4, 3, 5, 4, 6, 5] : undefined} /><MetricCard label="失败请求" value={formatCount(data.entries.filter((entry) => entry.result === 'failure').length)} delta={data.dataSource === 'demo' ? '-18.2% ↓' : undefined} tone="coral" icon="alert" values={data.dataSource === 'demo' ? [5, 4, 5, 3, 4, 2, 3] : undefined} /><MetricCard label="高风险操作" value={formatCount(data.entries.filter((entry) => entry.risk === 'high').length)} delta={data.dataSource === 'demo' ? '需要关注' : undefined} tone="amber" icon="shield" values={data.dataSource === 'demo' ? [2, 3, 2, 4, 3, 4, 5] : undefined} /></section>
    {exportFeedback ? <p role="status" className="retry-feedback">{exportFeedback}</p> : null}
    <Panel title="操作记录" action={<div className="filter-row"><select aria-label="动作筛选" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}><option value="all">全部操作</option>{actions.map((action) => <option key={action} value={action}>{action}</option>)}</select><select aria-label="结果筛选" value={resultFilter} onChange={(event) => setResultFilter(event.target.value)}><option value="all">全部结果</option><option value="success">成功</option><option value="failure">失败</option><option value="unknown">未知</option></select></div>}><AuditTable entries={entries} onSelect={setSelectedId} /></Panel>
    <div className="content-grid content-grid--audit"><Panel title="操作类型分布"><OperationBars entries={entries} /></Panel><Panel title="最近高风险操作"><RiskList entries={entries.filter((entry) => entry.risk === 'high')} /></Panel></div>
    {selected ? <AuditDrawer entry={selected} onClose={() => setSelectedId(null)} /> : null}
  </div> : null}</OpsQueryStatus>;
}

function AuditTable({ entries, onSelect }: { entries: AuditLogEntry[]; onSelect: (id: string) => void }) {
  if (!entries.length) return <EmptyState title="暂无审计事件" description="管理员查询和写操作会安全地记录在这里。" />;
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>时间</th><th>管理员</th><th>操作</th><th>资源</th><th>结果</th><th>请求 ID</th><th>详情</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td>{entry.occurredAt}</td><td>{entry.actor}</td><td>{entry.action}</td><td>{entry.target}</td><td><StatusBadge tone={entry.result === 'failure' ? 'coral' : entry.result === 'unknown' ? 'neutral' : 'mint'}>{entry.result === 'failure' ? '失败' : entry.result === 'unknown' ? '未知' : '成功'}</StatusBadge></td><td>{entry.requestId ?? '—'}</td><td><button type="button" className="icon-button" aria-label={`查看审计详情 ${entry.id}`} onClick={() => onSelect(entry.id)}><Icon name="search" size={17} /></button></td></tr>)}</tbody></table><div className="table-footer">共 {entries.length} 条 <span>&lt; 1 &gt;</span></div></div>;
}

function OperationBars({ entries }: { entries: AuditLogEntry[] }) {
  if (!entries.length) return <EmptyState title="暂无数据" />;
  const counts = entries.reduce<Record<string, number>>((acc, entry) => { const key = entry.action.split('.')[0] ?? '其他'; acc[key] = (acc[key] ?? 0) + 1; return acc; }, {});
  const max = Math.max(...Object.values(counts), 1);
  return <div className="operation-bars">{Object.entries(counts).slice(0, 6).map(([label, value]) => <div key={label}><span>{label}</span><i style={{ height: `${value / max * 100}%` }} /><strong>{value}</strong></div>)}</div>;
}

function RiskList({ entries }: { entries: AuditLogEntry[] }) {
  if (!entries.length) return <EmptyState title="暂无高风险操作" description="当前没有标记为高风险的操作。" />;
  return <div className="risk-list">{entries.slice(0, 5).map((entry) => <div key={entry.id}><Icon name="alert" size={18} /><span>{entry.occurredAt}<strong>{entry.action}</strong><small>{entry.actor}</small></span><StatusBadge tone="coral">高风险</StatusBadge></div>)}</div>;
}

function AuditDrawer({ entry, onClose }: { entry: AuditLogEntry; onClose: () => void }) {
  const isUnknown = entry.result === 'unknown';
  return <Drawer title="操作详情" onClose={onClose}><dl className="detail-list"><div><dt>操作者</dt><dd>{entry.actor}</dd></div><div><dt>动作</dt><dd>{entry.action}</dd></div><div><dt>资源</dt><dd>{entry.target}</dd></div><div><dt>请求 ID</dt><dd>{entry.requestId ?? '—'}</dd></div><div><dt>幂等键</dt><dd>已脱敏</dd></div></dl><div className="drawer-section"><h3>变更摘要</h3><p className="detail-copy">{entry.details ? '已记录结构化变更详情。' : '本次操作没有可展示的字段变更。'}</p>{entry.details ? <pre className="safe-json">{JSON.stringify(entry.details, null, 2)}</pre> : null}</div><div className="drawer-section"><h3>变更对比</h3><div className="before-after"><span>Before</span><span>After</span><strong>{entry.result === 'failure' ? '失败' : isUnknown ? '未知' : '已完成'}</strong><strong>{entry.result === 'failure' ? '未变更' : isUnknown ? '未知' : '已记录'}</strong></div></div><p className="privacy-note"><Icon name="shield" size={18} /> 敏感字段已脱敏</p></Drawer>;
}
