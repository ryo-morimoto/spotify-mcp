import express, { Request, Response } from 'express';
import { createMcpServer, type TokenManager } from './mcpServer.ts';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  generateCodeChallenge,
  generateAuthUrl,
  exchangeCodeForToken,
  refreshToken,
  validateToken,
  type OAuthTokens,
  type PKCEChallenge,
} from './oauthHandler.ts';
import { Result, ok, err } from 'neverthrow';
import type { NetworkError, AuthError } from './result.ts';

// Configuration
const PORT = process.env['PORT'] || 3000;
const CLIENT_ID = process.env['SPOTIFY_CLIENT_ID'] || '';
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

// In-memory token storage (in production, use a database)
let currentTokens: OAuthTokens | null = null;
let currentPKCE: PKCEChallenge | null = null;

// Token manager implementation
const tokenManager: TokenManager = {
  async getAccessToken(): Promise<Result<string, NetworkError | AuthError>> {
    if (!currentTokens) {
      return err({
        type: 'AuthError',
        message: 'No access token available',
        reason: 'missing',
      });
    }
    return ok(currentTokens.accessToken);
  },

  async refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>> {
    if (!currentTokens) {
      return err({
        type: 'AuthError',
        message: 'No tokens available',
        reason: 'missing',
      });
    }

    // Check if token is still valid
    const validationResult = validateToken(currentTokens);
    if (validationResult.isOk() && validationResult.value) {
      return ok(currentTokens.accessToken);
    }

    // Refresh the token
    const refreshResult = await refreshToken(currentTokens.refreshToken, CLIENT_ID);
    if (refreshResult.isErr()) {
      return err(refreshResult.error);
    }

    currentTokens = refreshResult.value;
    return ok(currentTokens.accessToken);
  },
};

// Create Express app
export function createApp() {
  const app = express();

  // Enable CORS for SSE
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      authenticated: !!currentTokens,
    });
  });

  // OAuth flow endpoints
  app.get('/auth', async (_req: Request, res: Response) => {
    try {
      const pkceResult = await generateCodeChallenge();
      if (pkceResult.isErr()) {
        res.status(500).json({ error: 'Failed to generate PKCE challenge' });
        return;
      }

      currentPKCE = pkceResult.value;

      const scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
      ];

      const authUrlResult = generateAuthUrl(CLIENT_ID, REDIRECT_URI, currentPKCE, scopes);
      if (authUrlResult.isErr()) {
        res.status(500).json({ error: 'Failed to generate auth URL' });
        return;
      }

      res.redirect(authUrlResult.value);
      return;
    } catch {
      res.status(500).json({ error: 'Authentication failed' });
      return;
    }
  });

  app.get('/callback', async (req: Request, res: Response) => {
    const { code, error } = req.query;

    if (error || !code) {
      res.status(400).json({ error: error || 'No authorization code received' });
      return;
    }

    if (!currentPKCE) {
      res.status(400).json({ error: 'No PKCE challenge found' });
      return;
    }

    try {
      const tokenResult = await exchangeCodeForToken(
        code as string,
        currentPKCE.codeVerifier,
        CLIENT_ID,
        REDIRECT_URI,
      );

      if (tokenResult.isErr()) {
        res.status(400).json({ error: tokenResult.error.message });
        return;
      }

      currentTokens = tokenResult.value;
      currentPKCE = null; // Clear PKCE after use

      res.send(`
        <html>
          <body>
            <h1>Authentication Successful!</h1>
            <p>You can now close this window and use the Spotify MCP server.</p>
            <script>window.close();</script>
          </body>
        </html>
      `);
      return;
    } catch {
      res.status(500).json({ error: 'Failed to exchange code for token' });
      return;
    }
  });

  // SSE endpoint for MCP
  app.get('/sse', async (req: Request, res: Response) => {
    if (!currentTokens) {
      res.status(401).json({ error: 'Not authenticated. Please visit /auth first.' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    });

    // Create MCP server and SSE transport
    const mcpServer = createMcpServer(tokenManager);
    const transport = new SSEServerTransport('/sse', res);

    // Connect MCP server to transport
    await mcpServer.connect(transport);

    // Handle client disconnect
    req.on('close', () => {
      transport.close();
    });
  });

  return app;
}

// Start server if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Spotify MCP Server running on http://localhost:${PORT}`);
    console.log(`📌 Visit http://localhost:${PORT}/auth to authenticate with Spotify`);
    console.log(`🔌 SSE endpoint available at http://localhost:${PORT}/sse`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Server closed');
    });
  });
}

// Example usage in tests
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('init', async () => {
    expect(await Promise.resolve(true)).toBe(true);
  });
}
