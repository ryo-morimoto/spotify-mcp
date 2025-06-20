import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMcpServer, type TokenManager } from './mcpServer.ts';
import * as spotifyApi from './spotifyApi.ts';
import { ok, err } from 'neverthrow';

vi.mock('./spotifyApi.ts');

describe('mcpServer', () => {
  let server: any;
  let mockTokenManager: TokenManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockTokenManager = {
      getAccessToken: vi.fn().mockResolvedValue(ok('mock-access-token')),
      refreshTokenIfNeeded: vi.fn().mockResolvedValue(ok('mock-access-token'))
    };
    
    server = createMcpServer(mockTokenManager);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('search tool', () => {
    it('should return track results', async () => {
      const mockTracks = [
        {
          id: '1',
          name: 'Test Track',
          artists: [{ name: 'Test Artist' }],
          album: { name: 'Test Album' },
          uri: 'spotify:track:1'
        }
      ];
      
      vi.mocked(spotifyApi.searchTracks).mockResolvedValueOnce(ok(mockTracks));
      
      const result = await server.callTool('search', { query: 'test song' });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content).toHaveLength(1);
        expect(result.value.content[0].type).toBe('text');
        if (result.value.content[0].type === 'text') {
          expect(result.value.content[0].text).toContain('Test Track');
          expect(result.value.content[0].text).toContain('Test Artist');
        }
      }
      
      expect(spotifyApi.searchTracks).toHaveBeenCalledWith('test song', 'mock-access-token', 10);
    });

    it('should handle search errors', async () => {
      vi.mocked(spotifyApi.searchTracks).mockResolvedValueOnce(
        err({
          type: 'NetworkError',
          message: 'Network request failed'
        })
      );
      
      const result = await server.callTool('search', { query: 'test song' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to search tracks');
      }
    });

    it('should validate search parameters', async () => {
      const result = await server.callTool('search', {});
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Missing required parameter: query');
      }
    });

    it('should handle custom limit parameter', async () => {
      vi.mocked(spotifyApi.searchTracks).mockResolvedValueOnce(ok([]));
      
      await server.callTool('search', { query: 'test', limit: 5 });
      
      expect(spotifyApi.searchTracks).toHaveBeenCalledWith('test', 'mock-access-token', 5);
    });
  });

  describe('player_state tool', () => {
    it('should return current state', async () => {
      const mockPlayerState = {
        is_playing: true,
        item: {
          id: '1',
          name: 'Current Track',
          artists: [{ name: 'Current Artist' }],
          album: { name: 'Current Album' },
          uri: 'spotify:track:1'
        },
        device: {
          id: 'device1',
          name: 'My Speaker',
          type: 'Speaker',
          volume_percent: 70
        },
        progress_ms: 30000,
        duration_ms: 180000
      };
      
      vi.mocked(spotifyApi.getCurrentPlayback).mockResolvedValueOnce(ok(mockPlayerState));
      
      const result = await server.callTool('player_state', {});
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content).toHaveLength(1);
        expect(result.value.content[0].type).toBe('text');
        if (result.value.content[0].type === 'text') {
          expect(result.value.content[0].text).toContain('Now Playing: Current Track');
          expect(result.value.content[0].text).toContain('Device: My Speaker');
          expect(result.value.content[0].text).toContain('Status: Playing');
        }
      }
    });

    it('should handle no active playback', async () => {
      vi.mocked(spotifyApi.getCurrentPlayback).mockResolvedValueOnce(ok(null));
      
      const result = await server.callTool('player_state', {});
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content[0].type).toBe('text');
        if (result.value.content[0].type === 'text') {
          expect(result.value.content[0].text).toBe('No active playback');
        }
      }
    });

    it('should handle playback errors', async () => {
      vi.mocked(spotifyApi.getCurrentPlayback).mockResolvedValueOnce(
        err({
          type: 'AuthError',
          message: 'Token expired',
          reason: 'expired'
        })
      );
      
      const result = await server.callTool('player_state', {});
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get player state');
      }
    });
  });

  describe('player_control tool', () => {
    it('should execute play command', async () => {
      vi.mocked(spotifyApi.controlPlayback).mockResolvedValueOnce(ok(undefined));
      
      const result = await server.callTool('player_control', { command: 'play' });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content[0].type).toBe('text');
        if (result.value.content[0].type === 'text') {
          expect(result.value.content[0].text).toBe('Playback command executed: play');
        }
      }
      
      expect(spotifyApi.controlPlayback).toHaveBeenCalledWith('play', 'mock-access-token');
    });

    it('should execute pause command', async () => {
      vi.mocked(spotifyApi.controlPlayback).mockResolvedValueOnce(ok(undefined));
      
      const result = await server.callTool('player_control', { command: 'pause' });
      
      expect(result.isOk()).toBe(true);
      expect(spotifyApi.controlPlayback).toHaveBeenCalledWith('pause', 'mock-access-token');
    });

    it('should execute next command', async () => {
      vi.mocked(spotifyApi.controlPlayback).mockResolvedValueOnce(ok(undefined));
      
      const result = await server.callTool('player_control', { command: 'next' });
      
      expect(result.isOk()).toBe(true);
      expect(spotifyApi.controlPlayback).toHaveBeenCalledWith('next', 'mock-access-token');
    });

    it('should execute previous command', async () => {
      vi.mocked(spotifyApi.controlPlayback).mockResolvedValueOnce(ok(undefined));
      
      const result = await server.callTool('player_control', { command: 'previous' });
      
      expect(result.isOk()).toBe(true);
      expect(spotifyApi.controlPlayback).toHaveBeenCalledWith('previous', 'mock-access-token');
    });

    it('should validate command parameter', async () => {
      const result = await server.callTool('player_control', {});
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Missing required parameter: command');
      }
    });

    it('should reject invalid commands', async () => {
      const result = await server.callTool('player_control', { command: 'invalid' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Invalid command');
      }
    });

    it('should handle playback control errors', async () => {
      vi.mocked(spotifyApi.controlPlayback).mockResolvedValueOnce(
        err({
          type: 'SpotifyError',
          message: 'No active device'
        })
      );
      
      const result = await server.callTool('player_control', { command: 'play' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to control playback');
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid tool names', async () => {
      const result = await server.callTool('invalid_tool', {});
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Unknown tool: invalid_tool');
      }
    });

    it('should handle token manager errors', async () => {
      mockTokenManager.refreshTokenIfNeeded = vi.fn().mockResolvedValueOnce(
        err({
          type: 'AuthError',
          message: 'Failed to get token',
          reason: 'missing'
        })
      );
      
      const result = await server.callTool('search', { query: 'test' });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to get access token');
      }
    });

    it('should refresh token when needed', async () => {
      mockTokenManager.refreshTokenIfNeeded = vi.fn().mockResolvedValueOnce(ok('new-token'));
      vi.mocked(spotifyApi.searchTracks).mockResolvedValueOnce(ok([]));
      
      await server.callTool('search', { query: 'test' });
      
      expect(mockTokenManager.refreshTokenIfNeeded).toHaveBeenCalled();
    });
  });

  describe('server metadata', () => {
    it('should provide server information', () => {
      const info = server.getServerInfo();
      
      expect(info.name).toBe('spotify-remote');
      expect(info.version).toBe('0.2.0');
      expect(info.description).toContain('Control Spotify playback');
    });

    it('should list available tools', () => {
      const tools = server.listTools();
      
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toContain('search');
      expect(tools.map(t => t.name)).toContain('player_state');
      expect(tools.map(t => t.name)).toContain('player_control');
    });
  });
});