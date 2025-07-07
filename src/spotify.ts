import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { Result, ok, err } from "neverthrow";
import type { SpotifyConfig } from "./types.ts";

export function createSpotifyClient(config: SpotifyConfig): Result<SpotifyApi, string> {
  try {
    const accessToken = {
      access_token: config.accessToken,
      token_type: "Bearer" as const,
      expires_in: config.expiresAt ? Math.floor((config.expiresAt - Date.now()) / 1000) : 3600,
      refresh_token: config.refreshToken || "",
    };

    const client = SpotifyApi.withAccessToken(config.clientId, accessToken);
    return ok(client);
  } catch (error) {
    return err(`Failed to create Spotify client: ${error}`);
  }
}
