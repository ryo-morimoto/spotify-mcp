import type { KVNamespace } from "@cloudflare/workers-types";
import type { ClientRegistrationRequest, RegisteredClient } from "./types.ts";
import { Result, ok, err } from "neverthrow";

const CLIENT_KEY_PREFIX = "client:";
const CLIENT_TTL = 30 * 24 * 60 * 60; // 30 days

/**
 * Validates redirect URIs according to OAuth 2.0 requirements
 */
function validateRedirectUris(uris: string[]): Result<void, string> {
  if (!uris || uris.length === 0) {
    return err("At least one redirect_uri is required");
  }

  for (const uri of uris) {
    try {
      const url = new URL(uri);

      // Disallow fragment component
      if (url.hash) {
        return err(`Redirect URI must not contain fragment: ${uri}`);
      }

      // For production, enforce HTTPS (except localhost)
      if (url.protocol !== "https:" && !url.hostname.includes("localhost")) {
        return err(`Redirect URI must use HTTPS: ${uri}`);
      }
    } catch {
      return err(`Invalid redirect URI: ${uri}`);
    }
  }

  return ok(undefined);
}

/**
 * Register a new OAuth client
 */
export async function registerClient(
  kv: KVNamespace,
  request: ClientRegistrationRequest,
): Promise<Result<RegisteredClient, string>> {
  // Validate redirect URIs
  const validationResult = validateRedirectUris(request.redirect_uris);
  if (validationResult.isErr()) {
    return err(validationResult.error);
  }

  // Generate client ID
  const clientId = crypto.randomUUID();

  // Create client record
  const client: RegisteredClient = {
    client_id: clientId,
    client_name: request.client_name,
    redirect_uris: request.redirect_uris,
    created_at: Date.now(),
  };

  // Store in KV
  try {
    await kv.put(`${CLIENT_KEY_PREFIX}${clientId}`, JSON.stringify(client), {
      expirationTtl: CLIENT_TTL,
    });

    return ok(client);
  } catch (error) {
    return err(`Failed to store client: ${error}`);
  }
}

/**
 * Retrieve a registered client
 */
export async function getClient(
  kv: KVNamespace,
  clientId: string,
): Promise<Result<RegisteredClient | null, string>> {
  try {
    const data = await kv.get(`${CLIENT_KEY_PREFIX}${clientId}`);
    if (!data) {
      return ok(null);
    }

    const client = JSON.parse(data) as RegisteredClient;
    return ok(client);
  } catch (error) {
    return err(`Failed to retrieve client: ${error}`);
  }
}

/**
 * Validate a redirect URI against registered client
 */
export function validateRedirectUri(
  client: RegisteredClient,
  redirectUri: string,
): Result<void, string> {
  if (!client.redirect_uris.includes(redirectUri)) {
    return err("Redirect URI not registered for this client");
  }
  return ok(undefined);
}
