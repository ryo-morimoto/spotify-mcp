import { Hono } from "hono";
import { cors } from "hono/cors";
import { StreamableHTTPTransport } from "@hono/mcp";
import type { KVNamespace } from "@cloudflare/workers-types";
import { createMCPServer } from "./mcp.ts";
import { createSpotifyClient } from "./spotify.ts";
import { generateAuthorizationUrl, exchangeCodeForTokens } from "./oauth.ts";
import type {
  SpotifyConfig,
  SpotifyClientId,
  SpotifyAccessToken,
  SpotifyRefreshToken,
  OAuthState,
} from "./types.ts";

type Bindings = {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  OAUTH_KV: KVNamespace;
  CORS_ORIGIN: string;
  SPOTIFY_ACCESS_TOKEN: string;
  SPOTIFY_REFRESH_TOKEN?: string;
  SPOTIFY_EXPIRES_AT?: string;
  SPOTIFY_REDIRECT_URI: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Simple CORS setup
app.use(
  "*",
  cors({
    origin: (_origin, c) => c.env.CORS_ORIGIN || "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

// Health check endpoint
app.get("/", (c) => c.json({ status: "ok" }));

// MCP endpoint
app.all("/mcp", async (c) => {
  const sessionId = c.req.header("mcp-session-id");

  // Check for session-based authentication
  if (sessionId && c.env.OAUTH_KV) {
    const sessionData = await c.env.OAUTH_KV.get(`mcp_session:${sessionId}`);
    if (sessionData) {
      const session = JSON.parse(sessionData) as {
        accessToken: SpotifyAccessToken;
        refreshToken: SpotifyRefreshToken;
        expiresAt: number;
      };

      // Check if token is still valid
      if (Date.now() < session.expiresAt) {
        const config: SpotifyConfig = {
          clientId: c.env.CLIENT_ID as SpotifyClientId,
          redirectUri: c.env.SPOTIFY_REDIRECT_URI,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
        };

        const clientResult = createSpotifyClient(config);
        if (clientResult.isOk()) {
          const mcpServer = createMCPServer(clientResult.value);
          const transport = new StreamableHTTPTransport();
          await mcpServer.connect(transport);
          return transport.handleRequest(c);
        }
      }
    }
  }

  // Check for environment variable authentication (backward compatibility)
  if (c.env.SPOTIFY_ACCESS_TOKEN) {
    const config: SpotifyConfig = {
      clientId: c.env.CLIENT_ID as SpotifyClientId,
      redirectUri: c.env.SPOTIFY_REDIRECT_URI,
      accessToken: c.env.SPOTIFY_ACCESS_TOKEN as SpotifyAccessToken,
      refreshToken: c.env.SPOTIFY_REFRESH_TOKEN as SpotifyRefreshToken | undefined,
      expiresAt: c.env.SPOTIFY_EXPIRES_AT ? Number.parseInt(c.env.SPOTIFY_EXPIRES_AT) : undefined,
    };

    const clientResult = createSpotifyClient(config);
    if (clientResult.isOk()) {
      const mcpServer = createMCPServer(clientResult.value);
      const transport = new StreamableHTTPTransport();
      await mcpServer.connect(transport);
      return transport.handleRequest(c);
    }
  }

  // No authentication available
  return c.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Authentication required",
        data: {
          authUrl: `/auth/spotify${sessionId ? `?mcp_session=${sessionId}` : ""}`,
        },
      },
      id: null,
    },
    401,
  );
});

// OAuth endpoints
app.get("/auth/spotify", async (c) => {
  const mcpSession = c.req.query("mcp_session");
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
  ];

  const redirectUri = `${new URL(c.req.url).origin}/auth/callback${mcpSession ? `?mcp_session=${mcpSession}` : ""}`;
  const authResult = await generateAuthorizationUrl(
    c.env.CLIENT_ID as SpotifyClientId,
    redirectUri,
    scopes,
  );

  if (authResult.isErr()) {
    return c.json({ error: authResult.error }, 500);
  }

  const { url, state } = authResult.value;

  // Store OAuth state in KV
  await c.env.OAUTH_KV.put(
    `oauth_state:${state.state}`,
    JSON.stringify(state),
    { expirationTtl: 600 }, // 10 minutes
  );

  return c.redirect(url);
});

app.get("/auth/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const mcpSession = c.req.query("mcp_session");

  if (error) {
    return c.json({ error: `OAuth error: ${error}` }, 400);
  }

  if (!code || !state) {
    return c.json({ error: "Missing code or state parameter" }, 400);
  }

  // Retrieve OAuth state from KV
  const storedStateJson = await c.env.OAUTH_KV.get(`oauth_state:${state}`);
  if (!storedStateJson) {
    return c.json({ error: "Invalid or expired state" }, 400);
  }

  const storedState: OAuthState = JSON.parse(storedStateJson);

  // Exchange code for tokens
  const tokenResult = await exchangeCodeForTokens(
    c.env.CLIENT_ID as SpotifyClientId,
    code,
    storedState.codeVerifier,
    storedState.redirectUri,
  );

  if (tokenResult.isErr()) {
    return c.json({ error: tokenResult.error }, 500);
  }

  const tokens = tokenResult.value;
  const expiresAt = Date.now() + tokens.expiresIn * 1000;

  // If MCP session ID is provided, store tokens for MCP
  if (mcpSession) {
    await c.env.OAUTH_KV.put(
      `mcp_session:${mcpSession}`,
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      }),
      { expirationTtl: 30 * 24 * 60 * 60 }, // 30 days
    );

    // Clean up OAuth state
    await c.env.OAUTH_KV.delete(`oauth_state:${state}`);

    // Redirect to success page for MCP
    return c.redirect(`/mcp-auth-success?session=${mcpSession}`);
  }

  // Store tokens in KV (in production, encrypt these)
  const sessionId = crypto.randomUUID();
  await c.env.OAUTH_KV.put(
    `session:${sessionId}`,
    JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
    }),
    { expirationTtl: 30 * 24 * 60 * 60 }, // 30 days
  );

  // Clean up OAuth state
  await c.env.OAUTH_KV.delete(`oauth_state:${state}`);

  // Return session ID to client
  return c.json({
    message: "Authentication successful",
    sessionId,
    expiresAt,
  });
});

// MCP authentication success page
app.get("/mcp-auth-success", (c) => {
  const session = c.req.query("session");
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>MCP Authentication Success</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; text-align: center; }
        .success { color: #22c55e; font-size: 48px; margin-bottom: 20px; }
        code { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="success">✓</div>
      <h1>Authentication Successful</h1>
      <p>Your MCP session has been created.</p>
      <p>Session ID: <code>${session}</code></p>
      <p>You can now close this window and return to your MCP client.</p>
    </body>
    </html>
  `);
});

export default app;
