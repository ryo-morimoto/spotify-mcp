# Durable Objects Component Specification

## Purpose & Responsibility

The Durable Objects component provides distributed, strongly consistent storage for OAuth tokens in Cloudflare Workers. It is responsible for:

- Persistent storage of user tokens with automatic expiration
- Automatic token refresh before expiry
- Per-user isolation and data locality
- Distributed coordination without external databases
- Rate limiting and access control per user
- Metrics collection and monitoring

This component leverages Cloudflare's Durable Objects to provide a serverless, globally distributed token storage solution.

## Interface Definition

### Public API

```typescript
// Durable Object Class
export class SpotifyTokenDurableObject implements DurableObject {
  constructor(state: DurableObjectState, env: Env)
  async fetch(request: Request): Promise<Response>
}

// Durable Object Namespace Binding
export interface TokenDurableObjectNamespace {
  get(id: DurableObjectId): DurableObjectStub
  idFromName(name: string): DurableObjectId
  idFromString(hexString: string): DurableObjectId
}

// Client Interface
export class DurableObjectTokenManager implements TokenManager {
  constructor(namespace: TokenDurableObjectNamespace, userId: string)
  getToken(): Promise<Result<string, NetworkError | AuthError>>
  refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>>
}
```

### HTTP API Endpoints

```typescript
// Token Operations
GET    /token/{userId}          // Get valid access token
POST   /token/{userId}          // Store new tokens
PUT    /token/{userId}/refresh  // Force token refresh
DELETE /token/{userId}          // Delete tokens
GET    /token/{userId}/status   // Get token status

// Admin Operations
GET    /admin/metrics           // Get usage metrics
POST   /admin/purge            // Purge expired tokens
GET    /admin/export           // Export all tokens (encrypted)
```

### Type Definitions

```typescript
// Storage Schema
interface StoredTokenData {
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: number        // Unix timestamp (ms)
    scopes: string[]
    tokenType: 'Bearer'
  }
  metadata: {
    userId: string
    createdAt: number
    lastAccessed: number
    lastRefreshed: number
    refreshCount: number
    errorCount: number
    clientInfo?: {
      clientId: string
      userAgent?: string
      ip?: string
    }
  }
  settings: {
    autoRefresh: boolean     // Enable auto-refresh (default: true)
    refreshBuffer: number    // Minutes before expiry (default: 5)
  }
}

// Request/Response Types
interface TokenOperationRequest {
  action: 'get' | 'set' | 'refresh' | 'delete' | 'status'
  data?: {
    tokens?: OAuthTokens
    settings?: Partial<TokenSettings>
  }
  auth?: {
    apiKey?: string
    signature?: string
  }
}

interface TokenOperationResponse {
  success: boolean
  data?: {
    accessToken?: string
    expiresAt?: number
    status?: TokenStatus
  }
  error?: {
    code: string
    message: string
    retryAfter?: number
  }
}

// Metrics Types
interface TokenMetrics {
  totalUsers: number
  activeTokens: number
  expiredTokens: number
  refreshRate: number        // Refreshes per hour
  errorRate: number          // Errors per hour
  apiCalls: {
    get: number
    set: number
    refresh: number
    delete: number
  }
  performance: {
    p50: number              // Median latency
    p95: number              // 95th percentile
    p99: number              // 99th percentile
  }
}
```

## Dependencies

### External Dependencies
- Cloudflare Workers Runtime
- Cloudflare Durable Objects API
- `neverthrow` (^6.0.0) - Error handling

### Internal Dependencies
- `oauth-handler.ts` - Token refresh logic
- `result.ts` - Error type definitions
- `crypto-utils.ts` - Token encryption (future)

## Behavior Specification

### Durable Object Lifecycle

```typescript
export class SpotifyTokenDurableObject {
  private state: DurableObjectState
  private env: Env
  private refreshTimer?: number
  private rateLimiter: RateLimiter
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state
    this.env = env
    this.rateLimiter = new RateLimiter()
    
    // Initialize from storage
    this.state.blockConcurrencyWhile(async () => {
      await this.initialize()
    })
  }
  
  private async initialize() {
    // Load stored data
    const stored = await this.state.storage.get<StoredTokenData>('tokens')
    
    if (stored && stored.settings.autoRefresh) {
      // Schedule auto-refresh
      this.scheduleRefresh(stored)
    }
    
    // Set up alarms for periodic tasks
    const now = Date.now()
    const nextHour = Math.ceil(now / 3600000) * 3600000
    await this.state.storage.setAlarm(nextHour)
  }
  
  async fetch(request: Request): Promise<Response> {
    try {
      // Rate limiting
      const rateLimitResult = await this.rateLimiter.check(request)
      if (!rateLimitResult.allowed) {
        return new Response('Rate limit exceeded', {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter)
          }
        })
      }
      
      // Route request
      const url = new URL(request.url)
      const path = url.pathname
      
      if (path.startsWith('/token/')) {
        return this.handleTokenOperation(request, path)
      } else if (path.startsWith('/admin/')) {
        return this.handleAdminOperation(request, path)
      }
      
      return new Response('Not Found', { status: 404 })
      
    } catch (error) {
      console.error('Durable Object error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
  
  async alarm() {
    // Periodic maintenance tasks
    await this.cleanupExpiredTokens()
    await this.collectMetrics()
    
    // Schedule next alarm
    const nextHour = Date.now() + 3600000
    await this.state.storage.setAlarm(nextHour)
  }
}
```

