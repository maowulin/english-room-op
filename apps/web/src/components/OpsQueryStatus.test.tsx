/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OpsQueryStatus } from './OpsQueryStatus';

describe('OpsQueryStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading label while loading', () => {
    render(
      <OpsQueryStatus loading loadingLabel="加载中…" error={null} onRetry={() => {}}>
        <p>content</p>
      </OpsQueryStatus>,
    );
    expect(screen.getByText('加载中…')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('content')).toBeNull();
  });

  it('shows role=alert and retry on error', () => {
    const onRetry = vi.fn();
    render(
      <OpsQueryStatus loading={false} loadingLabel="加载中…" error="网络错误" onRetry={onRetry}>
        <p>content</p>
      </OpsQueryStatus>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('网络错误');
    fireEvent.click(screen.getByRole('button', { name: '重试' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
