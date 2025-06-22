import { describe, it, expect } from 'vitest';
import * as middlewareModule from './index.ts';

describe('Middleware Module Exports', () => {
  it('should export auth middleware functions', () => {
    expect(middlewareModule.authMiddleware).toBeDefined();
    expect(middlewareModule.requireAuth).toBeDefined();
    expect(middlewareModule.optionalAuth).toBeDefined();
    expect(middlewareModule.requireScopes).toBeDefined();
    
    expect(typeof middlewareModule.authMiddleware).toBe('function');
    expect(typeof middlewareModule.requireAuth).toBe('function');
    expect(typeof middlewareModule.optionalAuth).toBe('function');
    expect(typeof middlewareModule.requireScopes).toBe('function');
  });

  it('should export other middleware functions', () => {
    expect(middlewareModule.codeChallengeMiddleware).toBeDefined();
    expect(middlewareModule.configMiddleware).toBeDefined();
    expect(middlewareModule.createConfig).toBeDefined();
    expect(middlewareModule.errorHandler).toBeDefined();
    expect(middlewareModule.createLogger).toBeDefined();
    expect(middlewareModule.sessionMiddleware).toBeDefined();
    expect(middlewareModule.timingMiddleware).toBeDefined();
    
    expect(typeof middlewareModule.codeChallengeMiddleware).toBe('function');
    expect(typeof middlewareModule.configMiddleware).toBe('function');
    expect(typeof middlewareModule.createConfig).toBe('function');
    expect(typeof middlewareModule.errorHandler).toBe('function');
    expect(typeof middlewareModule.createLogger).toBe('function');
    expect(typeof middlewareModule.sessionMiddleware).toBe('function');
    expect(typeof middlewareModule.timingMiddleware).toBe('function');
  });

  it('should have all expected exports', () => {
    const exports = Object.keys(middlewareModule);
    
    // Auth middleware
    expect(exports).toContain('authMiddleware');
    expect(exports).toContain('requireAuth');
    expect(exports).toContain('optionalAuth');
    expect(exports).toContain('requireScopes');
    
    // Other middleware
    expect(exports).toContain('codeChallengeMiddleware');
    expect(exports).toContain('configMiddleware');
    expect(exports).toContain('createConfig');
    expect(exports).toContain('errorHandler');
    expect(exports).toContain('createLogger');
    expect(exports).toContain('sessionMiddleware');
    expect(exports).toContain('timingMiddleware');
  });
});