import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { mcpRoutes } from './mcp.ts';
import type { TokenStorage } from '../types/index.ts';
import { ok, err } from 'neverthrow';

// Mock dependencies
vi.mock('../mcp/index.ts', () => ({
  createMcpServer: vi.fn(),
}));

vi.mock('../adapters/index.ts', () => ({
  createTokenManagerAdapter: vi.fn(),
}));

vi.mock('../middleware/index.ts', () => ({
  requireAuth: vi.fn((_c: any, next: any) => next()),
}));

describe('MCP JSON-RPC Route', () => {
  let app: Hono;
  let mockTokenStorage: TokenStorage;
  let mockMcpServer: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    app = new Hono();
    
    // Mock token storage
    mockTokenStorage = {
      get: vi.fn().mockResolvedValue(ok(null)),
      store: vi.fn().mockResolvedValue(ok(undefined)),
      refresh: vi.fn().mockResolvedValue(ok(null)),
      clear: vi.fn().mockResolvedValue(ok(undefined)),
      getValidToken: vi.fn().mockResolvedValue(ok('mock-token')),
    };

    // Mock MCP server
    mockMcpServer = {
      listTools: vi.fn().mockReturnValue([
        { name: 'search', description: 'Search for tracks' },
        { name: 'player_state', description: 'Get player state' },
      ]),
      callTool: vi.fn().mockResolvedValue(ok({ 
        content: [{ type: 'text', text: 'Tool result' }] 
      })),
    };

    // Set up mocks
    const { createMcpServer } = await import('../mcp/index.ts');
    const { createTokenManagerAdapter } = await import('../adapters/index.ts');
    
    vi.mocked(createMcpServer).mockReturnValue(mockMcpServer);
    vi.mocked(createTokenManagerAdapter).mockReturnValue({
      getAccessToken: vi.fn(),
      refreshTokenIfNeeded: vi.fn(),
    });

    // Set context
    app.use('*', async (c, next) => {
      c.set('tokenStorage', mockTokenStorage);
      c.set('userId', 'test-user');
      c.set('authenticated', true);
      await next();
    });

    app.route('/', mcpRoutes);
  });

  describe('POST /mcp', () => {
    it('should handle initialize request', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'initialize',
          params: {
            clientInfo: { name: 'test', version: '1.0' },
          },
          id: '1',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        jsonrpc: '2.0',
        result: {
          serverInfo: {
            name: 'spotify-mcp-server',
            version: '0.2.0',
          },
          capabilities: {
            tools: true,
            resources: false,
            prompts: false,
          },
        },
        id: '1',
      });
    });

    it('should handle tools/list request', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: '2',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.jsonrpc).toBe('2.0');
      expect(body.result.tools).toHaveLength(2);
      expect(body.result.tools[0]).toEqual({
        name: 'search',
        description: 'Search for tracks',
        inputSchema: { type: 'object', properties: {} },
      });
    });

    it('should handle tools/invoke request', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/invoke',
          params: {
            name: 'search',
            arguments: { query: 'test' },
          },
          id: '3',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        jsonrpc: '2.0',
        result: {
          content: [{ type: 'text', text: 'Tool result' }],
        },
        id: '3',
      });
      expect(mockMcpServer.callTool).toHaveBeenCalledWith('search', { query: 'test' });
    });

    it('should handle batch requests', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([
          {
            jsonrpc: '2.0',
            method: 'tools/list',
            id: '1',
          },
          {
            jsonrpc: '2.0',
            method: 'shutdown',
            id: '2',
          },
        ]),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any[];
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('1');
      expect(body[1].id).toBe('2');
    });

    it('should handle notifications (no response)', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/list',
          // No id = notification
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      // Single notification returns empty object
      expect(body).toEqual({});
    });

    it('should return parse error for invalid JSON', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.error).toEqual({
        code: -32700,
        message: 'Invalid JSON',
      });
    });

    it('should return invalid request error for malformed request', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing jsonrpc field
          method: 'test',
          id: '1',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.error.code).toBe(-32600);
      expect(body.error.message).toBe('Invalid JSON-RPC request');
    });

    it('should return method not found error', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'unknown/method',
          id: '1',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.error).toEqual({
        code: -32601,
        message: "Method 'unknown/method' not found",
      });
    });

    it('should handle tool invocation errors', async () => {
      mockMcpServer.callTool.mockResolvedValueOnce(
        err({ code: 'TOOL_ERROR', message: 'Tool failed' })
      );

      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/invoke',
          params: {
            name: 'search',
            arguments: { query: 'test' },
          },
          id: '1',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.error.code).toBe(-32603);
      expect(body.error.message).toContain('Internal error');
    });

    it('should handle missing tool name', async () => {
      const response = await app.request('/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'tools/invoke',
          params: {}, // Missing name
          id: '1',
        }),
      });

      expect(response.status).toBe(200);
      const body = await response.json() as any;
      expect(body.error.code).toBe(-32603);
    });
  });
});