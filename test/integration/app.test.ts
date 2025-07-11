import { describe, it, expect } from "vitest";
import app from "../../src/index.ts";
import { createMockBindings, getMockKV } from "../helpers/mockBindings.ts";
import { SPOTIFY_SCOPES } from "../../src/constants.ts";

describe("Hono App Integration Tests", () => {
  describe("GET /health", () => {
    it("should return health status", async () => {
      const bindings = createMockBindings();
      const req = new Request("http://localhost/health");

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ status: "ok" });
    });
  });

  describe("GET /.well-known/oauth-authorization-server", () => {
    it("should return OAuth discovery metadata", async () => {
      const bindings = createMockBindings();
      const req = new Request("http://localhost/.well-known/oauth-authorization-server");

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json).toEqual({
        issuer: "http://localhost",
        authorization_endpoint: "http://localhost/auth/authorize",
        token_endpoint: "http://localhost/auth/token",
        registration_endpoint: "http://localhost/auth/register",
        scopes_supported: SPOTIFY_SCOPES,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
      });
    });

    it("should handle different origin URLs correctly", async () => {
      const bindings = createMockBindings();
      const req = new Request("https://example.com/.well-known/oauth-authorization-server");

      const res = await app.fetch(req, bindings);

      const json = await res.json();
      expect(json.issuer).toBe("https://example.com");
      expect(json.authorization_endpoint).toBe("https://example.com/auth/authorize");
      expect(json.token_endpoint).toBe("https://example.com/auth/token");
    });
  });

  describe("POST /mcp", () => {
    it("should reject request without authorization header", async () => {
      const bindings = createMockBindings();
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      });

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized");
    });

    it("should reject request with invalid bearer token", async () => {
      const bindings = createMockBindings();
      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      });

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Invalid token");
    });

    it("should reject request with expired token", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);
      const token = "test-mcp-token";

      // Store expired token
      await mockKV.put(
        `mcp_token:${token}`,
        JSON.stringify({
          clientId: "test-client",
          spotifyTokens: {
            accessToken: "spotify-access-token",
            refreshToken: "spotify-refresh-token",
            expiresAt: Date.now() + 3600000,
          },
          createdAt: Date.now() - 7200000, // 2 hours ago
          expiresAt: Date.now() - 3600000, // Expired 1 hour ago
        }),
        { expirationTtl: 3600 },
      );

      const req = new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      });

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Token expired");

      // Verify token was deleted
      const deletedToken = await mockKV.get(`mcp_token:${token}`);
      expect(deletedToken).toBeNull();
    });
  });

  describe("CORS handling", () => {
    it("should handle OPTIONS preflight requests", async () => {
      const bindings = createMockBindings({
        corsOrigin: "https://example.com",
      });

      const req = new Request("http://localhost/mcp", {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(204);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
      expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
      expect(res.headers.get("Access-Control-Allow-Headers")).toContain("Content-Type");
      expect(res.headers.get("Access-Control-Max-Age")).toBe("600");
      expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("should add CORS headers to regular responses", async () => {
      const bindings = createMockBindings({
        corsOrigin: "https://example.com",
      });

      const req = new Request("http://localhost/health", {
        headers: {
          Origin: "https://example.com",
        },
      });

      const res = await app.fetch(req, bindings);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
      expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("should use wildcard origin when CORS_ORIGIN not set", async () => {
      const bindings = createMockBindings();
      // Remove CORS_ORIGIN from bindings to simulate it not being set
      delete (bindings as any).CORS_ORIGIN;

      const req = new Request("http://localhost/health", {
        headers: {
          Origin: "https://any-origin.com",
        },
      });

      const res = await app.fetch(req, bindings);

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });
  });

  describe("POST /auth/register", () => {
    it("should register a new client", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      const req = new Request("http://localhost/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_name: "Test MCP Client",
          redirect_uris: ["http://localhost:3000/callback"],
          grant_types: ["authorization_code"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
        }),
      });

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json).toMatchObject({
        client_id: expect.any(String),
        client_id_issued_at: expect.any(Number),
        grant_types: ["authorization_code"],
        response_types: ["code"],
        redirect_uris: ["http://localhost:3000/callback"],
        token_endpoint_auth_method: "none",
        client_name: "Test MCP Client",
      });

      // Verify client was stored
      const storedClient = await mockKV.get(`client:${json.client_id}`);
      expect(storedClient).toBeTruthy();
    });

    it("should reject invalid registration request", async () => {
      const bindings = createMockBindings();

      const req = new Request("http://localhost/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe("invalid_request");
    });
  });

  describe("GET /auth/authorize", () => {
    it("should show authorization page with valid parameters", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Register a client first
      await mockKV.put(
        "client:test-client-id",
        JSON.stringify({
          client_id: "test-client-id",
          client_name: "Test Client",
          redirect_uris: ["http://localhost:3000/callback"],
          created_at: Date.now(),
        }),
      );

      const req = new Request(
        "http://localhost/auth/authorize?" +
          "client_id=test-client-id&" +
          "redirect_uri=http://localhost:3000/callback&" +
          "state=test-state&" +
          "code_challenge=test-challenge&" +
          "code_challenge_method=S256",
      );

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/html");

      const html = await res.text();
      expect(html).toContain("Authorize Spotify MCP Server");
      expect(html).toContain("Connect with Spotify");
      expect(html).toContain("state=test-state");

      // Verify auth request was stored
      const authRequest = await mockKV.get("auth_request:test-state");
      expect(authRequest).toBeTruthy();
      const parsed = JSON.parse(authRequest!);
      expect(parsed).toEqual({
        clientId: "test-client-id",
        redirectUri: "http://localhost:3000/callback",
        codeChallenge: "test-challenge",
        state: "test-state",
      });
    });

    it("should reject missing parameters", async () => {
      const bindings = createMockBindings();

      const req = new Request("http://localhost/auth/authorize?client_id=test");

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Missing or invalid parameters");
    });

    it("should reject invalid client", async () => {
      const bindings = createMockBindings();

      const req = new Request(
        "http://localhost/auth/authorize?" +
          "client_id=invalid-client&" +
          "redirect_uri=http://localhost:3000/callback&" +
          "state=test-state&" +
          "code_challenge=test-challenge&" +
          "code_challenge_method=S256",
      );

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Invalid client");
    });

    it("should reject unregistered redirect URI", async () => {
      const bindings = createMockBindings();
      const mockKV = getMockKV(bindings);

      // Register client with different redirect URI
      await mockKV.put(
        "client:test-client-id",
        JSON.stringify({
          client_id: "test-client-id",
          client_name: "Test Client",
          redirect_uris: ["http://localhost:4000/different"],
          created_at: Date.now(),
        }),
      );

      const req = new Request(
        "http://localhost/auth/authorize?" +
          "client_id=test-client-id&" +
          "redirect_uri=http://localhost:3000/callback&" +
          "state=test-state&" +
          "code_challenge=test-challenge&" +
          "code_challenge_method=S256",
      );

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Invalid redirect URI");
    });
  });

  describe("404 handling", () => {
    it("should return 404 for unknown routes", async () => {
      const bindings = createMockBindings();
      const req = new Request("http://localhost/unknown-route");

      const res = await app.fetch(req, bindings);

      expect(res.status).toBe(404);
    });
  });
});
