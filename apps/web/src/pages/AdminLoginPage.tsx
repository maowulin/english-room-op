import { useState } from 'react';
import type { FormEvent } from 'react';

import { opsApiClient, setOpsRuntimeAuth } from '../api';

type AdminLoginPageProps = { onAuthenticated: () => void };

export function AdminLoginPage({ onAuthenticated }: AdminLoginPageProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const session = await opsApiClient.login(username.trim(), password);
      setOpsRuntimeAuth({
        authorization: `${session.tokenType} ${session.accessToken}`,
        adminRole: session.role,
        expiresAt: session.expiresAt * 1000,
      });
      onAuthenticated();
    } catch {
      setError('用户名或密码错误，或运营服务暂不可用。');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="admin-login-title">
        <div className="brand brand--auth"><span className="brand__mark">✦</span><span><strong>English Room</strong><small>运营台</small></span></div>
        <p className="eyebrow">Private operations</p>
        <h1 id="admin-login-title" className="page-title">管理员登录</h1>
        <p className="page-subtitle">登录后查看房间、评分、稳定性和审计数据。</p>
        <form className="auth-form" onSubmit={submit}>
          <label>用户名<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
          <label>密码<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error ? <p className="ops-query-error" role="alert">{error}</p> : null}
          <button className="btn" type="submit" disabled={submitting}>{submitting ? '登录中…' : '登录运营台'}</button>
        </form>
      </section>
    </main>
  );
}
