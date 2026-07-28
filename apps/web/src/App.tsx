import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { clearOpsRuntimeAuth, opsApiClient, restoreOpsRuntimeAuth } from './api';
import { AppLayout } from './components/AppLayout';
import { isOpsDemoMode } from './config/ops-api-mode';
import { AuditPage } from './pages/AuditPage';
import { OverviewPage } from './pages/OverviewPage';
import { RoomsPage } from './pages/RoomsPage';
import { ScoringPage } from './pages/ScoringPage';
import { StabilityPage } from './pages/StabilityPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

export default function App() {
  const demoMode = isOpsDemoMode();
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'anonymous'>(demoMode ? 'authenticated' : 'checking');

  useEffect(() => {
    if (demoMode) return;
    restoreOpsRuntimeAuth();
    opsApiClient.getCurrentAdmin().then(() => setAuthState('authenticated')).catch(() => setAuthState('anonymous'));
  }, [demoMode]);

  if (authState === 'checking') return <main className="auth-shell"><p>正在检查登录状态…</p></main>;
  if (authState === 'anonymous') return <AdminLoginPage onAuthenticated={() => setAuthState('authenticated')} />;

  async function logout() {
    await opsApiClient.logout().catch(() => undefined);
    clearOpsRuntimeAuth();
    setAuthState('anonymous');
  }

  return (
    <Routes>
      <Route element={<AppLayout onLogout={logout} />}>
        <Route index element={<OverviewPage />} />
        <Route path="stability" element={<StabilityPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="scoring" element={<ScoringPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
