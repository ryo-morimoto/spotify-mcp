import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Result, ok, err } from 'neverthrow';
import { searchTracks, getCurrentPlayback, controlPlayback, type PlaybackCommand } from './spotifyApi.ts';
import type { NetworkError, AuthError } from './result.ts';
import { z } from 'zod';

export interface TokenManager {
  getAccessToken(): Promise<Result<string, NetworkError | AuthError>>;
  refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>>;
}

export function createMcpServer(tokenManager: TokenManager): any {
  const server = new McpServer({
    name: 'spotify-remote',
    version: '0.2.0'
  }, {
    capabilities: {
      tools: {},
      resources: {}
    }
  });

  // Store tool handlers for test access
  const toolHandlers = new Map<string, (args: any) => Promise<CallToolResult>>();

  // Search tool handler
  const searchHandler = async (args: any): Promise<CallToolResult> => {
    try {
      // Get access token
      const tokenResult = await tokenManager.refreshTokenIfNeeded();
      if (tokenResult.isErr()) {
        return {
          content: [{
            type: 'text',
            text: `Failed to get access token: ${tokenResult.error.message}`
          }],
          isError: true
        };
      }

      // Search tracks
      const searchResult = await searchTracks(
        args.query,
        tokenResult.value,
        args.limit || 10
      );

      if (searchResult.isErr()) {
        return {
          content: [{
            type: 'text',
            text: `Failed to search tracks: ${searchResult.error.message}`
          }],
          isError: true
        };
      }

      // Format results
      const tracks = searchResult.value;
      if (tracks.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No tracks found'
          }]
        };
      }

      const trackList = tracks.map(track => 
        `• ${track.name} by ${track.artists.map(a => a.name).join(', ')} (${track.album.name})`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${tracks.length} tracks:\n${trackList}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Unexpected error: ${error}`
        }],
        isError: true
      };
    }
  };

  // Player state handler
  const playerStateHandler = async (): Promise<CallToolResult> => {
    try {
      // Get access token
      const tokenResult = await tokenManager.refreshTokenIfNeeded();
      if (tokenResult.isErr()) {
        return {
          content: [{
            type: 'text',
            text: `Failed to get access token: ${tokenResult.error.message}`
          }],
          isError: true
        };
      }

      // Get playback state
      const stateResult = await getCurrentPlayback(tokenResult.value);
      
      if (stateResult.isErr()) {
        return {
          content: [{
            type: 'text',
            text: `Failed to get player state: ${stateResult.error.message}`
          }],
          isError: true
        };
      }

      const state = stateResult.value;
      if (!state) {
        return {
          content: [{
            type: 'text',
            text: 'No active playback'
          }]
        };
      }

      // Format playback info
      const track = state.item;
      const device = state.device;
      const status = state.is_playing ? 'Playing' : 'Paused';
      
      let info = `Now Playing: ${track?.name || 'Unknown'}\n`;
      if (track) {
        info += `Artist: ${track.artists.map(a => a.name).join(', ')}\n`;
        info += `Album: ${track.album.name}\n`;
      }
      if (device) {
        info += `Device: ${device.name} (${device.type})\n`;
        info += `Volume: ${device.volume_percent}%\n`;
      }
      info += `Status: ${status}`;
      
      if (state.progress_ms !== undefined && state.duration_ms) {
        const progress = Math.floor(state.progress_ms / 1000);
        const duration = Math.floor(state.duration_ms / 1000);
        info += `\nProgress: ${formatTime(progress)} / ${formatTime(duration)}`;
      }

      return {
        content: [{
          type: 'text',
          text: info
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Unexpected error: ${error}`
        }],
        isError: true
      };
    }
  };

  // Player control handler
  const playerControlHandler = async (args: any): Promise<CallToolResult> => {
    try {
      // Get access token
      const tokenResult = await tokenManager.refreshTokenIfNeeded();
      if (tokenResult.isErr()) {
        return {
          content: [{
            type: 'text',
            text: `Failed to get access token: ${tokenResult.error.message}`
          }],
          isError: true
        };
      }

      // Execute command
      const controlResult = await controlPlayback(
        args.command as PlaybackCommand,
        tokenResult.value
      );

      if (controlResult.isErr()) {
        return {
          content: [{
            type: 'text',
            text: `Failed to control playback: ${controlResult.error.message}`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: `Playback command executed: ${args.command}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Unexpected error: ${error}`
        }],
        isError: true
      };
    }
  };

  // Store handlers
  toolHandlers.set('search', searchHandler);
  toolHandlers.set('player_state', playerStateHandler);
  toolHandlers.set('player_control', playerControlHandler);

  // Register tools with MCP server
  server.tool(
    'search',
    'Search for tracks on Spotify',
    {
      query: z.string().describe('Search query for tracks'),
      limit: z.number().min(1).max(50).optional().default(10).describe('Maximum number of results (1-50)')
    },
    searchHandler
  );

  server.tool(
    'player_state',
    'Get current Spotify playback state',
    {},
    playerStateHandler
  );

  server.tool(
    'player_control',
    'Control Spotify playback',
    {
      command: z.enum(['play', 'pause', 'next', 'previous']).describe('Playback command to execute')
    },
    playerControlHandler
  );

  // Add test helper methods
  const serverWithHelpers = server as any;
  
  serverWithHelpers.callTool = async function(name: string, args: any) {
    const handler = toolHandlers.get(name);
    
    if (!handler) {
      return err({
        code: 'UNKNOWN_TOOL',
        message: `Unknown tool: ${name}`
      });
    }
    
    try {
      // Basic validation for required params
      if (name === 'search' && !args.query) {
        return err({
          code: 'INVALID_PARAMS',
          message: `Missing required parameter: query`
        });
      }
      
      if (name === 'player_control') {
        if (!args.command) {
          return err({
            code: 'INVALID_PARAMS',
            message: `Missing required parameter: command`
          });
        }
        if (!['play', 'pause', 'next', 'previous'].includes(args.command)) {
          return err({
            code: 'INVALID_PARAMS',
            message: `Invalid command: ${args.command}. Valid commands are: play, pause, next, previous`
          });
        }
      }
      
      const result = await handler(args);
      
      if (result.isError) {
        return err({
          code: 'TOOL_ERROR',
          message: result.content[0].text
        });
      }
      
      return ok({
        content: result.content
      });
    } catch (error) {
      return err({
        code: 'INTERNAL_ERROR',
        message: `Tool execution failed: ${error}`
      });
    }
  };

  serverWithHelpers.getServerInfo = function() {
    return {
      name: 'spotify-remote',
      version: '0.2.0',
      description: 'Control Spotify playback through MCP'
    };
  };

  serverWithHelpers.listTools = function() {
    return [
      { name: 'search', description: 'Search for tracks on Spotify' },
      { name: 'player_state', description: 'Get current Spotify playback state' },
      { name: 'player_control', description: 'Control Spotify playback' }
    ];
  };

  return serverWithHelpers;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}