### Token Storage Operations

```typescript
private async handleGet(userId: string): Promise<Response> {
  // 1. Get stored tokens
  const stored = await this.state.storage.get<StoredTokenData>('tokens')
  
  if (!stored) {
    return Response.json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'No tokens found'
      }
    }, { status: 404 })
  }
  
  // 2. Update access timestamp
  stored.metadata.lastAccessed = Date.now()
  await this.state.storage.put('tokens', stored)
  
  // 3. Check expiration
  const now = Date.now()
  const expiryBuffer = stored.settings.refreshBuffer * 60 * 1000
  
  if (now >= stored.tokens.expiresAt - expiryBuffer) {
    // 4. Trigger refresh
    const refreshResult = await this.refreshToken(stored)
    if (refreshResult.isErr()) {
      return Response.json({
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: refreshResult.error.message
        }
      }, { status: 401 })
    }
    
    return Response.json({
      success: true,
      data: {
        accessToken: refreshResult.value.accessToken,
        expiresAt: refreshResult.value.expiresAt
      }
    })
  }
  
  // 5. Return valid token
  return Response.json({
    success: true,
    data: {
      accessToken: stored.tokens.accessToken,
      expiresAt: stored.tokens.expiresAt
    }
  })
}
```

### Automatic Token Refresh

```typescript
private scheduleRefresh(stored: StoredTokenData) {
  // Clear existing timer
  if (this.refreshTimer) {
    clearTimeout(this.refreshTimer)
  }
  
  // Calculate refresh time (5 minutes before expiry)
  const refreshBuffer = stored.settings.refreshBuffer * 60 * 1000
  const refreshAt = stored.tokens.expiresAt - refreshBuffer
  const delay = refreshAt - Date.now()
  
  if (delay > 0) {
    this.refreshTimer = setTimeout(async () => {
      console.log(`Auto-refreshing token for user ${stored.metadata.userId}`)
      
      const result = await this.refreshToken(stored)
      if (result.isErr()) {
        // Increment error count
        stored.metadata.errorCount++
        
        // Retry with exponential backoff
        if (stored.metadata.errorCount < 5) {
          const retryDelay = Math.pow(2, stored.metadata.errorCount) * 1000
          setTimeout(() => this.scheduleRefresh(stored), retryDelay)
        }
      }
    }, delay)
  }
}

private async refreshToken(stored: StoredTokenData): Promise<Result<TokenRefreshResult, AuthError>> {
  try {
    // 1. Call OAuth handler
    const refreshResult = await refreshToken(
      stored.tokens.refreshToken,
      stored.metadata.clientInfo?.clientId || this.env.SPOTIFY_CLIENT_ID,
      this.env.SPOTIFY_CLIENT_SECRET
    )
    
    if (refreshResult.isErr()) {
      return err(refreshResult.error)
    }
    
    // 2. Update stored tokens
    stored.tokens.accessToken = refreshResult.value.access_token
    stored.tokens.expiresAt = Date.now() + (refreshResult.value.expires_in * 1000)
    stored.metadata.lastRefreshed = Date.now()
    stored.metadata.refreshCount++
    stored.metadata.errorCount = 0  // Reset error count
    
    // 3. Persist to storage
    await this.state.storage.put('tokens', stored)
    
    // 4. Schedule next refresh
    this.scheduleRefresh(stored)
    
    return ok({
      accessToken: stored.tokens.accessToken,
      expiresAt: stored.tokens.expiresAt
    })
    
  } catch (error) {
    return err({
      type: 'AuthError',
      message: 'Token refresh failed',
      reason: 'invalid'
    })
  }
}
```

### Rate Limiting Implementation

