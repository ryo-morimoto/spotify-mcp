import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Result, ok, err } from 'neverthrow';
import type { AppError } from '../result.ts';
import type { TokenManager } from '../types/index.ts';
import { tryCatch } from '../result.ts';
import {
  searchSchema,
  playerControlSchema,
  handleSearch,
  handlePlayerState,
  handlePlayerControl,
} from './tools/index.ts';

export function createMcpServer(tokenManager: TokenManager): any {
  const server = new McpServer(
    {
      name: 'spotify-remote',
      version: '0.2.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  // Store tool handlers for test access
  const toolHandlers = new Map<string, (args: any) => Promise<CallToolResult>>();

  // Search tool handler
  const searchHandler = async (args: any): Promise<CallToolResult> => {
    const result = await handleSearch(args, tokenManager);
    return formatMcpResult(result);
  };

  // Player state handler
  const playerStateHandler = async (): Promise<CallToolResult> => {
    const result = await handlePlayerState(tokenManager);
    return formatMcpResult(result);
  };

  // Player control handler
  const playerControlHandler = async (args: any): Promise<CallToolResult> => {
    const result = await handlePlayerControl(args, tokenManager);
    return formatMcpResult(result);
  };

  const formatMcpResult = (result: Result<string, AppError>): CallToolResult => {
    if (result.isOk()) {
      return {
        content: [
          {
            type: 'text',
            text: result.value,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: result.error.message,
        },
      ],
      isError: true,
    };
  };

  // Store handlers
  toolHandlers.set('search', searchHandler);
  toolHandlers.set('player_state', playerStateHandler);
  toolHandlers.set('player_control', playerControlHandler);

  // Register tools with MCP server
  server.tool(
    'search',
    'Search for tracks on Spotify',
    searchSchema.shape,
    searchHandler,
  );

  server.tool('player_state', 'Get current Spotify playback state', {}, playerStateHandler);

  server.tool(
    'player_control',
    'Control Spotify playback',
    playerControlSchema.shape,
    playerControlHandler,
  );

  // Add test helper methods
  const serverWithHelpers = server as any;

  serverWithHelpers.callTool = async function (name: string, args: any) {
    const handler = toolHandlers.get(name);

    if (!handler) {
      return err({
        code: 'UNKNOWN_TOOL',
        message: `Unknown tool: ${name}`,
      });
    }

    const validationResult = tryCatch(() => {
      // Basic validation for required params
      if (name === 'search' && !args.query) {
        throw new Error('Missing required parameter: query');
      }

      if (name === 'player_control') {
        if (!args.command) {
          throw new Error('Missing required parameter: command');
        }
        if (!['play', 'pause', 'next', 'previous'].includes(args.command)) {
          throw new Error(
            `Invalid command: ${args.command}. Valid commands are: play, pause, next, previous`,
          );
        }
      }
    });

    if (validationResult.isErr()) {
      return err({
        code: 'INVALID_PARAMS',
        message: validationResult.error.message,
      });
    }

    try {
      const result = await handler(args);

      if (result.isError) {
        return err({
          code: 'TOOL_ERROR',
          message: result.content[0]?.text || 'Tool execution failed',
        });
      }

      return ok({
        content: result.content,
      });
    } catch (error) {
      return err({
        code: 'INTERNAL_ERROR',
        message: `Tool execution failed: ${error}`,
      });
    }
  };

  serverWithHelpers.getServerInfo = function () {
    return {
      name: 'spotify-remote',
      version: '0.2.0',
      description: 'Control Spotify playback through MCP',
    };
  };

  serverWithHelpers.listTools = function () {
    return [
      { name: 'search', description: 'Search for tracks on Spotify' },
      { name: 'player_state', description: 'Get current Spotify playback state' },
      { name: 'player_control', description: 'Control Spotify playback' },
    ];
  };

  return serverWithHelpers;
}
