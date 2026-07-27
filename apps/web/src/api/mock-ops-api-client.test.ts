import { describe, expect, it } from 'vitest';

import { MockOpsApiClient } from './mock-ops-api-client';

describe('MockOpsApiClient', () => {
  it('returns overview metrics from mock-ops-data with DAU and retention fields', async () => {
    const client = new MockOpsApiClient();
    const metrics = await client.getOverviewMetrics();

    expect(metrics.dau).toBeGreaterThan(0);
    expect(metrics.d1RetentionRate).toBeGreaterThan(0);
    expect(metrics.d7RetentionRate).toBeGreaterThan(0);
    expect(metrics.roomConversionRate).toBeGreaterThan(0);
    expect(metrics.scoringCompletionRate).toBeGreaterThan(0);
    expect(metrics.dataSource).toBe('demo');
  });
});
