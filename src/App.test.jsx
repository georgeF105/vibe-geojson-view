import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock MapLibre to avoid requiring map capabilities in tests
vi.mock('maplibre-gl', () => ({
  default: {
    Map: class {
      constructor() {}
      getStyle() { return { sources: {} }; }
      addSource() {}
      addLayer() {}
      getSource() {}
      getLayer() {}
      removeLayer() {}
      removeSource() {}
      fitBounds() {}
    },
    LngLatBounds: class {
      extend() {}
      isEmpty() { return true; }
    },
  }
}));

import App from './App.jsx';

describe('App', () => {
  it('shows the Clear Map button', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /clear map/i });
    expect(button).toBeInTheDocument();
  });
});
