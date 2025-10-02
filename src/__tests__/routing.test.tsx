import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';

const LazyProduction = React.lazy(() => import('../pages/Production'));

describe('lazy route loading', () => {
  it('renders fallback then target page', async () => {
    render(
      <React.Suspense fallback={<div data-testid='fallback'>loading...</div>}>
        <MemoryRouter initialEntries={['/production']}>
          <Routes>
            <Route path='/production' element={<LazyProduction />} />
          </Routes>
        </MemoryRouter>
      </React.Suspense>
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /Производство/ })
      ).toBeVisible()
    );
  });
});
