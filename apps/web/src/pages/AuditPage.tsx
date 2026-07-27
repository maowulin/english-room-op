import { useEffect, useState } from 'react';

import { opsApiClient } from '../api';
import type { AuditLogEntry } from '../api/types';

export function AuditPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    void opsApiClient.listAuditLog().then((res) => setEntries(res.entries));
  }, []);

  return (
    <>
      <h1 className="page-title">审计日志</h1>
      <p className="page-lead">管理员操作记录占位（未来对接 FastAPI 审计 API）</p>
      <table className="data-table">
        <caption className="sr-only">审计事件</caption>
        <thead>
          <tr>
            <th scope="col">时间</th>
            <th scope="col">操作者</th>
            <th scope="col">动作</th>
            <th scope="col">目标</th>
            <th scope="col">结果</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.occurredAt}</td>
              <td>{entry.actor}</td>
              <td>{entry.action}</td>
              <td>{entry.target}</td>
              <td>{entry.result}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
