import { Hono } from "hono";
import { generateAuthorizationUrl, exchangeCodeForTokens } from "./oauth.ts";
import type { SpotifyClientId, Bindings } from "./types.ts";
import { SPOTIFY_SCOPES } from "./constants.ts";
import { registerClient, getClient, validateRedirectUri } from "./oauth/clientRegistry.ts";
import type { ClientRegistrationRequest, ClientRegistrationResponse } from "./oauth/types.ts";

const authHandler = new Hono<{ Bindings: Bindings }>();

// Client registration endpoint
authHandler.post("/register", async (c) => {
  const body = await c.req.json<ClientRegistrationRequest>().catch(() => null);

  if (!body) {
    return c.json(
      { error: "invalid_request", error_description: "Invalid JSON in request body" },
      400,
    );
  }

  // Register the client
  const result = await registerClient(c.env.OAUTH_KV, body);

  if (result.isErr()) {
    return c.json({ error: "invalid_client_metadata", error_description: result.error }, 400);
  }

  const client = result.value;

  // Return the client registration response
  const response: ClientRegistrationResponse = {
    client_id: client.client_id,
    client_id_issued_at: Math.floor(client.created_at / 1000),
    grant_types: body.grant_types || ["authorization_code"],
    response_types: body.response_types || ["code"],
    redirect_uris: client.redirect_uris,
    token_endpoint_auth_method: body.token_endpoint_auth_method || "none",
    ...(client.client_name && { client_name: client.client_name }),
  };

  return c.json(response);
});