```typescript
class RateLimiter {
  private requests = new Map<string, RequestRecord[]>()
  
  async check(request: Request): Promise<RateLimitResult> {
    const clientId = this.getClientId(request)
    const now = Date.now()
    const windowStart = now - 60000  // 1 minute window
    
    // Get request history
    const history = this.requests.get(clientId) || []
    
    // Remove old requests
    const validRequests = history.filter(r => r.timestamp > windowStart)
    
    // Check limits
    if (validRequests.length >= 100) {  // 100 requests per minute
      const oldestRequest = validRequests[0]
      const retryAfter = Math.ceil((oldestRequest.timestamp + 60000 - now) / 1000)
      
      return {
        allowed: false,
        retryAfter
      }
    }
    
    // Add current request
    validRequests.push({ timestamp: now })
    this.requests.set(clientId, validRequests)
    
    return { allowed: true }
  }
  
  private getClientId(request: Request): string {
    // Use API key or IP address
    const apiKey = request.headers.get('X-API-Key')
    if (apiKey) return `key:${apiKey}`
    
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    return `ip:${ip}`
  }
}
```

### Metrics Collection

```typescript
private async collectMetrics() {
  const metrics: TokenMetrics = {
    totalUsers: 0,
    activeTokens: 0,
    expiredTokens: 0,
    refreshRate: 0,
    errorRate: 0,
    apiCalls: {
      get: 0,
      set: 0,
      refresh: 0,
      delete: 0
    },
    performance: {
      p50: 0,
      p95: 0,
      p99: 0
    }
  }
  
  // Collect from storage
  const allKeys = await this.state.storage.list()
  for (const [key, value] of allKeys) {
    if (key.startsWith('tokens:')) {
      metrics.totalUsers++
      
      const data = value as StoredTokenData
      if (data.tokens.expiresAt > Date.now()) {
        metrics.activeTokens++
      } else {
        metrics.expiredTokens++
      }
    }
  }
  
  // Store metrics
  await this.state.storage.put('metrics:hourly:' + Date.now(), metrics)
  
  // Clean old metrics (keep 7 days)
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const metricsKeys = await this.state.storage.list({ prefix: 'metrics:' })
  for (const [key] of metricsKeys) {
    const timestamp = parseInt(key.split(':')[2])
    if (timestamp < cutoff) {
      await this.state.storage.delete(key)
    }
  }
}
```

## Error Handling

### Storage Errors

1. **Storage Limit Exceeded**
   - Clean up old tokens
   - Return appropriate error
   - Alert monitoring

2. **Concurrent Modification**
   - Use transactions
   - Retry with backoff
   - Maintain consistency

### Network Errors

1. **OAuth Refresh Failure**
   - Retry with backoff
   - Mark token as stale
   - Return cached if valid

2. **Timeout**
   - Set reasonable timeouts
   - Return cached data
   - Queue for retry

### State Errors

1. **Corrupted Data**
   - Validate on read
   - Restore from backup
   - Log for investigation

2. **Missing Data**
   - Return appropriate error
   - Don't crash DO
   - Allow re-initialization

## Testing Requirements

### Unit Tests

```typescript
describe('Durable Objects', () => {
  describe('Token Storage', () => {
    it('should store tokens securely')
    it('should retrieve valid tokens')
    it('should handle missing tokens')
    it('should update metadata on access')
  })
  
  describe('Auto Refresh', () => {
    it('should schedule refresh before expiry')
    it('should handle refresh success')
    it('should retry on refresh failure')
    it('should stop after max retries')
  })
  
  describe('Rate Limiting', () => {
    it('should allow requests under limit')
    it('should block excessive requests')
    it('should track per client')
    it('should reset after window')
  })
  
  describe('Metrics', () => {
    it('should collect usage metrics')
    it('should clean old metrics')
    it('should handle large datasets')
  })
})
```

### Integration Tests

```typescript
describe('Durable Object Integration', () => {
  it('should handle full token lifecycle')
  it('should survive DO restart')
  it('should handle concurrent requests')
  it('should scale to many users')
})
```

## Performance Constraints

### Latency Requirements
- Token retrieval: < 50ms (p95)
- Token storage: < 100ms (p95)
- Token refresh: < 500ms (p95)
- Metrics query: < 200ms (p95)

### Resource Limits
- Storage per DO: 10GB
- Memory per DO: 128MB
- CPU time: 50ms per request
- Concurrent requests: 1000/s

### Scalability
- Users per DO: 1 (isolation)
- Total DOs: Unlimited
- Geographic distribution
- Automatic placement

## Security Considerations

### Access Control
- API key authentication
- Request signing
- IP allowlisting
- Rate limiting

### Data Protection
- Encrypt tokens at rest
- Secure key management
- No token logging
- Audit trail

### Isolation
- Per-user DO instances
- No cross-user access
- Resource limits
- Failure isolation

### Compliance
- GDPR data deletion
- Data residency
- Access logging
- Retention policies