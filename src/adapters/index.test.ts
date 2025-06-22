import { describe, it, expect } from 'vitest';
import * as adaptersModule from './index.ts';

describe('Adapters Module Exports', () => {
  it('should export createTokenProviderAdapter', () => {
    expect(adaptersModule.createTokenProviderAdapter).toBeDefined();
    expect(typeof adaptersModule.createTokenProviderAdapter).toBe('function');
  });

  it('should have all expected exports', () => {
    const exports = Object.keys(adaptersModule);

    expect(exports).toContain('createTokenProviderAdapter');
    expect(exports).toHaveLength(1);
  });
});
