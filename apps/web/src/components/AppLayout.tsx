import { NavLink, Outlet } from 'react-router-dom';

import { isOpsHttpMode } from '../config/ops-api-mode';
import { mockOverviewMetrics } from '../data/mock-ops-data';
import { DemoDataBanner } from './DemoDataBanner';
import { Icon, type IconName } from './ops-ui';

const navItems: Array<{ to: string; label: string; icon: IconName; end: boolean }> = [
  { to: '/', label: '总览', icon: 'grid', end: true },
  { to: '/stability', label: '稳定性', icon: 'shield', end: false },
  { to: '/rooms', label: '房间', icon: 'home', end: false },
  { to: '/scoring', label: '评分任务', icon: 'star', end: false },
  { to: '/audit', label: '审计日志', icon: 'list', end: false },
];

function NavItems({ mobile = false }: { mobile?: boolean }) {
  return <>{navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className="nav-link">
    <Icon name={item.icon} size={mobile ? 22 : 20} /><span>{item.label}</span>
  </NavLink>)}</>;
}

export function AppLayout() {
  const showDemoBanner = !isOpsHttpMode();

  return <div className="app-shell">
    {showDemoBanner ? <DemoDataBanner disclaimer={mockOverviewMetrics.disclaimer} generatedAt={mockOverviewMetrics.generatedAt} /> : null}
    <aside className="sidebar" aria-label="主导航">
      <div className="brand"><span className="brand__mark">✦</span><span><strong>English Room</strong><small>运营台</small></span></div>
      <nav className="sidebar__nav"><NavItems /></nav>
      <div className="sidebar__footer"><div className="profile"><span className="profile__avatar">林</span><span><strong>林舟 · 管理员</strong><small>已认证</small></span><span className="profile__chevron">⌄</span></div><button type="button" className="logout-button">↪ <span>退出登录</span></button></div>
    </aside>
    <header className="mobile-topbar"><button type="button" className="icon-button" aria-label="返回">‹</button><div className="brand brand--mobile"><span className="brand__mark">✦</span><strong>运营总览</strong></div><span className="auth-chip"><Icon name="shield" size={15} /> 管理员已认证</span></header>
    <main className="app-main" id="main-content"><Outlet /></main>
    <nav className="bottom-nav" aria-label="移动端导航"><NavItems mobile /></nav>
  </div>;
}
