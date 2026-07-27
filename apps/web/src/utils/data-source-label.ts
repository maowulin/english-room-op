import type { OpsDataSource } from '../api/types';

const LABELS: Record<OpsDataSource, string> = {
  demo: '演示数据（Mock 适配器）',
  backend: 'FastAPI /admin/v1（后端响应）',
  placeholder: 'FastAPI /admin/v1（占位/部分字段）',
};

export function formatDataSourceLead(dataSource: OpsDataSource): string {
  return `数据来源：${LABELS[dataSource]}`;
}
