import type { KVNamespace } from "@cloudflare/workers-types";
import type { RegisteredClient } from "./types.ts";

// Predefined clients that should be automatically registered
const PREDEFINED_CLIENTS: RegisteredClient[] = [
  {
    client_id: "712d4a09-4164-484d-b1ce-0c7e3fa35b1c", // Claude.ai client ID
    client_name: "Claude.ai",
    redirect_uris: ["https://claude.ai/api/mcp/auth_callback"],
    created_at: Date.now(),
  },
];

/**
 * Ensure predefined clients are registered in KV store
 */
export async function ensurePredefinedClients(kv: KVNamespace): Promise<void> {
  const CLIENT_KEY_PREFIX = "client:";
  const CLIENT_TTL = 365 * 24 * 60 * 60; // 1 year for predefined clients

  for (const client of PREDEFINED_CLIENTS) {
    const key = `${CLIENT_KEY_PREFIX}${client.client_id}`;

    // Check if client already exists
    const existing = await kv.get(key);
    if (!existing) {
      // Register the predefined client
      await kv.put(key, JSON.stringify(client), {
        expirationTtl: CLIENT_TTL,
      });
    }
  }
}
