import { NavLink, Outlet } from 'react-router-dom';

import { mockOverviewMetrics } from '../data/mock-ops-data';
import { isOpsHttpMode } from '../config/ops-api-mode';
import { DemoDataBanner } from './DemoDataBanner';

const navItems = [
  { to: '/', label: '总览', end: true },
  { to: '/stability', label: '稳定性', end: false },
  { to: '/rooms', label: '房间', end: false },
  { to: '/scoring', label: '评分', end: false },
  { to: '/audit', label: '审计', end: false },
] as const;

function NavItems({ className }: { className: string }) {
  return (
    <>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={`nav-link ${className}`.trim()}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export function AppLayout() {
  const showDemoBanner = !isOpsHttpMode();

  return (
    <div className="app-shell">
      {showDemoBanner ? (
        <DemoDataBanner
          disclaimer={mockOverviewMetrics.disclaimer}
          generatedAt={mockOverviewMetrics.generatedAt}
        />
      ) : null}
      <aside className="sidebar" aria-label="主导航">
        <div className="sidebar__brand">English Room Ops</div>
        <nav>
          <NavItems className="" />
        </nav>
      </aside>
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <nav className="bottom-nav" aria-label="移动端导航">
        <NavItems className="" />
      </nav>
    </div>
  );
}
