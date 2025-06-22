import { Hono } from 'hono';
import { z } from 'zod';
import { createMcpServer } from '../mcp/index.ts';
import { createTokenManagerAdapter } from '../adapters/index.ts';
import { requireAuth } from '../middleware/index.ts';
import type { TokenStorage } from '../types/index.ts';

// Import centralized type augmentations
import '../types/hono.d.ts';

// JSON-RPC 2.0 Request/Response types
const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
});

const jsonRpcBatchRequestSchema = z.array(jsonRpcRequestSchema);

type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: JsonRpcError;
  id: string | number | null;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// JSON-RPC Error codes
const ErrorCodes = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // Custom error codes
  AUTHENTICATION_REQUIRED: 1001,
  INVALID_TOKEN: 1002,
  TOKEN_EXPIRED: 1003,
  SPOTIFY_API_ERROR: 2001,
  NO_ACTIVE_DEVICE: 2002,
  RATE_LIMIT_EXCEEDED: 2003,
} as const;

export const mcpRoutes = new Hono();

// Main MCP JSON-RPC endpoint
mcpRoutes.post('/mcp', requireAuth, async (c): Promise<Response> => {
  const tokenStorage = c.get('tokenStorage') as TokenStorage;
  const userId = c.get('userId') as string;

  try {
    // Parse request body
    const body = await c.req.json().catch(() => null);
    
    if (!body) {
      return c.json(createErrorResponse(
        null,
        ErrorCodes.PARSE_ERROR,
        'Invalid JSON'
      ));
    }

    // Check if batch request
    const isBatch = Array.isArray(body);
    const requests = isBatch ? body : [body];

    // Validate requests
    const validationResult = isBatch 
      ? jsonRpcBatchRequestSchema.safeParse(requests)
      : jsonRpcRequestSchema.safeParse(requests[0]);

    if (!validationResult.success) {
      return c.json(createErrorResponse(
        null,
        ErrorCodes.INVALID_REQUEST,
        'Invalid JSON-RPC request'
      ));
    }

    // Create MCP server instance
    const tokenManager = createTokenManagerAdapter(tokenStorage, userId);
    const mcpServer = createMcpServer(tokenManager);

    // Process requests
    const responses = await Promise.all(
      requests.map(request => processRequest(request, mcpServer))
    );

    // Return batch or single response
    return c.json(isBatch ? responses : responses[0]);

  } catch (error) {
    console.error('MCP endpoint error:', error);
    return c.json(createErrorResponse(
      null,
      ErrorCodes.INTERNAL_ERROR,
      'Internal server error'
    ));
  }
});

// Process a single JSON-RPC request
async function processRequest(
  request: JsonRpcRequest,
  mcpServer: any
): Promise<JsonRpcResponse> {
  const { method, params, id } = request;

  // Notifications (no id) don't get responses
  const isNotification = id === undefined;

  try {
    // Route to appropriate handler based on method
    let result: any;

    switch (method) {
      // Core MCP methods
      case 'initialize':
        result = await handleInitialize(params);
        break;
      
      case 'shutdown':
        result = null;
        break;

      // Tool methods
      case 'tools/list':
        result = await handleToolsList(mcpServer);
        break;
      
      case 'tools/invoke':
        result = await handleToolsInvoke(params, mcpServer);
        break;

      // Resource methods (planned)
      case 'resources/list':
        result = { resources: [] }; // TODO: Implement resources
        break;
      
      case 'resources/read':
        return createErrorResponse(
          id ?? null,
          ErrorCodes.METHOD_NOT_FOUND,
          'Resources not yet implemented'
        );

      // Prompt methods (planned)
      case 'prompts/list':
        result = { prompts: [] }; // TODO: Implement prompts
        break;
      
      case 'prompts/execute':
        return createErrorResponse(
          id ?? null,
          ErrorCodes.METHOD_NOT_FOUND,
          'Prompts not yet implemented'
        );

      default:
        return createErrorResponse(
          id ?? null,
          ErrorCodes.METHOD_NOT_FOUND,
          `Method '${method}' not found`
        );
    }

    // Don't send response for notifications
    if (isNotification) {
      return {} as JsonRpcResponse; // Will be filtered out
    }

    return {
      jsonrpc: '2.0',
      result,
      id: id ?? null,
    };

  } catch (error) {
    // Don't send error response for notifications
    if (isNotification) {
      console.error(`Notification error for ${method}:`, error);
      return {} as JsonRpcResponse;
    }

    // Map errors to JSON-RPC errors
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        return createErrorResponse(
          id ?? null,
          ErrorCodes.TOKEN_EXPIRED,
          'Token expired'
        );
      }
      if (error.message.includes('Spotify')) {
        return createErrorResponse(
          id ?? null,
          ErrorCodes.SPOTIFY_API_ERROR,
          error.message
        );
      }
    }

    return createErrorResponse(
      id ?? null,
      ErrorCodes.INTERNAL_ERROR,
      'Internal error processing request'
    );
  }
}

// Handler functions
async function handleInitialize(_params: any) {
  return {
    serverInfo: {
      name: 'spotify-mcp-server',
      version: '0.2.0',
    },
    capabilities: {
      tools: true,
      resources: false, // TODO: Enable when implemented
      prompts: false,   // TODO: Enable when implemented
    },
  };
}

async function handleToolsList(mcpServer: any) {
  // Get tool list from MCP server
  const tools = mcpServer.listTools();
  
  return {
    tools: tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: {
        type: 'object',
        properties: {}, // TODO: Get actual schema from tool registration
      },
    })),
  };
}

async function handleToolsInvoke(params: any, mcpServer: any) {
  if (!params?.name) {
    throw new Error('Missing tool name');
  }

  const { name, arguments: args } = params;
  
  // Call tool through MCP server
  const result = await mcpServer.callTool(name, args || {});
  
  if (result.isErr()) {
    throw new Error(result.error.message);
  }

  return result.value;
}

// Create JSON-RPC error response
function createErrorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: any
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    error: {
      code,
      message,
      data,
    },
    id,
  };
}