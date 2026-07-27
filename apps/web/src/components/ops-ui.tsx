import type { ReactNode } from 'react';

export type IconName = 'grid' | 'shield' | 'home' | 'star' | 'list' | 'calendar' | 'server' | 'user' | 'users' | 'check' | 'alert' | 'play' | 'clock' | 'chart' | 'download' | 'close' | 'search';

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    shield: <path d="M12 3 20 6v5c0 5.2-3.4 8.5-8 10-4.6-1.5-8-4.8-8-10V6l8-3Zm-3 9 2 2 4-4" />,
    home: <path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    list: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
    server: <><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.6-4 3.3-6 8-6s7.4 2 8 6" /></>,
    users: <><circle cx="9" cy="8" r="3.5" /><circle cx="17" cy="9" r="3" /><path d="M2.5 20c.6-3.6 2.8-5.5 6.5-5.5s5.8 1.9 6.5 5.5M15 15c3.2-.1 5 1.5 5.5 4" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5M12 17h.01" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    chart: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 4-6" /></>,
    download: <><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></>,
    close: <path d="m5 5 14 14M19 5 5 19" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function MiniSparkline({ values, tone = 'mint' }: { values?: number[]; tone?: 'mint' | 'coral' | 'amber' }) {
  const points = values?.length ? values : [4, 5, 4, 6, 5, 7, 6];
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const coords = points.map((value, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * 100;
    const y = 24 - ((value - min) / Math.max(max - min, 1)) * 18 - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return <svg className={`mini-sparkline mini-sparkline--${tone}`} viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label="趋势图"><polyline points={coords.join(' ')} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg>;
}

export function TrendChart({ values, label, emptyLabel = '暂无趋势数据' }: { values: Array<{ label: string; count: number }>; label: string; emptyLabel?: string }) {
  if (!values.length) return <div className="chart-empty">{emptyLabel}</div>;
  const max = Math.max(...values.map((item) => item.count), 1);
  const coords = values.map((item, index) => `${(index / Math.max(values.length - 1, 1)) * 100},${92 - (item.count / max) * 72}`);
  const summary = values.map((item) => `${item.label} ${item.count}`).join('，');
  return <div className="trend-chart">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${label}：${summary}`}>
      <defs><linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#58a985" stopOpacity=".28" /><stop offset="1" stopColor="#58a985" stopOpacity="0" /></linearGradient></defs>
      {[20, 44, 68, 92].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} className="chart-gridline" />)}
      <polygon points={`0,92 ${coords.join(' ')} 100,92`} fill="url(#trend-fill)" />
      <polyline points={coords.join(' ')} fill="none" stroke="#16785a" strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      {coords.map((point) => { const [x, y] = point.split(','); return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="white" stroke="#16785a" strokeWidth="1" vectorEffect="non-scaling-stroke" />; })}
    </svg>
    <div className="chart-axis"><span>{values[0]?.label}</span><span>{values[Math.floor(values.length / 2)]?.label}</span><span>{values.at(-1)?.label}</span></div>
  </div>;
}

export function MetricCard({ label, value, delta, icon = 'chart', tone = 'mint', values }: { label: string; value: string; delta?: string; icon?: IconName; tone?: 'mint' | 'coral' | 'amber'; values?: number[] }) {
  return <article className="metric-card metric-card--designed">
    <div className="metric-card__top"><span className={`metric-icon metric-icon--${tone}`}><Icon name={icon} size={21} /></span><span className="metric-card__label">{label}</span></div>
    <strong className="metric-card__value">{value}</strong>
    {delta ? <span className={`metric-card__delta ${delta.startsWith('-') ? 'is-negative' : ''}`}>{delta}</span> : null}
    <MiniSparkline values={values} tone={tone} />
  </article>;
}

export function Panel({ title, children, className = '', action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return <section className={`panel panel--designed ${className}`.trim()}><div className="panel__heading"><h2>{title}</h2>{action}</div>{children}</section>;
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="empty-state"><span className="empty-state__icon"><Icon name="list" size={24} /></span><strong>{title}</strong>{description ? <p>{description}</p> : null}</div>;
}

export function StatusBadge({ children, tone = 'mint' }: { children: ReactNode; tone?: 'mint' | 'amber' | 'coral' | 'blue' | 'neutral' }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function DateRangeControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="date-control"><Icon name="calendar" size={18} /><select name="date-range" aria-label="日期范围" value={value} onChange={(event) => onChange(event.target.value)}><option value="7">过去 7 天</option><option value="30">过去 30 天</option><option value="90">过去 90 天</option></select></label>;
}

export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <><button type="button" className="drawer-scrim" aria-label="关闭详情" onClick={onClose} /><aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={title}><div className="drawer-header"><h2>{title}</h2><button type="button" className="icon-button" aria-label="关闭详情" onClick={onClose}><Icon name="close" /></button></div>{children}</aside></>;
}
