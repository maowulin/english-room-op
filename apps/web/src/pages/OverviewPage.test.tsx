/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockOverviewMetrics } from '../data/mock-ops-data';
import { OverviewPage } from './OverviewPage';

const getOverviewMetrics = vi.fn();

vi.mock('../api', () => ({
  opsApiClient: {
    getOverviewMetrics: (...args: unknown[]) => getOverviewMetrics(...args),
  },
}));

describe('OverviewPage', () => {
  afterEach(() => {
    getOverviewMetrics.mockReset();
  });

  it('renders metrics with demo dataSource label', async () => {
    getOverviewMetrics.mockResolvedValue(mockOverviewMetrics);

    render(<OverviewPage />);

    expect(screen.getByText('加载总览指标…')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/演示数据/)).toBeTruthy();
    });
    expect(screen.getByText('1,284')).toBeTruthy();
  });

  it('shows alert and retry when load fails', async () => {
    getOverviewMetrics
      .mockRejectedValueOnce(new Error('forbidden'))
      .mockResolvedValueOnce(mockOverviewMetrics);

    render(<OverviewPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('接口暂不可用');
    });

    screen.getByRole('button', { name: '重试' }).click();

    await waitFor(() => {
      expect(screen.getByText(/演示数据/)).toBeTruthy();
    });
    expect(getOverviewMetrics).toHaveBeenCalledTimes(2);
  });
});
