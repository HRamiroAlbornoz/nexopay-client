import { afterEach, beforeEach, vi } from 'vitest';

// Asegurarse de que `fetch` esté disponible como un stub antes de cada test
beforeEach(() => {
  if (!globalThis.fetch) {
    // @ts-ignore
    globalThis.fetch = vi.fn();
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});
