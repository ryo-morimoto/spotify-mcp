import { describe, it, expect } from 'vitest';
import * as mcpModule from './index.ts';

describe('MCP Module Exports', () => {
  it('should export createMcpServer', () => {
    expect(mcpModule.createMcpServer).toBeDefined();
    expect(typeof mcpModule.createMcpServer).toBe('function');
  });

  it('should export tool schemas and handlers', () => {
    // Tool schemas
    expect(mcpModule.searchSchema).toBeDefined();
    expect(mcpModule.playerControlSchema).toBeDefined();

    // Tool handlers
    expect(mcpModule.handleSearch).toBeDefined();
    expect(mcpModule.handlePlayerState).toBeDefined();
    expect(mcpModule.handlePlayerControl).toBeDefined();

    expect(typeof mcpModule.handleSearch).toBe('function');
    expect(typeof mcpModule.handlePlayerState).toBe('function');
    expect(typeof mcpModule.handlePlayerControl).toBe('function');
  });

  it('should have all expected exports', () => {
    const exports = Object.keys(mcpModule);

    // Core function
    expect(exports).toContain('createMcpServer');

    // Tool schemas
    expect(exports).toContain('searchSchema');
    expect(exports).toContain('playerControlSchema');

    // Tool handlers
    expect(exports).toContain('handleSearch');
    expect(exports).toContain('handlePlayerState');
    expect(exports).toContain('handlePlayerControl');
  });
});
