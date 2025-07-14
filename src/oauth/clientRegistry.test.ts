import { describe, test, expect, beforeEach, vi } from "vitest";
import { registerClient, getClient, validateRedirectUri } from "@/oauth/clientRegistry.ts";
import { createMockKV } from "../../test/helpers/mockKV.ts";
import type { ClientRegistrationRequest, RegisteredClient } from "@/oauth/types.ts";

describe("clientRegistry", () => {
  let mockKV: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockKV = createMockKV();
  });

  describe("validateRedirectUris (internal)", () => {
    test("リダイレクトURIが空の場合エラーを返す", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: [],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe("At least one redirect_uri is required");
    });

    test("無効なURLの場合エラーを返す", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: ["not-a-valid-url"],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe("Invalid redirect URI: not-a-valid-url");
    });

    test("フラグメント（#）を含むURIの場合エラーを返す", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: ["https://example.com/callback#fragment"],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(
        "Redirect URI must not contain fragment: https://example.com/callback#fragment",
      );
    });

    test("非localhostでHTTPの場合エラーを返す", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: ["http://example.com/callback"],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(
        "Redirect URI must use HTTPS: http://example.com/callback",
      );
    });

    test("localhostではHTTPを許可する", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: ["http://localhost:3000/callback"],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isOk()).toBe(true);
    });
  });

  describe("registerClient", () => {
    test("有効なクライアントを登録できる", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: ["https://example.com/callback", "https://example.com/oauth/callback"],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isOk()).toBe(true);
      const client = result._unsafeUnwrap();
      expect(client.client_name).toBe("Test Client");
      expect(client.redirect_uris).toEqual(request.redirect_uris);
      expect(client.client_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(client.created_at).toBeGreaterThan(0);

      // KVに保存されていることを確認
      const storedData = await mockKV.get(`client:${client.client_id}`);
      expect(storedData).toBeTruthy();
    });

    test("複数のリダイレクトURIを登録できる", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Multi-URI Client",
        redirect_uris: [
          "https://example.com/callback",
          "https://example.com/oauth/callback",
          "http://localhost:3000/dev-callback",
        ],
      };

      const result = await registerClient(mockKV, request);

      expect(result.isOk()).toBe(true);
      const client = result._unsafeUnwrap();
      expect(client.redirect_uris).toHaveLength(3);
    });

    test("KVへの保存が失敗した場合エラーを返す", async () => {
      const request: ClientRegistrationRequest = {
        client_name: "Test Client",
        redirect_uris: ["https://example.com/callback"],
      };

      // KV.putをモックしてエラーを投げる
      mockKV.put = vi.fn().mockRejectedValueOnce(new Error("KV error"));

      const result = await registerClient(mockKV, request);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toContain("Failed to store client: Error: KV error");
    });
  });

  describe("getClient", () => {
    test("存在するクライアントを取得できる", async () => {
      const client: RegisteredClient = {
        client_id: "test-client-id",
        client_name: "Test Client",
        redirect_uris: ["https://example.com/callback"],
        created_at: Date.now(),
      };

      await mockKV.put("client:test-client-id", JSON.stringify(client));

      const result = await getClient(mockKV, "test-client-id");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(client);
    });

    test("存在しないクライアントの場合nullを返す", async () => {
      const result = await getClient(mockKV, "non-existent-client");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeNull();
    });

    test("無効なJSONの場合エラーを返す", async () => {
      await mockKV.put("client:invalid-json", "{ invalid json");

      const result = await getClient(mockKV, "invalid-json");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toContain("Failed to retrieve client:");
    });

    test("KVからの取得が失敗した場合エラーを返す", async () => {
      mockKV.get = vi.fn().mockRejectedValueOnce(new Error("KV error"));

      const result = await getClient(mockKV, "test-client-id");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toContain("Failed to retrieve client: Error: KV error");
    });
  });

  describe("validateRedirectUri", () => {
    const client: RegisteredClient = {
      client_id: "test-client-id",
      client_name: "Test Client",
      redirect_uris: ["https://example.com/callback", "https://example.com/oauth/callback"],
      created_at: Date.now(),
    };

    test("登録されているURIの場合成功する", () => {
      const result = validateRedirectUri(client, "https://example.com/callback");

      expect(result.isOk()).toBe(true);
    });

    test("登録されていないURIの場合エラーを返す", () => {
      const result = validateRedirectUri(client, "https://example.com/unauthorized");

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe("Redirect URI not registered for this client");
    });
  });
});
