# Token Manager Component Specification

## Purpose & Responsibility

The Token Manager component handles the complete lifecycle of OAuth tokens, ensuring valid authentication for all Spotify API operations. It is responsible for:

- Storing OAuth tokens securely
- Checking token expiration with clock skew tolerance
- Automatically refreshing tokens before expiration
- Providing always-valid tokens to consumers
- Managing token persistence across different environments
- Handling concurrent token operations safely

This component abstracts token complexity from other components, providing a simple interface for authentication.

## Interface Definition

### Public API

```typescript
// Core Token Manager Interface
export interface TokenManager {
  getToken(): Promise<Result<string, NetworkError | AuthError>>
  refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>>
}

// Token Storage Interface
export interface TokenStore {
  get(userId: string): Promise<Result<StoredTokens | null, NetworkError>>
  set(userId: string, tokens: StoredTokens): Promise<Result<void, NetworkError>>
  delete(userId: string): Promise<Result<void, NetworkError>>
  clear(): Promise<Result<void, NetworkError>>
}

// Token Manager Factory
export function createTokenManager(options: TokenManagerOptions): TokenManager

// Durable Object Token Manager
export class SpotifyTokenDurableObject extends DurableObject {
  async fetch(request: Request): Promise<Response>
}
```

### Type Definitions

```typescript
// Token Storage Types
interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number        // Unix timestamp (ms)
  scopes: string[]         // Granted scopes
  tokenType: 'Bearer'
  lastRefreshed: number    // Unix timestamp (ms)
  refreshCount: number     // Total refresh count
}

// Token Manager Options
interface TokenManagerOptions {
  store: TokenStore
  clientId: string
  clientSecret?: string
  refreshBuffer?: number   // Minutes before expiry to refresh (default: 5)
  maxRetries?: number      // Max refresh attempts (default: 3)
  onTokenRefreshed?: (tokens: StoredTokens) => void
}

// Durable Object Request/Response Types
interface TokenRequest {
  action: 'get' | 'set' | 'refresh' | 'delete' | 'status'
  userId: string
  tokens?: OAuthTokens     // For 'set' action
}

interface TokenResponse {
  success: boolean
  data?: {
    accessToken?: string
    expiresAt?: number
    status?: TokenStatus
  }
  error?: {
    type: string
    message: string
  }
}

interface TokenStatus {
  hasToken: boolean
  isExpired: boolean
  expiresAt?: number
  lastRefreshed?: number
  refreshCount?: number
  scopes?: string[]
}
```

## Dependencies

### External Dependencies
- `neverthrow` (^6.0.0) - Error handling
- Cloudflare Durable Objects API (for edge deployment)

### Internal Dependencies
- `oauth-handler.ts` - Token refresh functionality
- `result.ts` - Error type definitions

## Behavior Specification

### Token Retrieval Flow

```typescript
async function getToken(): Promise<Result<string, NetworkError | AuthError>> {
  // 1. Get stored tokens
  const stored = await store.get(userId)
  if (stored.isErr()) {
    return err(stored.error)
  }
  
  // 2. Check if tokens exist
  if (!stored.value) {
    return err({
      type: 'AuthError',
      message: 'No tokens found. Please authenticate.',
      reason: 'missing'
    })
  }
  
  // 3. Check expiration with buffer
  const now = Date.now()
  const expiryBuffer = this.refreshBuffer * 60 * 1000
  const effectiveExpiry = stored.value.expiresAt - expiryBuffer
  
  if (now >= effectiveExpiry) {
    // 4. Refresh if expired or about to expire
    const refreshResult = await this.refreshTokenIfNeeded()
    if (refreshResult.isErr()) {
      return err(refreshResult.error)
    }
    return ok(refreshResult.value)
  }
  
  // 5. Return valid token
  return ok(stored.value.accessToken)
}
```

### Token Refresh Flow

```typescript
async function refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>> {
  // 1. Acquire refresh lock (prevent concurrent refreshes)
  if (this.refreshing) {
    return this.waitForRefresh()
  }
  
  this.refreshing = true
  try {
    // 2. Get current tokens
    const stored = await store.get(userId)
    if (stored.isErr() || !stored.value) {
      return err(authError('missing'))
    }
    
    // 3. Attempt refresh with retries
    let lastError: NetworkError | AuthError | null = null
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const refreshResult = await refreshToken(
        stored.value.refreshToken,
        this.clientId,
        this.clientSecret
      )
      
      if (refreshResult.isOk()) {
        // 4. Store new tokens
        const newTokens: StoredTokens = {
          accessToken: refreshResult.value.access_token,
          refreshToken: refreshResult.value.refresh_token || 
                       stored.value.refreshToken,
          expiresAt: Date.now() + (refreshResult.value.expires_in * 1000),
          scopes: refreshResult.value.scope.split(' '),
          tokenType: 'Bearer',
          lastRefreshed: Date.now(),
          refreshCount: stored.value.refreshCount + 1
        }
        
        const storeResult = await store.set(userId, newTokens)
        if (storeResult.isErr()) {
          lastError = storeResult.error
          continue
        }
        
        // 5. Notify listeners
        this.onTokenRefreshed?.(newTokens)
        
        return ok(newTokens.accessToken)
      }
      
      lastError = refreshResult.error
      
      // Exponential backoff for retries
      if (attempt < this.maxRetries - 1) {
        await sleep(Math.pow(2, attempt) * 1000)
      }
    }
    
    return err(lastError || networkError('Token refresh failed'))
    
  } finally {
    this.refreshing = false
    this.notifyWaiters()
  }
}
```

### In-Memory Token Store (Development)

