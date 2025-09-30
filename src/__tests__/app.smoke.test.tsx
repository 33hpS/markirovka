import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import App from '../App';

describe('App initial render', () => {
  it('renders root container', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });
});
