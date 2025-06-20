import { SSETransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer } from './mcpServer.ts';
import { handleOAuthCallback, generateAuthUrl } from './oauthHandler.ts';
import { err, ok, type Result } from 'neverthrow';

interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET?: string;
  OAUTH_TOKENS: KVNamespace;
  SESSION_MANAGER?: DurableObjectNamespace;
}

// Token storage helpers using KV
async function getStoredTokens(env: Env): Promise<Result<{ accessToken: string; refreshToken: string; expiresAt: number } | null, Error>> {
  try {
    const data = await env.OAUTH_TOKENS.get('spotify_tokens', 'json');
    if (!data) return ok(null);
    return ok(data as { accessToken: string; refreshToken: string; expiresAt: number });
  } catch (error) {
    return err(new Error(`Failed to get tokens from KV: ${error}`));
  }
}

async function storeTokens(
  env: Env,
  tokens: { accessToken: string; refreshToken: string; expiresAt: number }
): Promise<Result<void, Error>> {
  try {
    await env.OAUTH_TOKENS.put('spotify_tokens', JSON.stringify(tokens), {
      expirationTtl: 60 * 60 * 24 * 30, // 30 days
    });
    return ok(undefined);
  } catch (error) {
    return err(new Error(`Failed to store tokens in KV: ${error}`));
  }
}

// SSE handler for MCP protocol
async function handleSSE(request: Request, env: Env): Promise<Response> {
  const tokensResult = await getStoredTokens(env);
  if (tokensResult.isErr()) {
    return new Response('Internal error', { status: 500 });
  }

  const tokens = tokensResult.value;
  if (!tokens) {
    return new Response('Not authenticated. Please visit /auth first.', { status: 401 });
  }

  // Create readable/writable stream pair for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Write SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Create MCP server with current tokens
  const serverResult = await createServer({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  });

  if (serverResult.isErr()) {
    return new Response('Failed to create MCP server', { status: 500 });
  }

  const server = serverResult.value;

  // Set up SSE transport
  const transport = new SSETransport('/sse', {
    write: async (chunk: string) => {
      await writer.write(encoder.encode(chunk));
    },
  });

  // Handle the connection
  server.connect(transport).catch(async (error) => {
    console.error('MCP connection error:', error);
    await writer.write(encoder.encode('event: error\ndata: Connection error\n\n'));
    await writer.close();
  });

  // Process incoming messages
  const body = await request.text();
  if (body) {
    try {
      await transport.handleMessage(body);
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  return new Response(readable, { headers });
}

// Main request handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // OAuth authorization
    if (url.pathname === '/auth') {
      const authUrl = generateAuthUrl(env.SPOTIFY_CLIENT_ID, 'http://localhost:8787/callback');
      return Response.redirect(authUrl, 302);
    }

    // OAuth callback
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code) {
        return new Response('Missing authorization code', { status: 400 });
      }

      const tokensResult = await handleOAuthCallback(
        code,
        state || '',
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
        'http://localhost:8787/callback'
      );

      if (tokensResult.isErr()) {
        return new Response(`Authentication failed: ${tokensResult.error.message}`, { status: 500 });
      }

      // Store tokens in KV
      const storeResult = await storeTokens(env, tokensResult.value);
      if (storeResult.isErr()) {
        return new Response('Failed to store authentication', { status: 500 });
      }

      return new Response('Authentication successful! You can now use the MCP server at /sse', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // SSE endpoint for MCP
    if (url.pathname === '/sse') {
      return handleSSE(request, env);
    }

    // 404 for other routes
    return new Response('Not found', { status: 404 });
  },
};

// Optional: Durable Object for session management
export class SessionManager {
  private state: DurableObjectState;
  private sessions: Map<string, any> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    // Session management logic here
    return new Response('Session manager');
  }
}