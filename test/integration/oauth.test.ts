import { describe, test, expect } from "vitest";
import { generateAuthorizationUrl } from "../../src/oauth.ts";
import type { SpotifyClientId } from "../../src/types.ts";

describe.skipIf(!process.env.SPOTIFY_CLIENT_ID)("OAuth Integration", () => {
  test("generates authorization URL that Spotify accepts", async () => {
    const clientId = process.env.SPOTIFY_CLIENT_ID as SpotifyClientId;
    const redirectUri = "http://localhost:8787/auth/callback";
    const scopes = ["user-read-private"];

    const result = await generateAuthorizationUrl(clientId, redirectUri, scopes);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const { url } = result.value;

      // URLにアクセスできることを確認（実際にリダイレクトされるかチェック）
      const response = await fetch(url, {
        redirect: "manual", // リダイレクトを自動的に追跡しない
      });

      // Spotifyのログインページへのリダイレクト（303）を期待
      expect(response.status).toBe(303);

      // LocationヘッダーがSpotifyのログインページを指していることを確認
      const location = response.headers.get("location");
      expect(location).toBeTruthy();
      if (location) {
        expect(location).toContain("accounts.spotify.com");
      }
    }
  });
});
