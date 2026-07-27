/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockStabilitySummary } from '../data/mock-ops-data';
import { StabilityPage } from './StabilityPage';

const getStabilitySummary = vi.fn();

vi.mock('../api', () => ({
  opsApiClient: {
    getStabilitySummary: (...args: unknown[]) => getStabilitySummary(...args),
  },
}));

describe('StabilityPage', () => {
  afterEach(() => {
    getStabilitySummary.mockReset();
  });

  it('shows loading then stability data', async () => {
    getStabilitySummary.mockResolvedValue(mockStabilitySummary);

    render(<StabilityPage />);

    expect(screen.getByText('加载稳定性数据…')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: '稳定性中心' })).toBeTruthy();
    });
  });

  it('surfaces HTTP errors with retry instead of infinite loading', async () => {
    getStabilitySummary.mockRejectedValue(new Error('GET failed'));

    render(<StabilityPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('GET failed');
    });
    expect(screen.queryByText('加载稳定性数据…')).toBeNull();
  });
});
