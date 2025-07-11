import type { ClientRegistrationRequest, RegisteredClient } from "../../src/oauth/types.ts";

/**
 * Test fixtures for OAuth client registration
 * Following the fixture pattern from testing-conventions.md
 */
export const clientFixtures = {
  // Valid client with all optional fields populated
  valid: {
    client_name: "Test Client",
    redirect_uris: ["https://example.com/callback", "https://example.com/oauth/return"],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  } satisfies ClientRegistrationRequest,

  // Minimal client with only required fields
  minimal: {
    redirect_uris: ["https://localhost:3000/callback"],
  } satisfies ClientRegistrationRequest,

  // Invalid client missing required redirect_uris
  invalid: {
    client_name: "Invalid Client",
    grant_types: ["authorization_code"],
    // redirect_uris is missing - this is required
  } as ClientRegistrationRequest,

  // Client with multiple redirect URIs for testing validation
  multipleRedirects: {
    client_name: "Multi-Redirect Client",
    redirect_uris: [
      "https://app.example.com/callback",
      "https://staging.example.com/callback",
      "https://localhost:3000/callback",
      "http://localhost:8080/oauth/callback",
    ],
    grant_types: ["authorization_code"],
  } satisfies ClientRegistrationRequest,

  // Client with invalid redirect URI (contains fragment)
  invalidRedirectWithFragment: {
    client_name: "Invalid Redirect Client",
    redirect_uris: ["https://example.com/callback#section"],
  } satisfies ClientRegistrationRequest,

  // Client with non-HTTPS redirect URI (not localhost)
  invalidRedirectNonHttps: {
    client_name: "Non-HTTPS Client",
    redirect_uris: ["http://example.com/callback"],
  } satisfies ClientRegistrationRequest,

  // Client with malformed redirect URI
  invalidRedirectMalformed: {
    client_name: "Malformed URI Client",
    redirect_uris: ["not-a-valid-uri"],
  } satisfies ClientRegistrationRequest,

  // Registered client examples (after successful registration)
  registeredClient: {
    client_id: "550e8400-e29b-41d4-a716-446655440000",
    client_name: "Test Client",
    redirect_uris: ["https://example.com/callback"],
    created_at: 1704067200000, // 2024-01-01T00:00:00.000Z
  } satisfies RegisteredClient,

  registeredClientMinimal: {
    client_id: "550e8400-e29b-41d4-a716-446655440001",
    redirect_uris: ["https://localhost:3000/callback"],
    created_at: 1704067200000,
  } satisfies RegisteredClient,
} as const;

/**
 * Factory function to create a ClientRegistrationRequest with custom values
 */
export function createClientRequest(
  overrides: Partial<ClientRegistrationRequest> = {},
): ClientRegistrationRequest {
  return {
    redirect_uris: ["https://example.com/callback"],
    ...overrides,
  };
}

/**
 * Factory function to create a RegisteredClient with custom values
 */
export function createRegisteredClient(
  overrides: Partial<RegisteredClient> = {},
): RegisteredClient {
  return {
    client_id: crypto.randomUUID(),
    redirect_uris: ["https://example.com/callback"],
    created_at: Date.now(),
    ...overrides,
  };
}
