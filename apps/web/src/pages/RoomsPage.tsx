import { useMemo, useState } from 'react';

import { opsApiClient } from '../api';
import { OpsQueryStatus } from '../components/OpsQueryStatus';
import { Drawer, EmptyState, Icon, MetricCard, Panel, StatusBadge } from '../components/ops-ui';
import type { RoomSnapshot } from '../api/types';
import { useOpsQuery } from '../hooks/useOpsQuery';
import { formatCount } from '../utils/formatters';

const statusLabels: Record<RoomSnapshot['status'], string> = { waiting: '等待中', active: '进行中', closing: '收尾中', ended: '已结束' };

export function RoomsPage() {
  const { data, error, loading, retry } = useOpsQuery(() => opsApiClient.listRooms(), []);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rooms = useMemo(() => data?.rooms.filter((room) => `${room.id} ${room.name}`.toLowerCase().includes(search.toLowerCase())) ?? [], [data?.rooms, search]);
  const selectedRoom = data?.rooms.find((room) => room.id === selectedId);

  return <OpsQueryStatus loading={loading} error={error} loadingLabel="加载房间列表…" onRetry={retry}>{data ? <div className="page-stack">
    <header className="page-header"><div><p className="eyebrow">English Room / Live rooms</p><h1 className="page-title">房间监控</h1><p className="page-subtitle">实时查看房间、成员和媒体链路</p></div><div className="page-actions"><label className="search-control"><Icon name="search" size={18} /><input name="room-search" aria-label="搜索房间号或玩家" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索房间号或玩家" /></label><span className="environment-chip"><Icon name="server" size={16} /> Production</span><span className="updated-label">实时更新</span></div></header>
    {data.dataSource === 'demo' ? <p className="data-source-note">数据来源：演示数据（Mock 适配器）</p> : null}
    <section className="metric-grid metric-grid--four"><MetricCard label="进行中" value={formatCount(data.rooms.filter((room) => room.status === 'active').length)} icon="play" values={[4, 3, 5, 4, 6, 5, 7]} /><MetricCard label="等待中" value={formatCount(data.rooms.filter((room) => room.status === 'waiting').length)} icon="clock" tone="amber" values={[2, 2, 3, 2, 4, 3, 3]} /><MetricCard label="今日完成" value={formatCount(data.rooms.filter((room) => room.status === 'ended').length)} icon="check" values={[4, 5, 4, 6, 5, 7, 6]} /><MetricCard label="异常房间" value={formatCount(data.rooms.filter((room) => room.status === 'closing' || room.recordingStatus === 'failed').length)} icon="alert" tone="coral" values={[2, 3, 2, 4, 3, 2, 3]} /></section>
    <Panel title="实时房间"><RoomsTable rooms={rooms} onSelect={setSelectedId} /></Panel>
    {selectedRoom ? <RoomDrawer room={selectedRoom} onClose={() => setSelectedId(null)} /> : null}
  </div> : null}</OpsQueryStatus>;
}

function RoomsTable({ rooms, onSelect }: { rooms: RoomSnapshot[]; onSelect: (id: string) => void }) {
  if (!rooms.length) return <EmptyState title="暂无活跃房间" description="App 还没有上报房间事件" />;
  return <div className="table-wrap"><table className="data-table data-table--rooms"><thead><tr><th>房间</th><th>剧本</th><th>房主</th><th>成员</th><th>阶段</th><th>时长</th><th>TRTC</th><th>评分</th><th>操作</th></tr></thead><tbody>{rooms.map((room) => <tr key={room.id} className={room.status === 'active' ? 'is-highlighted' : ''}><td><strong>{room.id}</strong><small>{room.name}</small></td><td>{room.name}</td><td>{room.ownerLabel ?? '—'}</td><td>{room.memberCount}</td><td><StatusBadge tone={room.status === 'waiting' ? 'amber' : room.status === 'closing' ? 'coral' : room.status === 'ended' ? 'neutral' : 'mint'}>{statusLabels[room.status]}</StatusBadge></td><td>{room.durationSeconds ? `${Math.floor(room.durationSeconds / 60)}:${String(room.durationSeconds % 60).padStart(2, '0')}` : '—'}</td><td><StatusBadge tone={room.trtcStatus === '正常' ? 'mint' : 'neutral'}>{room.trtcStatus ?? '—'}</StatusBadge></td><td>{room.scoringStatus ?? '—'}</td><td><button type="button" className="text-button" onClick={() => onSelect(room.id)}>查看</button></td></tr>)}</tbody></table><div className="table-footer">共 {rooms.length} 条 <span>&lt; 1 &gt;</span></div></div>;
}

function RoomDrawer({ room, onClose }: { room: RoomSnapshot; onClose: () => void }) {
  return <Drawer title="房间详情" onClose={onClose}><div className="drawer-room-title"><strong>{room.id}</strong><StatusBadge tone="mint">{statusLabels[room.status]}</StatusBadge></div><p className="drawer-muted">{room.name} · {room.ownerLabel ?? '房主未上报'}</p><div className="drawer-section"><h3>成员（{room.members?.length ?? room.memberCount}）</h3>{room.members?.length ? room.members.map((member) => <div className="member-row" key={member.id}><span className="profile__avatar profile__avatar--small">{member.label.slice(-1)}</span><span>{member.label}{member.role ? <small>{member.role}</small> : null}</span><span className="member-state">{member.speaking ? '正在说话' : member.muted ? '静音' : member.network ?? '在线'}</span></div>) : <p className="drawer-muted">成员明细暂未上报。</p>}</div><div className="drawer-section"><h3>媒体状态</h3><dl className="detail-list"><div><dt>TRTC</dt><dd>{room.trtcStatus ?? '暂无数据'}</dd></div><div><dt>录制</dt><dd>{room.recordingStatus}</dd></div><div><dt>评分</dt><dd>{room.scoringStatus ?? '暂无数据'}</dd></div></dl></div><div className="drawer-section"><h3>房间生命周期</h3>{room.lifecycle?.length ? <div className="lifecycle">{room.lifecycle.map((event) => <div key={`${event.state}-${event.occurredAt}`}><span className="lifecycle__dot" /><span>{event.label}</span><small>{event.occurredAt ?? '—'}</small></div>)}</div> : <p className="drawer-muted">暂无生命周期事件。</p>}</div></Drawer>;
}
