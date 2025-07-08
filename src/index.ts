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
  const config: SpotifyConfig = {
    clientId: c.env.CLIENT_ID as SpotifyClientId,
    redirectUri: c.env.SPOTIFY_REDIRECT_URI,
    accessToken: c.env.SPOTIFY_ACCESS_TOKEN as SpotifyAccessToken,
    refreshToken: c.env.SPOTIFY_REFRESH_TOKEN as SpotifyRefreshToken | undefined,
    expiresAt: c.env.SPOTIFY_EXPIRES_AT ? Number.parseInt(c.env.SPOTIFY_EXPIRES_AT) : undefined,
  };

  const clientResult = createSpotifyClient(config);
  if (clientResult.isErr()) {
    return c.json({ error: `Failed to create Spotify client: ${clientResult.error}` }, 500);
  }

  const mcpServer = createMCPServer(clientResult.value);
  const transport = new StreamableHTTPTransport();
  await mcpServer.connect(transport);
  return transport.handleRequest(c);
});

// OAuth endpoints
app.get("/auth/spotify", async (c) => {
  const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played",
  ];

  const authResult = await generateAuthorizationUrl(
    c.env.CLIENT_ID as SpotifyClientId,
    `${new URL(c.req.url).origin}/auth/callback`,
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

export default app;
