export function formatPercent(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatCount(value: number) {
  return value.toLocaleString('en-US');
}

export function formatOptionalCount(value?: number) {
  return value === undefined ? '暂无数据' : formatCount(value);
}

export function formatOptionalPercent(value?: number, digits = 1) {
  return value === undefined ? '暂无数据' : formatPercent(value, digits);
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '刚刚' : date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}
