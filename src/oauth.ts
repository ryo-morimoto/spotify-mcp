import { Result, ok, err } from "neverthrow";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type {
  SpotifyClientId,
  SpotifyAccessToken,
  SpotifyRefreshToken,
  OAuthState,
  TokenResponse,
} from "./types.ts";
import { generateCodeVerifier, generateCodeChallenge } from "./pkce.ts";

/**
 * Generate Spotify authorization URL with PKCE
 */
export async function generateAuthorizationUrl(
  clientId: SpotifyClientId,
  redirectUri: string,
  scopes: string[],
): Promise<Result<{ url: string; state: OAuthState }, string>> {
  try {
    const codeVerifierResult = generateCodeVerifier();
    if (codeVerifierResult.isErr()) {
      return err("Failed to generate code verifier");
    }
    const codeVerifier = codeVerifierResult.value;

    const codeChallengeResult = await generateCodeChallenge(codeVerifier);
    if (codeChallengeResult.isErr()) {
      return err("Failed to generate code challenge");
    }
    const codeChallenge = codeChallengeResult.value;

    // Generate random state for CSRF protection
    const state = crypto.randomUUID();

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      state,
      scope: scopes.join(" "),
    });

    const url = `https://accounts.spotify.com/authorize?${params.toString()}`;

    return ok({
      url,
      state: {
        codeVerifier,
        state,
        redirectUri,
      },
    });
  } catch (error) {
    return err(`Failed to generate authorization URL: ${error}`);
  }
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  clientId: SpotifyClientId,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<Result<TokenResponse, string>> {
  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      return err(`Token exchange failed: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return ok({
      accessToken: data.access_token as SpotifyAccessToken,
      refreshToken: data.refresh_token as SpotifyRefreshToken,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    return err(`Failed to exchange code for tokens: ${error}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  clientId: SpotifyClientId,
  refreshToken: SpotifyRefreshToken,
): Promise<Result<TokenResponse, string>> {
  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      return err(`Token refresh failed: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return ok({
      accessToken: data.access_token as SpotifyAccessToken,
      refreshToken: (data.refresh_token as SpotifyRefreshToken) || refreshToken,
      expiresIn: data.expires_in,
    });
  } catch (error) {
    return err(`Failed to refresh access token: ${error}`);
  }
}

/**
 * Create Spotify client with automatic token refresh
 */
export async function createSpotifyClientWithRefresh(
  clientId: SpotifyClientId,
  accessToken: SpotifyAccessToken,
  refreshToken: SpotifyRefreshToken,
  expiresAt: number,
): Promise<Result<SpotifyApi, string>> {
  try {
    // Check if token needs refresh
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    if (now + bufferTime >= expiresAt) {
      // Token is expired or about to expire, refresh it
      const refreshResult = await refreshAccessToken(clientId, refreshToken);
      if (refreshResult.isErr()) {
        return err(refreshResult.error);
      }

      const newTokens = refreshResult.value;

      const client = SpotifyApi.withAccessToken(clientId, {
        access_token: newTokens.accessToken,
        token_type: "Bearer" as const,
        expires_in: newTokens.expiresIn,
        refresh_token: newTokens.refreshToken,
      });

      return ok(client);
    }

    // Token is still valid
    const client = SpotifyApi.withAccessToken(clientId, {
      access_token: accessToken,
      token_type: "Bearer" as const,
      expires_in: Math.floor((expiresAt - Date.now()) / 1000),
      refresh_token: refreshToken,
    });

    return ok(client);
  } catch (error) {
    return err(`Failed to create Spotify client: ${error}`);
  }
}
