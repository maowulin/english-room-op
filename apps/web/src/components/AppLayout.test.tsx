/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppLayout } from './AppLayout';

vi.mock('../config/ops-api-mode', () => ({ isOpsHttpMode: () => true }));

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('AppLayout mobile navigation', () => {
  afterEach(cleanup);

  it('shows the current page title and returns to overview', () => {
    render(
      <MemoryRouter initialEntries={['/rooms']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LocationProbe />} />
            <Route path="/rooms" element={<LocationProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('房间');
    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });

  it('disables the back button on overview', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}><Route path="/" element={<LocationProbe />} /></Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: '返回' })).toBeDisabled();
  });
});
