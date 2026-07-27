import { describe, expect, it } from 'vitest';

import { formatDataSourceLead } from './data-source-label';

describe('formatDataSourceLead', () => {
  it('labels demo vs backend vs placeholder', () => {
    expect(formatDataSourceLead('demo')).toContain('Mock');
    expect(formatDataSourceLead('backend')).toContain('后端响应');
    expect(formatDataSourceLead('placeholder')).toContain('占位');
  });
});
