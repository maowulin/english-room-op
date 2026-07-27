import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { opsApiClient } from '../api';
import { formatDataSourceLead } from '../utils/data-source-label';

export function RoomsPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.listRooms(), []);

  return (
    <OpsQueryStatus loading={loading} error={error} loadingLabel="加载房间列表…" onRetry={retry}>
      {data ? (
        <>
          <h1 className="page-title">房间监控</h1>
          <p className="page-lead">{formatDataSourceLead(data.dataSource)}</p>
          <table className="data-table">
            <caption className="sr-only">房间状态列表</caption>
            <thead>
              <tr>
                <th scope="col">房间</th>
                <th scope="col">状态</th>
                <th scope="col">成员数</th>
                <th scope="col">录音状态</th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>
                    <span className="status-pill">{room.status}</span>
                  </td>
                  <td>{room.memberCount}</td>
                  <td>{room.recordingStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </OpsQueryStatus>
  );
}
