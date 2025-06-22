// SSE Transport will be handled differently in Workers
import { handleOAuthCallback, generateAuthUrl, generateCodeChallenge } from './auth/index.ts';
import type { PKCEChallenge } from './types/index.ts';

interface Env {
  SPOTIFY_CLIENT_ID: string;
  SPOTIFY_CLIENT_SECRET?: string;
  OAUTH_TOKENS: KVNamespace;
  TOKEN_MANAGER: DurableObjectNamespace;
  SESSION_MANAGER?: DurableObjectNamespace;
}

// Helper to get or create token manager instance
function getTokenProvider(env: Env, userId: string = 'default'): DurableObjectStub {
  // TODO: Implement proper user identification [MID]
  // - [ ] Extract user ID from authentication token
  // - [ ] Support multiple Spotify accounts per user
  // - [ ] Add user session management
  // Impact: Currently all users share the same token storage
  const id = env.TOKEN_MANAGER.idFromName(userId);
  return env.TOKEN_MANAGER.get(id);
}

// PKCE storage in KV (temporary during auth flow)
async function storePKCE(env: Env, state: string, pkce: PKCEChallenge): Promise<void> {
  await env.OAUTH_TOKENS.put(`pkce_${state}`, JSON.stringify(pkce), {
    expirationTtl: 600, // 10 minutes
  });
}

async function getPKCE(env: Env, state: string): Promise<PKCEChallenge | null> {
  const data = await env.OAUTH_TOKENS.get(`pkce_${state}`, 'json');
  if (!data) return null;
  await env.OAUTH_TOKENS.delete(`pkce_${state}`); // Delete after retrieval
  return data as PKCEChallenge;
}

// SSE handler for MCP protocol
// TODO: Implement proper MCP SSE handler [HIGH]
// - [ ] Add request validation and rate limiting
// - [ ] Support multiple concurrent connections
// - [ ] Implement connection pooling for better performance
// Related: src/transport.ts - Full MCP transport implementation
async function handleSSE(request: Request, env: Env): Promise<Response> {
  const tokenManager = getTokenProvider(env);

  // Get current valid token from Durable Object
  const tokenResponse = await tokenManager.fetch(new Request('http://internal/get'));
  if (!tokenResponse.ok) {
    return new Response('Not authenticated. Please visit /auth first.', { status: 401 });
  }

  (await tokenResponse.json()) as { accessToken: string; expiresAt: number };

  // Create readable/writable stream pair for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Write SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // TODO: Implement full MCP protocol over SSE [HIGH]
  // - [ ] Handle incoming MCP requests from the stream
  // - [ ] Create proper MCP transport with bidirectional communication
  // - [ ] Integrate with mcpServer.ts for tool execution
  // Blocked by: SSE transport implementation in transport.ts

  // FIXME: Current implementation is a placeholder that only sends keepalive [HIGH]
  // - [ ] Replace with TextEncoder/TextDecoder for proper message parsing
  // - [ ] Add message framing for MCP protocol
  // - [ ] Handle connection errors gracefully
  // Impact: MCP protocol is non-functional in Workers environment
  await writer.write(encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'));

  // TODO: Replace with proper SSE event handling [HIGH]
  // - [ ] Implement request/response pattern for MCP tools
  // - [ ] Add error event streaming
  // - [ ] Handle connection state management
  // See: @modelcontextprotocol/sdk SSEServerTransport for reference
  const keepAlive = setInterval(async () => {
    try {
      await writer.write(encoder.encode(':keepalive\n\n'));
    } catch {
      clearInterval(keepAlive);
    }
  }, 30000);

  // Clean up on close
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    writer.close().catch(() => {
      // Ignore errors on close
    });
  });

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
      const pkceResult = await generateCodeChallenge();
      if (pkceResult.isErr()) {
        return new Response('Failed to generate PKCE challenge', { status: 500 });
      }

      const state = crypto.randomUUID();
      await storePKCE(env, state, pkceResult.value);

      const scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
      ];

      const authUrlResult = generateAuthUrl(
        env.SPOTIFY_CLIENT_ID,
        'http://127.0.0.1:8000/callback',
        pkceResult.value,
        scopes,
      );

      if (authUrlResult.isErr()) {
        return new Response('Failed to generate auth URL', { status: 500 });
      }

      // Add state parameter to URL
      const authUrl = new URL(authUrlResult.value);
      authUrl.searchParams.set('state', state);

      return Response.redirect(authUrl.toString(), 302);
    }

    // OAuth callback
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (!code || !state) {
        return new Response('Missing authorization code or state', { status: 400 });
      }

      // Retrieve PKCE from KV
      const pkce = await getPKCE(env, state);
      if (!pkce) {
        return new Response('Invalid or expired authorization state', { status: 400 });
      }

      const tokensResult = await handleOAuthCallback(
        code,
        state,
        env.SPOTIFY_CLIENT_ID,
        env.SPOTIFY_CLIENT_SECRET,
        'http://127.0.0.1:8000/callback',
        pkce.codeVerifier,
      );

      if (tokensResult.isErr()) {
        return new Response(`Authentication failed: ${tokensResult.error.message}`, {
          status: 500,
        });
      }

      // Store tokens in Durable Object
      const tokenManager = getTokenProvider(env);
      const storeResponse = await tokenManager.fetch(
        new Request('http://internal/store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...tokensResult.value,
            clientId: env.SPOTIFY_CLIENT_ID,
            clientSecret: env.SPOTIFY_CLIENT_SECRET,
          }),
        }),
      );

      if (!storeResponse.ok) {
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

// Export Durable Objects
export { TokenProvider } from './durableObjects.ts';
