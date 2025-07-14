import { Result, ok, err } from "neverthrow";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type {
  SpotifyClientId,
  SpotifyAccessToken,
  SpotifyRefreshToken,
  OAuthState,
  TokenResponse,
} from "@types";
import { generateCodeVerifier, generateCodeChallenge } from "@/pkce.ts";

export const {
  generateAuthorizationUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  createSpotifyClientWithRefresh,
} = (() => {
  const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
  const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
  const TOKEN_BUFFER_TIME = 5 * 60 * 1000; // 5 minutes buffer

  const buildTokenParams = (params: Record<string, string>): URLSearchParams => {
    return new URLSearchParams(params);
  };

  const parseTokenResponse = (data: any): TokenResponse => ({
    accessToken: data.access_token as SpotifyAccessToken,
    refreshToken: data.refresh_token as SpotifyRefreshToken,
    expiresIn: data.expires_in,
  });

  const makeTokenRequest = async (
    params: URLSearchParams,
    errorPrefix: string,
  ): Promise<Result<any, string>> => {
    try {
      const response = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        return err(`${errorPrefix}: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return ok(data);
    } catch (error) {
      return err(`${error}`);
    }
  };

  return {
    /**
     * Generate Spotify authorization URL with PKCE
     */
    async generateAuthorizationUrl(
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

        const params = buildTokenParams({
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          code_challenge_method: "S256",
          code_challenge: codeChallenge,
          state,
          scope: scopes.join(" "),
        });

        const url = `${SPOTIFY_AUTH_URL}?${params.toString()}`;

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
    },

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(
      clientId: SpotifyClientId,
      code: string,
      codeVerifier: string,
      redirectUri: string,
    ): Promise<Result<TokenResponse, string>> {
      const params = buildTokenParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      });

      try {
        const result = await makeTokenRequest(params, "Token exchange failed");
        if (result.isErr()) {
          return err(result.error);
        }

        return ok(parseTokenResponse(result.value));
      } catch (error) {
        return err(`Failed to exchange code for tokens: ${error}`);
      }
    },

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(
      clientId: SpotifyClientId,
      refreshToken: SpotifyRefreshToken,
    ): Promise<Result<TokenResponse, string>> {
      const params = buildTokenParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
      });

      try {
        const result = await makeTokenRequest(params, "Token refresh failed");
        if (result.isErr()) {
          return err(result.error);
        }

        const data = result.value;
        return ok({
          accessToken: data.access_token as SpotifyAccessToken,
          refreshToken: (data.refresh_token as SpotifyRefreshToken) || refreshToken,
          expiresIn: data.expires_in,
        });
      } catch (error) {
        return err(`Failed to refresh access token: ${error}`);
      }
    },

    /**
     * Create Spotify client with automatic token refresh
     */
    async createSpotifyClientWithRefresh(
      clientId: SpotifyClientId,
      accessToken: SpotifyAccessToken,
      refreshToken: SpotifyRefreshToken,
      expiresAt: number,
    ): Promise<Result<SpotifyApi, string>> {
      try {
        // Check if token needs refresh
        const now = Date.now();

        if (now + TOKEN_BUFFER_TIME >= expiresAt) {
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
    },
  };
})();
