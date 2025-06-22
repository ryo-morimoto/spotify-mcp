import { describe, it, expect } from 'vitest';
import * as routesModule from './index.ts';

describe('Routes Module Exports', () => {
  it('should export oauthRoutes', () => {
    expect(routesModule.oauthRoutes).toBeDefined();
    expect(routesModule.oauthRoutes.constructor.name).toBe('Hono');
  });

  it('should export healthRoutes', () => {
    expect(routesModule.healthRoutes).toBeDefined();
    expect(routesModule.healthRoutes.constructor.name).toBe('Hono');
  });

  it('should export mcpRoutes', () => {
    expect(routesModule.mcpRoutes).toBeDefined();
    expect(routesModule.mcpRoutes.constructor.name).toBe('Hono');
  });

  it('should have all expected exports', () => {
    const exports = Object.keys(routesModule);
    
    expect(exports).toContain('oauthRoutes');
    expect(exports).toContain('healthRoutes');
    expect(exports).toContain('mcpRoutes');
    expect(exports).toHaveLength(3);
  });
});