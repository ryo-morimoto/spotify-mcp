import { Hono } from "hono";
import { cors } from "hono/cors";
import { StreamableHTTPTransport } from "@hono/mcp";
import type { KVNamespace } from "@cloudflare/workers-types";
import { createMCPServer } from "./mcp.ts";
import { createSpotifyClient } from "./spotify.ts";
import type {
  SpotifyConfig,
  SpotifyClientId,
  SpotifyAccessToken,
  SpotifyRefreshToken,
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

export default app;
