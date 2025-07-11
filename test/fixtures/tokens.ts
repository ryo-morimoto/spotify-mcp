import type {
  SpotifyAccessToken,
  SpotifyRefreshToken,
  OAuthState,
  TokenResponse,
} from "../../src/types.ts";

/**
 * Test fixtures for OAuth tokens and authorization
 * Following the fixture pattern from testing-conventions.md
 */
export const tokenFixtures = {
  // Valid access token
  validAccessToken: "BQoS_7...very_long_spotify_access_token" as SpotifyAccessToken,

  // Valid refresh token
  validRefreshToken: "AQDf8...very_long_spotify_refresh_token" as SpotifyRefreshToken,

  // Expired access token (for testing refresh flow)
  expiredAccessToken: "BQoS_expired...token" as SpotifyAccessToken,

  // Invalid/malformed access token
  invalidAccessToken: "not-a-valid-token" as SpotifyAccessToken,

  // Valid authorization code
  validAuthorizationCode: "AQCfG...authorization_code",

  // Invalid/expired authorization code
  invalidAuthorizationCode: "invalid_code",

  // PKCE values
  pkce: {
    // Valid code verifier (43-128 characters, URL-safe)
    codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",

    // Valid code challenge (SHA256 hash of verifier, base64url encoded)
    codeChallenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",

    // Another set for testing different flows
    alternativeCodeVerifier: "M25iVXpKU3puUjRlYWg3T1NDTDQtcW1ROUY5YXlwalNoc0hhakxifmZHag",
    alternativeCodeChallenge: "qjrzSW9gMiUgpUvqgEPE4_-8swvyCtfOVvg55o5S_es",
  },

  // OAuth state values
  states: {
    // Valid state for CSRF protection
    validState: "550e8400-e29b-41d4-a716-446655440000",

    // Another valid state
    alternativeState: "123e4567-e89b-12d3-a456-426614174000",

    // Invalid state (for testing CSRF protection)
    invalidState: "invalid-state",
  },

  // Complete OAuth state objects
  oauthStates: {
    // Standard OAuth state
    standard: {
      codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      state: "550e8400-e29b-41d4-a716-446655440000",
      redirectUri: "https://example.com/callback",
    } satisfies OAuthState,

    // OAuth state with MCP session
    withMcpSession: {
      codeVerifier: "M25iVXpKU3puUjRlYWg3T1NDTDQtcW1ROUY5YXlwalNoc0hhakxifmZHag",
      state: "123e4567-e89b-12d3-a456-426614174000",
      redirectUri: "https://localhost:3000/callback",
      mcpSession: "mcp_session_123456",
    } satisfies OAuthState,
  },

  // Spotify API token responses
  spotifyTokenResponses: {
    // Standard token response
    standard: {
      access_token: "BQoS_7...very_long_spotify_access_token",
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: "AQDf8...very_long_spotify_refresh_token",
      scope: "user-read-private user-read-email",
    },

    // Token response without refresh token (for some grant types)
    withoutRefreshToken: {
      access_token: "BQoS_7...access_token_only",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "user-read-private",
    },

    // Error response from Spotify
    errorResponse: {
      error: "invalid_grant",
      error_description: "Authorization code expired",
    },
  },

  // Parsed token responses
  tokenResponses: {
    // Valid token response
    valid: {
      accessToken: "BQoS_7...very_long_spotify_access_token" as SpotifyAccessToken,
      refreshToken: "AQDf8...very_long_spotify_refresh_token" as SpotifyRefreshToken,
      expiresIn: 3600,
    } satisfies TokenResponse,

    // Token response with short expiry (for testing refresh)
    shortExpiry: {
      accessToken: "BQoS_7...short_expiry_token" as SpotifyAccessToken,
      refreshToken: "AQDf8...refresh_token" as SpotifyRefreshToken,
      expiresIn: 60, // 1 minute
    } satisfies TokenResponse,
  },

  // Timestamps for testing token expiry
  timestamps: {
    // Current time (mocked)
    now: 1704067200000, // 2024-01-01T00:00:00.000Z

    // One hour from now
    oneHourFromNow: 1704070800000, // 2024-01-01T01:00:00.000Z

    // One hour ago (expired)
    oneHourAgo: 1704063600000, // 2023-12-31T23:00:00.000Z
  },
} as const;

/**
 * Factory function to create a Spotify token response
 */
export function createSpotifyTokenResponse(
  overrides: Partial<typeof tokenFixtures.spotifyTokenResponses.standard> = {},
): typeof tokenFixtures.spotifyTokenResponses.standard {
  return {
    access_token: "BQoS_7...generated_access_token" as any,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: "AQDf8...generated_refresh_token" as any,
    scope: "user-read-private user-read-email",
    ...overrides,
  };
}

/**
 * Factory function to create a TokenResponse
 */
export function createTokenResponse(overrides: Partial<TokenResponse> = {}): TokenResponse {
  return {
    accessToken: ("BQoS_7..." + crypto.randomUUID()) as SpotifyAccessToken,
    refreshToken: ("AQDf8..." + crypto.randomUUID()) as SpotifyRefreshToken,
    expiresIn: 3600,
    ...overrides,
  };
}

/**
 * Factory function to create an OAuth state
 */
export function createOAuthState(overrides: Partial<OAuthState> = {}): OAuthState {
  return {
    codeVerifier: generateMockCodeVerifier(),
    state: crypto.randomUUID(),
    redirectUri: "https://example.com/callback",
    ...overrides,
  };
}

/**
 * Generate a mock code verifier (43-128 characters, URL-safe)
 */
function generateMockCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * Generate a mock code challenge from a verifier
 */
export async function generateMockCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
