import { describe, test, expect, vi, beforeEach } from "vitest";
import { createSpotifyClient } from "@/spotify.ts";
import type { SpotifyConfig } from "@types";

// Mock SpotifyApi
vi.mock("@spotify/web-api-ts-sdk", () => ({
  SpotifyApi: {
    withAccessToken: vi.fn(),
  },
}));

import { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("createSpotifyClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  test("有効な設定でSpotifyクライアントを作成できる", () => {
    const mockClient = { mock: "client" };
    vi.mocked(SpotifyApi.withAccessToken).mockReturnValueOnce(mockClient as any);

    const config: SpotifyConfig = {
      clientId: "test-client-id" as any,
      redirectUri: "https://example.com/callback",
      accessToken: "test-access-token" as any,
      refreshToken: "test-refresh-token" as any,
      expiresAt: Date.now() + 3600000, // 1 hour from now
    };

    const result = createSpotifyClient(config);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(mockClient);

    // SpotifyApiが正しいパラメータで呼ばれたことを確認
    expect(SpotifyApi.withAccessToken).toHaveBeenCalledWith(config.clientId, {
      access_token: config.accessToken,
      token_type: "Bearer",
      expires_in: expect.any(Number),
      refresh_token: config.refreshToken,
    });
  });

  test("expiresAtから正しいexpires_inを計算する", () => {
    const mockClient = { mock: "client" };
    vi.mocked(SpotifyApi.withAccessToken).mockReturnValueOnce(mockClient as any);

    const now = Date.now();
    const expiresAt = now + 7200000; // 2 hours from now
    const config: SpotifyConfig = {
      clientId: "test-client-id" as any,
      redirectUri: "https://example.com/callback",
      accessToken: "test-access-token" as any,
      refreshToken: "test-refresh-token" as any,
      expiresAt,
    };

    createSpotifyClient(config);

    const calledArgs = vi.mocked(SpotifyApi.withAccessToken).mock.calls[0][1];
    // expires_inは秒単位で、約7200秒（2時間）になるはず
    // 実際の計算: Math.floor((expiresAt - Date.now()) / 1000)
    // テスト実行時のわずかな時間差を考慮
    expect(calledArgs.expires_in).toBeGreaterThanOrEqual(7195);
    expect(calledArgs.expires_in).toBeLessThanOrEqual(7200);
  });

  test("expiresAtがない場合デフォルトの3600秒を使用する", () => {
    const mockClient = { mock: "client" };
    vi.mocked(SpotifyApi.withAccessToken).mockReturnValueOnce(mockClient as any);

    const config: SpotifyConfig = {
      clientId: "test-client-id" as any,
      redirectUri: "https://example.com/callback",
      accessToken: "test-access-token" as any,
      refreshToken: "test-refresh-token" as any,
      expiresAt: undefined,
    };

    createSpotifyClient(config);

    const calledArgs = vi.mocked(SpotifyApi.withAccessToken).mock.calls[0][1];
    expect(calledArgs.expires_in).toBe(3600);
  });

  test("refreshTokenが空の場合そのまま使用する", () => {
    const mockClient = { mock: "client" };
    vi.mocked(SpotifyApi.withAccessToken).mockReturnValueOnce(mockClient as any);

    const config: SpotifyConfig = {
      clientId: "test-client-id" as any,
      redirectUri: "https://example.com/callback",
      accessToken: "test-access-token" as any,
      refreshToken: "" as any,
      expiresAt: Date.now() + 3600000,
    };

    createSpotifyClient(config);

    const calledArgs = vi.mocked(SpotifyApi.withAccessToken).mock.calls[0][1];
    expect(calledArgs.refresh_token).toBe("");
  });

  test("SpotifyApi作成時にエラーが発生した場合エラーを返す", () => {
    vi.mocked(SpotifyApi.withAccessToken).mockImplementationOnce(() => {
      throw new Error("API initialization failed");
    });

    const config: SpotifyConfig = {
      clientId: "test-client-id" as any,
      redirectUri: "https://example.com/callback",
      accessToken: "test-access-token" as any,
      refreshToken: "test-refresh-token" as any,
      expiresAt: Date.now() + 3600000,
    };

    const result = createSpotifyClient(config);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(
      "Failed to create Spotify client: Error: API initialization failed",
    );
  });

  test("予期しないエラーでも適切にハンドリングする", () => {
    vi.mocked(SpotifyApi.withAccessToken).mockImplementationOnce(() => {
      throw "Unexpected error type";
    });

    const config: SpotifyConfig = {
      clientId: "test-client-id" as any,
      redirectUri: "https://example.com/callback",
      accessToken: "test-access-token" as any,
      refreshToken: "test-refresh-token" as any,
      expiresAt: Date.now() + 3600000,
    };

    const result = createSpotifyClient(config);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toContain("Failed to create Spotify client:");
  });
});
