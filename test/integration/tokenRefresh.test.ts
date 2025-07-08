import { describe, test, expect } from "vitest";
import { createSpotifyClientWithRefresh } from "../../src/oauth.ts";
import type { SpotifyClientId, SpotifyAccessToken, SpotifyRefreshToken } from "../../src/types.ts";

describe.skipIf(!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_REFRESH_TOKEN)(
  "Token Refresh Integration",
  () => {
    test("creates Spotify client with valid token", async () => {
      const futureTime = Date.now() + 60 * 60 * 1000; // 1 hour from now

      const result = await createSpotifyClientWithRefresh(
        process.env.SPOTIFY_CLIENT_ID as SpotifyClientId,
        process.env.SPOTIFY_ACCESS_TOKEN as SpotifyAccessToken,
        process.env.SPOTIFY_REFRESH_TOKEN as SpotifyRefreshToken,
        futureTime,
      );

      expect(result.isOk()).toBe(true);

      // 実際に検索APIを呼び出してトークンが有効か確認
      if (result.isOk()) {
        const client = result.value;
        const searchResults = await client.search("test", ["track"], "JP", 1);
        expect(searchResults.tracks.items).toBeDefined();
      }
    });

    test("refreshes expired token automatically", async () => {
      const pastTime = Date.now() - 10 * 60 * 1000; // 10 minutes ago (expired)

      const result = await createSpotifyClientWithRefresh(
        process.env.SPOTIFY_CLIENT_ID as SpotifyClientId,
        process.env.SPOTIFY_ACCESS_TOKEN as SpotifyAccessToken,
        process.env.SPOTIFY_REFRESH_TOKEN as SpotifyRefreshToken,
        pastTime,
      );

      expect(result.isOk()).toBe(true);

      // リフレッシュされたトークンで検索APIを呼び出せることを確認
      if (result.isOk()) {
        const client = result.value;
        const searchResults = await client.search("refresh test", ["track"], "JP", 1);
        expect(searchResults.tracks.items).toBeDefined();
        expect(searchResults.tracks.items.length).toBeGreaterThanOrEqual(0);
      }
    });
  },
);
