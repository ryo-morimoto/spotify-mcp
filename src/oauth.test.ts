import { describe, test, expect } from "vitest";
import { generateAuthorizationUrl } from "./oauth.ts";
import type { SpotifyClientId } from "./types.ts";

describe("OAuth", () => {
  describe("generateAuthorizationUrl", () => {
    test("generates valid authorization URL structure", async () => {
      const clientId = "test-client-id" as SpotifyClientId;
      const redirectUri = "http://localhost:3000/callback";
      const scopes = ["user-read-private", "user-read-email"];

      const result = await generateAuthorizationUrl(clientId, redirectUri, scopes);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const { url, state } = result.value;

        // URLの構造を検証（純粋な文字列処理）
        const urlObj = new URL(url);
        expect(urlObj.origin).toBe("https://accounts.spotify.com");
        expect(urlObj.pathname).toBe("/authorize");

        // 必須パラメータの存在を確認
        expect(urlObj.searchParams.get("client_id")).toBe(clientId);
        expect(urlObj.searchParams.get("response_type")).toBe("code");
        expect(urlObj.searchParams.get("redirect_uri")).toBe(redirectUri);
        expect(urlObj.searchParams.get("code_challenge_method")).toBe("S256");
        expect(urlObj.searchParams.get("code_challenge")).toBeTruthy();
        expect(urlObj.searchParams.get("state")).toBe(state.state);
        expect(urlObj.searchParams.get("scope")).toBe(scopes.join(" "));

        // PKCEパラメータの検証
        expect(state.codeVerifier).toBeTruthy();
        expect(state.codeVerifier.length).toBeGreaterThan(40); // Base64url encoded 32 bytes
        expect(state.state).toBeTruthy();
        expect(state.redirectUri).toBe(redirectUri);
      }
    });

    test("generates different code verifiers for each request", async () => {
      const clientId = "test-client-id" as SpotifyClientId;
      const redirectUri = "http://localhost:3000/callback";
      const scopes = ["user-read-private"];

      const result1 = await generateAuthorizationUrl(clientId, redirectUri, scopes);
      const result2 = await generateAuthorizationUrl(clientId, redirectUri, scopes);

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);

      if (result1.isOk() && result2.isOk()) {
        // 各リクエストで異なるcode verifierが生成されることを確認
        expect(result1.value.state.codeVerifier).not.toBe(result2.value.state.codeVerifier);
        expect(result1.value.state.state).not.toBe(result2.value.state.state);
      }
    });
  });
});
