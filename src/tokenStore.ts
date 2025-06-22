import { Result, ok, err } from 'neverthrow';
import type { NetworkError } from './result.ts';
import { createNetworkError } from './result.ts';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
  scope?: string;
  // Additional metadata can be added here as needed
  // Currently storing only essential OAuth token data
}

interface TokenStore {
  storage: DurableObjectStorage;
  tokens: StoredTokens | null;
}

// Create a new token store instance
function createTokenStore(storage: DurableObjectStorage): TokenStore {
  return {
    storage,
    tokens: null,
  };
}

// Store tokens in Durable Object storage
async function storeTokens(
  store: TokenStore,
  tokens: StoredTokens,
): Promise<Result<void, NetworkError>> {
  try {
    await store.storage.put('tokens', tokens);
    store.tokens = tokens;
    return ok(undefined);
  } catch (error) {
    return err(createNetworkError(`Failed to store tokens: ${error}`, undefined, error));
  }
}

// Get current tokens (no validation or refresh)
async function getTokens(store: TokenStore): Promise<Result<StoredTokens | null, NetworkError>> {
  // Load from storage if not in memory
  if (!store.tokens) {
    try {
      store.tokens = (await store.storage.get<StoredTokens>('tokens')) || null;
    } catch (error) {
      return err(createNetworkError(`Failed to load tokens: ${error}`, undefined, error));
    }
  }

  return ok(store.tokens);
}

// Clear tokens
async function clearTokens(store: TokenStore): Promise<Result<void, NetworkError>> {
  try {
    await store.storage.delete('tokens');
    store.tokens = null;
    return ok(undefined);
  } catch (error) {
    return err(createNetworkError(`Failed to clear tokens: ${error}`, undefined, error));
  }
}

// Main export: Handle Durable Object requests
// NOTE: Authentication should be handled at the Worker level before reaching Durable Objects
// This is an internal service that should only be accessible from the Worker itself
export async function tokenStore(state: DurableObjectState, request: Request): Promise<Response> {
  const store = createTokenStore(state.storage);
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    switch (path) {
      case '/store': {
        const body = (await request.json()) as StoredTokens;

        // Validate required fields
        if (!body.accessToken || !body.refreshToken || !body.expiresAt) {
          return new Response('Missing required fields', { status: 400 });
        }

        const result = await storeTokens(store, body);
        if (result.isErr()) {
          return new Response(result.error.message, { status: 500 });
        }

        return new Response('OK', { status: 200 });
      }

      case '/get': {
        const result = await getTokens(store);
        if (result.isErr()) {
          const error = result.error;
          return new Response(JSON.stringify({ error: error.message, type: error.type }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(result.value), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Refresh endpoint removed - handled by auth layer via TokenProviderAdapter

      case '/clear': {
        const result = await clearTokens(store);
        if (result.isErr()) {
          return new Response(result.error.message, { status: 500 });
        }

        return new Response('Tokens cleared', { status: 200 });
      }

      default:
        return new Response('Not found', { status: 404 });
    }
    // NOTE: Additional endpoints can be added as needed
    // Current implementation covers basic CRUD operations
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
