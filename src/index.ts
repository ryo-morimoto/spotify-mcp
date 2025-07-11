import { Hono } from "hono";
import { cors } from "hono/cors";
import { createMCPServer } from "./mcp.ts";
import { createSpotifyClient } from "./spotify.ts";
import authHandler from "./authHandler.ts";
import type {
  SpotifyConfig,
  SpotifyClientId,
  SpotifyAccessToken,
  SpotifyRefreshToken,
  Bindings,
} from "./types.ts";
import { StreamableHTTPTransport } from "@hono/mcp";
import { SPOTIFY_SCOPES } from "./constants.ts";

const app = new Hono<{ Bindings: Bindings }>();

// Apply CORS middleware
app.use("*", async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN || "*",
    allowHeaders: ["Content-Type", "X-Custom-Header", "Upgrade-Insecure-Requests"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Mount auth endpoints
app.route("/auth", authHandler);

// OAuth discovery endpoint at root level
app.get("/.well-known/oauth-authorization-server", async (c) => {
  const baseUrl = new URL(c.req.url).origin;

  return c.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/auth/authorize`,
    token_endpoint: `${baseUrl}/auth/token`,
    registration_endpoint: `${baseUrl}/auth/register`,
    scopes_supported: SPOTIFY_SCOPES,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"], // Public client with PKCE
  });
});

// MCP endpoint with Bearer token authentication
// Note: Only POST is supported. SSE (GET) is not needed for this use case.
app.post("/mcp", async (c) => {
  // Extract Bearer token from Authorization header
  const authorization = c.req.header("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return c.text("Unauthorized", 401);
  }

  const token = authorization.substring(7);

  // Retrieve token data from KV
  const tokenDataJson = await c.env.OAUTH_KV.get(`mcp_token:${token}`);
  if (!tokenDataJson) {
    return c.text("Invalid token", 401);
  }

  const tokenData = JSON.parse(tokenDataJson);

  // Check token expiration
  if (Date.now() > tokenData.expiresAt) {
    await c.env.OAUTH_KV.delete(`mcp_token:${token}`);
    return c.text("Token expired", 401);
  }

  // Create Spotify client with stored tokens
  const config: SpotifyConfig = {
    clientId: c.env.CLIENT_ID as SpotifyClientId,
    redirectUri: c.env.SPOTIFY_REDIRECT_URI,
    accessToken: tokenData.spotifyTokens.accessToken as SpotifyAccessToken,
    refreshToken: tokenData.spotifyTokens.refreshToken as SpotifyRefreshToken,
    expiresAt: tokenData.spotifyTokens.expiresAt,
  };

  const clientResult = createSpotifyClient(config);
  if (clientResult.isErr()) {
    return c.text("Failed to create Spotify client", 500);
  }

  // Create MCP server and handle request
  const mcpServer = createMCPServer(clientResult.value);
  const transport = new StreamableHTTPTransport();
  await mcpServer.connect(transport);

  try {
    const response = await transport.handleRequest(c);
    return response || c.text("No response from MCP server", 500);
  } catch {
    return c.text("Internal Server Error", 500);
  }
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

export default app;