```typescript
class InMemoryTokenStore implements TokenStore {
  private tokens = new Map<string, StoredTokens>()
  
  async get(userId: string): Promise<Result<StoredTokens | null, NetworkError>> {
    return ok(this.tokens.get(userId) || null)
  }
  
  async set(userId: string, tokens: StoredTokens): Promise<Result<void, NetworkError>> {
    this.tokens.set(userId, tokens)
    return ok(undefined)
  }
  
  async delete(userId: string): Promise<Result<void, NetworkError>> {
    this.tokens.delete(userId)
    return ok(undefined)
  }
  
  async clear(): Promise<Result<void, NetworkError>> {
    this.tokens.clear()
    return ok(undefined)
  }
}
```

### Durable Object Token Store (Production)

```typescript
export class SpotifyTokenDurableObject extends DurableObject {
  private tokens = new Map<string, StoredTokens>()
  private refreshTimers = new Map<string, number>()
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    // Route: /token/{userId}/{action}
    if (pathParts[0] !== 'token' || pathParts.length < 2) {
      return new Response('Not Found', { status: 404 })
    }
    
    const userId = pathParts[1]
    const action = pathParts[2] || 'get'
    
    switch (action) {
      case 'get':
        return this.handleGet(userId)
      case 'set':
        return this.handleSet(userId, await request.json())
      case 'refresh':
        return this.handleRefresh(userId)
      case 'delete':
        return this.handleDelete(userId)
      case 'status':
        return this.handleStatus(userId)
      default:
        return new Response('Method Not Allowed', { status: 405 })
    }
  }
  
  private async handleGet(userId: string): Promise<Response> {
    const tokens = await this.storage.get<StoredTokens>(`token:${userId}`)
    
    if (!tokens) {
      return Response.json({
        success: false,
        error: { type: 'AuthError', message: 'No tokens found' }
      })
    }
    
    // Check expiration
    const now = Date.now()
    if (now >= tokens.expiresAt - 5 * 60 * 1000) {
      // Trigger refresh
      return this.handleRefresh(userId)
    }
    
    return Response.json({
      success: true,
      data: { accessToken: tokens.accessToken, expiresAt: tokens.expiresAt }
    })
  }
  
  private scheduleAutoRefresh(userId: string, tokens: StoredTokens) {
    // Clear existing timer
    const existingTimer = this.refreshTimers.get(userId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    
    // Schedule refresh 5 minutes before expiry
    const refreshTime = tokens.expiresAt - Date.now() - 5 * 60 * 1000
    if (refreshTime > 0) {
      const timer = setTimeout(() => {
        this.handleRefresh(userId)
      }, refreshTime)
      
      this.refreshTimers.set(userId, timer)
    }
  }
}
```

### Concurrent Access Handling

1. **Refresh Lock**: Only one refresh operation per user at a time
2. **Waiters Queue**: Other requests wait for ongoing refresh
3. **Optimistic Reads**: Allow reads during refresh if token still valid
4. **Write Serialization**: Serialize all write operations

## Error Handling

### Error Scenarios

1. **Missing Tokens**
   - Type: `AuthError`
   - Reason: `missing`
   - Recovery: User must re-authenticate

2. **Expired Tokens**
   - Type: `AuthError`
   - Reason: `expired`
   - Recovery: Automatic refresh

3. **Invalid Refresh Token**
   - Type: `AuthError`
   - Reason: `invalid`
   - Recovery: User must re-authenticate

4. **Network Failure**
   - Type: `NetworkError`
   - Recovery: Retry with exponential backoff

5. **Storage Failure**
   - Type: `NetworkError`
   - Recovery: Retry or fallback store

### Error Recovery Strategies

```typescript
// Exponential backoff for network errors
const backoffDelays = [1000, 2000, 4000, 8000, 16000]

// Circuit breaker for repeated failures
interface CircuitBreaker {
  failures: number
  lastFailure: number
  state: 'closed' | 'open' | 'half-open'
}
```

## Testing Requirements

### Unit Tests

```typescript
describe('Token Manager', () => {
  describe('getToken', () => {
    it('should return valid token')
    it('should refresh expired token')
    it('should refresh token near expiry')
    it('should handle missing tokens')
    it('should handle storage errors')
  })
  
  describe('refreshTokenIfNeeded', () => {
    it('should refresh expired token')
    it('should not refresh valid token')
    it('should handle concurrent refresh')
    it('should retry on failure')
    it('should update storage')
  })
  
  describe('Durable Object', () => {
    it('should handle GET requests')
    it('should handle SET requests')
    it('should auto-refresh tokens')
    it('should handle concurrent access')
    it('should persist across restarts')
  })
})
```

### Integration Tests

```typescript
describe('Token Manager Integration', () => {
  it('should handle full auth flow')
  it('should survive storage failures')
  it('should handle clock skew')
  it('should recover from network errors')
})
```

## Performance Constraints

### Latency Requirements
- Token retrieval: < 10ms (cached)
- Token refresh: < 500ms
- Storage operations: < 50ms
- Status check: < 5ms

### Resource Limits
- Memory per user: < 1KB
- Storage per user: < 2KB
- Concurrent operations: 1000/s
- Refresh rate: 1 per minute per user

### Scalability
- Per-user isolation
- Distributed storage
- No shared state
- Automatic cleanup

## Security Considerations

### Token Storage
- Encrypt tokens at rest
- Secure memory handling
- No token logging
- Automatic expiry

### Access Control
- User isolation
- Request authentication
- Rate limiting per user
- Audit logging

### Token Refresh
- Secure refresh flow
- Prevent replay attacks
- Validate refresh tokens
- Rotation on refresh

### Data Protection
- Clear tokens on logout
- Secure token transmission
- No token in URLs
- Memory cleanup