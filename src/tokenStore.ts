import { Result, ok, err } from 'neverthrow';
import { refreshToken } from './auth/index.ts';
import type { NetworkError, AuthError } from './result.ts';
import { createNetworkError, createAuthError } from './result.ts';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  clientId: string;
  clientSecret?: string;
  // TODO: Add additional token metadata [LOW]
  // - [ ] scope: string[] - Track granted permissions
  // - [ ] userId: string - Spotify user ID
  // - [ ] market: string - User's market for region-specific content
  // - [ ] tokenType: string - Usually 'Bearer'
  // Impact: Enables better user tracking and permission management
}

interface TokenStore {
  storage: DurableObjectStorage;
  tokens: StoredTokens | null;
  refreshTimer: number | null;
}

// Create a new token store instance
function createTokenStore(storage: DurableObjectStorage): TokenStore {
  return {
    storage,
    tokens: null,
    refreshTimer: null,
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
    setupAutoRefresh(store);
    return ok(undefined);
  } catch (error) {
    return err(createNetworkError(`Failed to store tokens: ${error}`, undefined, error));
  }
}

// Get current valid tokens
async function getTokens(
  store: TokenStore,
): Promise<Result<{ accessToken: string; expiresAt: number }, NetworkError | AuthError>> {
  // Load from storage if not in memory
  if (!store.tokens) {
    try {
      store.tokens = (await store.storage.get<StoredTokens>('tokens')) || null;
      if (store.tokens) {
        setupAutoRefresh(store);
      }
    } catch (error) {
      return err(createNetworkError(`Failed to load tokens: ${error}`, undefined, error));
    }
  }

  if (!store.tokens) {
    return err(createAuthError('No tokens stored', 'missing'));
  }

  // Check if token is expired
  const now = Date.now();
  if (store.tokens.expiresAt <= now) {
    // Token expired, try to refresh
    const refreshResult = await refreshStoredTokens(store);
    if (refreshResult.isErr()) {
      return err(refreshResult.error);
    }
  }

  return ok({
    accessToken: store.tokens.accessToken,
    expiresAt: store.tokens.expiresAt,
  });
}

// Refresh tokens
async function refreshStoredTokens(
  store: TokenStore,
): Promise<Result<void, NetworkError | AuthError>> {
  if (!store.tokens) {
    return err(createAuthError('No tokens to refresh', 'missing'));
  }

  const refreshResult = await refreshToken(store.tokens.refreshToken, store.tokens.clientId);

  if (refreshResult.isErr()) {
    return err(refreshResult.error);
  }

  const newTokens = refreshResult.value;

  // Update stored tokens
  store.tokens = {
    ...store.tokens,
    accessToken: newTokens.accessToken,
    expiresAt: newTokens.expiresAt,
    // Keep existing refresh token if not provided in response
    refreshToken: newTokens.refreshToken || store.tokens.refreshToken,
  };

  // Persist to storage
  await store.storage.put('tokens', store.tokens);

  // Reset auto-refresh timer
  setupAutoRefresh(store);

  return ok(undefined);
}

// Clear stored tokens
async function clearTokens(store: TokenStore): Promise<Result<void, NetworkError>> {
  try {
    await store.storage.delete('tokens');
    store.tokens = null;
    clearAutoRefresh(store);
    return ok(undefined);
  } catch (error) {
    return err(createNetworkError(`Failed to clear tokens: ${error}`, undefined, error));
  }
}

// Set up automatic token refresh
function setupAutoRefresh(store: TokenStore): void {
  clearAutoRefresh(store);

  if (!store.tokens) return;

  // Calculate when to refresh (5 minutes before expiry)
  const now = Date.now();
  const expiresAt = store.tokens.expiresAt;
  const refreshTime = expiresAt - 5 * 60 * 1000; // 5 minutes before expiry
  const delay = Math.max(refreshTime - now, 0);

  // TODO: Implement exponential backoff for refresh failures [MID]
  // - [ ] Track consecutive refresh failures
  // - [ ] Increase delay between retry attempts
  // - [ ] Alert when max retries exceeded
  // Related: setupAutoRefresh function below

  if (delay > 0) {
    store.refreshTimer = setTimeout(() => {
      refreshStoredTokens(store).catch((error) => {
        console.error('Auto-refresh failed:', error);
        // FIXME: Implement proper error recovery [HIGH]
        // - [ ] Retry with exponential backoff
        // - [ ] Notify user of authentication issues
        // - [ ] Fall back to manual re-authentication
        // Impact: Token refresh failures cause service interruption
      });
    }, delay) as unknown as number;
  }
}

// Clear auto-refresh timer
function clearAutoRefresh(store: TokenStore): void {
  if (store.refreshTimer !== null) {
    clearTimeout(store.refreshTimer);
    store.refreshTimer = null;
  }
}

// Main export: Handle Durable Object requests
// TODO: Add request authentication and rate limiting [HIGH]
// - [ ] Verify requests come from authorized sources
// - [ ] Implement per-user rate limits
// - [ ] Add request logging for debugging
// Security: Currently accepts requests from any source
export async function tokenStore(state: DurableObjectState, request: Request): Promise<Response> {
  const store = createTokenStore(state.storage);
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    switch (path) {
      case '/store': {
        const body = (await request.json()) as StoredTokens;

        // Validate required fields
        if (!body.accessToken || !body.refreshToken || !body.expiresAt || !body.clientId) {
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
          const status = error.type === 'AuthError' ? 401 : 500;
          return new Response(JSON.stringify({ error: error.message, type: error.type }), {
            status,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(result.value), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case '/refresh': {
        // Load tokens first if not in memory
        if (!store.tokens) {
          store.tokens = (await store.storage.get<StoredTokens>('tokens')) || null;
        }

        const result = await refreshStoredTokens(store);
        if (result.isErr()) {
          return new Response(JSON.stringify({ error: 'Refresh failed', details: result.error }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('Token refreshed', { status: 200 });
      }

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
    // TODO: Add more token store endpoints [LOW]
    // - [ ] /status - Get token status without refreshing
    // - [ ] /validate - Check if token is valid
    // - [ ] /revoke - Revoke refresh token
    // - [ ] /metrics - Get usage statistics
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