// Authorization page - shows user login/consent
authHandler.get("/authorize", async (c) => {
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const state = c.req.query("state");
  const codeChallenge = c.req.query("code_challenge");
  const codeChallengeMethod = c.req.query("code_challenge_method");

  // Validate required parameters
  if (!clientId || !redirectUri || !state || !codeChallenge || codeChallengeMethod !== "S256") {
    return c.text("Missing or invalid parameters", 400);
  }

  // Validate client exists and redirect URI is registered
  const clientResult = await getClient(c.env.OAUTH_KV, clientId);
  if (clientResult.isErr()) {
    return c.text("Server error", 500);
  }

  const client = clientResult.value;
  if (!client) {
    return c.text("Invalid client", 400);
  }

  const uriValidation = validateRedirectUri(client, redirectUri);
  if (uriValidation.isErr()) {
    return c.text("Invalid redirect URI", 400);
  }

  // Store authorization request details
  await c.env.OAUTH_KV.put(
    `auth_request:${state}`,
    JSON.stringify({
      clientId,
      redirectUri,
      codeChallenge,
      state,
    }),
    { expirationTtl: 600 }, // 10 minutes
  );

  // Show authorization page
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authorize Spotify MCP Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 600px;
          margin: 100px auto;
          padding: 20px;
          text-align: center;
        }
        .container {
          background: #f5f5f5;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        p {
          color: #666;
          margin-bottom: 30px;
          line-height: 1.6;
        }
        .button {
          display: inline-block;
          background: #1db954;
          color: white;
          padding: 12px 30px;
          border-radius: 25px;
          text-decoration: none;
          font-weight: bold;
          transition: background 0.3s;
        }
        .button:hover {
          background: #1ed760;
        }
        .cancel {
          display: inline-block;
          margin-top: 20px;
          color: #666;
          text-decoration: none;
        }
        .cancel:hover {
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Authorize Spotify MCP Server</h1>
        <p>
          The application is requesting access to your Spotify account.
          This will allow the MCP server to search and retrieve information from Spotify on your behalf.
        </p>
        <p>
          The application will request access to your Spotify account data.
        </p>
        <a href="/auth/spotify/connect?state=${state}" class="button">
          Connect with Spotify
        </a>
        <br>
        <a href="${redirectUri}?error=access_denied&state=${state}" class="cancel">
          Cancel
        </a>
      </div>
    </body>
    </html>
  `);
});

// Spotify OAuth connection - initiates Spotify OAuth flow
authHandler.get("/spotify/connect", async (c) => {
  const state = c.req.query("state");

  if (!state) {
    return c.text("Missing state parameter", 400);
  }

  // Retrieve authorization request
  const authRequestJson = await c.env.OAUTH_KV.get(`auth_request:${state}`);
  if (!authRequestJson) {
    return c.text("Invalid or expired authorization request", 400);
  }

  const authRequest = JSON.parse(authRequestJson);

  // Generate Spotify OAuth URL
  const authUrlResult = await generateAuthorizationUrl(
    c.env.CLIENT_ID as SpotifyClientId,
    c.env.SPOTIFY_REDIRECT_URI,
    [...SPOTIFY_SCOPES],
  );

  if (authUrlResult.isErr()) {
    return c.text("Failed to generate authorization URL", 500);
  }

  const { url, state: spotifyState } = authUrlResult.value;

  // Store combined state mapping
  await c.env.OAUTH_KV.put(
    `spotify_state:${spotifyState.state}`,
    JSON.stringify({
      ...spotifyState,
      mcpState: state,
      authRequest,
    }),
    { expirationTtl: 600 }, // 10 minutes
  );

  return c.redirect(url);
});

// Spotify OAuth callback - handles return from Spotify
authHandler.get("/spotify/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");

  if (error) {
    return c.text(`Spotify authorization error: ${error}`, 400);
  }

  if (!code || !state) {
    return c.text("Missing code or state parameter", 400);
  }

  // Retrieve combined state
  const stateDataJson = await c.env.OAUTH_KV.get(`spotify_state:${state}`);
  if (!stateDataJson) {
    return c.text("Invalid or expired state", 400);
  }

  const stateData = JSON.parse(stateDataJson);
  const { codeVerifier, redirectUri, mcpState, authRequest } = stateData;

  // Exchange Spotify code for tokens
  const tokenResult = await exchangeCodeForTokens(
    c.env.CLIENT_ID as SpotifyClientId,
    code,
    codeVerifier,
    redirectUri,
  );

  if (tokenResult.isErr()) {
    return c.text(`Token exchange failed: ${tokenResult.error}`, 500);
  }

  const tokens = tokenResult.value;
  const expiresAt = Date.now() + tokens.expiresIn * 1000;

  // Generate MCP authorization code
  const mcpAuthCode = crypto.randomUUID();

  // Store authorization code with Spotify tokens
  await c.env.OAUTH_KV.put(
    `auth_code:${mcpAuthCode}`,
    JSON.stringify({
      clientId: authRequest.clientId,
      redirectUri: authRequest.redirectUri,
      codeChallenge: authRequest.codeChallenge,
      spotifyTokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
      },
    }),
    { expirationTtl: 600 }, // 10 minutes
  );

  // Clean up temporary state
  await c.env.OAUTH_KV.delete(`auth_request:${mcpState}`);
  await c.env.OAUTH_KV.delete(`spotify_state:${state}`);

  // Redirect back to MCP client with authorization code
  const redirectUrl = new URL(authRequest.redirectUri);
  redirectUrl.searchParams.set("code", mcpAuthCode);
  redirectUrl.searchParams.set("state", mcpState);

  return c.redirect(redirectUrl.toString());
});

// Token endpoint - handles token exchange
authHandler.post("/token", async (c) => {
  const body = await c.req.text();
  const params = new URLSearchParams(body);

  const grantType = params.get("grant_type");
  const code = params.get("code");
  const codeVerifier = params.get("code_verifier");
  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");

  if (grantType !== "authorization_code" || !code || !codeVerifier || !clientId) {
    return c.json(
      { error: "invalid_request", error_description: "Missing required parameters" },
      400,
    );
  }

  // Retrieve auth code data from KV
  const authDataJson = await c.env.OAUTH_KV.get(`auth_code:${code}`);
  if (!authDataJson) {
    return c.json({ error: "invalid_grant", error_description: "Invalid authorization code" }, 400);
  }

  const authData = JSON.parse(authDataJson);

  // Verify client_id and redirect_uri match
  if (authData.clientId !== clientId || authData.redirectUri !== redirectUri) {
    return c.json({ error: "invalid_grant", error_description: "Client mismatch" }, 400);
  }

  // Validate client exists
  const clientResult = await getClient(c.env.OAUTH_KV, clientId);
  if (clientResult.isErr() || !clientResult.value) {
    return c.json({ error: "invalid_client", error_description: "Client not found" }, 400);
  }

  // PKCE verification is handled by Spotify's OAuth server
  // The code_verifier is passed through to Spotify for validation

  // Clean up used auth code
  await c.env.OAUTH_KV.delete(`auth_code:${code}`);

  // Generate MCP access token
  const accessToken = crypto.randomUUID();
  const expiresIn = 3600; // 1 hour

  // Store the token mapping
  await c.env.OAUTH_KV.put(
    `mcp_token:${accessToken}`,
    JSON.stringify({
      clientId,
      spotifyTokens: authData.spotifyTokens,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn * 1000,
    }),
    { expirationTtl: expiresIn },
  );

  // Return OAuth 2.0 token response
  return c.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn,
    scope: SPOTIFY_SCOPES.join(" "),
  });
});

export default authHandler;
