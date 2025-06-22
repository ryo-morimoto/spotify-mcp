# Cloudflare Worker Component Specification

## Purpose & Responsibility

The Cloudflare Worker serves as the edge runtime and request router for the Spotify MCP Server. It is responsible for:

- Handling all incoming HTTP requests at the edge
- Routing requests to appropriate handlers (OAuth, MCP, Health)
- Managing the lifecycle of Durable Objects
- Implementing security policies and CORS
- Providing request/response transformation
- Coordinating between different system components

This component is the entry point for all client interactions and runs globally on Cloudflare's edge network.

## Interface Definition

### Worker Entry Point

```typescript
// Main worker interface
export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response>
}

// Environment bindings
export interface Env {
  // Environment variables
  SPOTIFY_CLIENT_ID: string
  SPOTIFY_CLIENT_SECRET?: string
  REDIRECT_URI: string
  ENVIRONMENT: 'development' | 'staging' | 'production'
  
  // Durable Object namespaces
  SPOTIFY_TOKENS: DurableObjectNamespace
  
  // KV namespaces
  PKCE_STORE: KVNamespace
  
  // Secrets (via wrangler secret)
  API_KEY?: string
  SIGNING_KEY?: string
}
```

### Route Definitions

```typescript
// HTTP Routes
GET  /health                    // Health check endpoint
GET  /auth                      // OAuth authorization initiation
GET  /callback                  // OAuth callback handler
GET  /sse                       // SSE endpoint for MCP protocol
POST /rpc                       // JSON-RPC endpoint for MCP
GET  /token/{userId}/*          // Durable Object token operations
POST /token/{userId}/*          // Durable Object token operations
GET  /admin/*                   // Admin operations (protected)
```

### Request/Response Types

```typescript
// Route Handler Type
type RouteHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: RouteParams
) => Promise<Response>

// Route Parameters
interface RouteParams {
  userId?: string
  action?: string
  [key: string]: string | undefined
}

// Worker Configuration
interface WorkerConfig {
  corsOrigins: string[]
  maxRequestSize: number
  requestTimeout: number
  enableMetrics: boolean
  rateLimits: {
    global: number
    perIp: number
    perUser: number
  }
}
```

## Dependencies

### External Dependencies
- Cloudflare Workers Runtime
- `hono` (^3.0.0) - Web framework for Workers
- `neverthrow` (^6.0.0) - Error handling

### Internal Dependencies
- `oauth-handler.ts` - OAuth flow implementation
- `mcp-server.ts` - MCP protocol server
- `sse-transport.ts` - SSE transport handler
- `durable-objects.ts` - Token storage

## Behavior Specification

### Request Flow

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // 1. Create router
      const app = new Hono<{ Bindings: Env }>()
      
      // 2. Apply global middleware
      app.use('*', cors({
        origin: getConfiguredOrigins(env),
        credentials: true
      }))
      
      app.use('*', securityHeaders())
      app.use('*', requestLogger())
      app.use('*', rateLimiter(env))
      
      // 3. Define routes
      app.get('/health', healthHandler)
      app.get('/auth', authHandler)
      app.get('/callback', callbackHandler)
      app.get('/sse', sseHandler)
      app.post('/rpc', rpcHandler)
      
      // Durable Object routes
      app.all('/token/:userId/*', tokenHandler)
      
      // Admin routes (protected)
      app.all('/admin/*', authenticate(env), adminHandler)
      
      // 4. Handle request
      return app.fetch(request, env, ctx)
      
    } catch (error) {
      // 5. Global error handling
      console.error('Worker error:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
  }
}
```

### Route Handlers

#### Health Check

```typescript
async function healthHandler(c: Context): Promise<Response> {
  const env = c.env
  
  // Check system components
  const checks = {
    worker: 'healthy',
    durableObjects: 'unknown',
    spotifyApi: 'unknown'
  }
  
  // Test Durable Objects
  try {
    const id = env.SPOTIFY_TOKENS.idFromName('health-check')
    const obj = env.SPOTIFY_TOKENS.get(id)
    const res = await obj.fetch('https://internal/health')
    checks.durableObjects = res.ok ? 'healthy' : 'unhealthy'
  } catch {
    checks.durableObjects = 'unhealthy'
  }
  
  // Test Spotify API (cached)
  const spotifyHealth = await checkSpotifyHealth(env)
  checks.spotifyApi = spotifyHealth
  
  const allHealthy = Object.values(checks).every(s => s === 'healthy')
  
  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    environment: env.ENVIRONMENT,
    checks,
    timestamp: new Date().toISOString()
  }, allHealthy ? 200 : 503)
}
```

#### OAuth Authorization

```typescript
async function authHandler(c: Context): Promise<Response> {
  const env = c.env
  
  // 1. Generate PKCE challenge
  const pkceResult = await generatePKCEChallenge()
  if (pkceResult.isErr()) {
    return c.text('Failed to generate PKCE challenge', 500)
  }
  
  const pkce = pkceResult.value
  const state = generateRandomState()
  
  // 2. Store PKCE verifier in KV (expires in 10 minutes)
  await env.PKCE_STORE.put(
    `pkce:${state}`,
    JSON.stringify({
      codeVerifier: pkce.codeVerifier,
      timestamp: Date.now()
    }),
    { expirationTtl: 600 }
  )
  
  // 3. Generate auth URL
  const authUrlResult = generateAuthUrl(
    env.SPOTIFY_CLIENT_ID,
    env.REDIRECT_URI,
    pkce,
    REQUIRED_SCOPES,
    state
  )
  
  if (authUrlResult.isErr()) {
    return c.text('Failed to generate auth URL', 500)
  }
  
  // 4. Redirect to Spotify
  return c.redirect(authUrlResult.value)
}
```

#### OAuth Callback

```typescript
async function callbackHandler(c: Context): Promise<Response> {
  const env = c.env
  const { code, state, error } = c.req.query()
  
  // 1. Handle errors
  if (error) {
    return c.html(`
      <html>
        <body>
          <h1>Authentication Failed</h1>
          <p>Error: ${error}</p>
        </body>
      </html>
    `, 400)
  }
  
  // 2. Validate state and retrieve PKCE
  const pkceData = await env.PKCE_STORE.get(`pkce:${state}`)
  if (!pkceData) {
    return c.text('Invalid state parameter', 400)
  }
  
  const { codeVerifier } = JSON.parse(pkceData)
  
  // 3. Exchange code for tokens
  const tokenResult = await exchangeCodeForToken(
    code,
    env.SPOTIFY_CLIENT_ID,
    env.REDIRECT_URI,
    codeVerifier,
    env.SPOTIFY_CLIENT_SECRET
  )
  
  if (tokenResult.isErr()) {
    return c.html(`
      <html>
        <body>
          <h1>Token Exchange Failed</h1>
          <p>${tokenResult.error.message}</p>
        </body>
      </html>
    `, 400)
  }
  
  // 4. Store tokens in Durable Object
  const userId = getUserIdFromToken(tokenResult.value)
  const doId = env.SPOTIFY_TOKENS.idFromName(userId)
  const tokenDO = env.SPOTIFY_TOKENS.get(doId)
  
  const storeResult = await tokenDO.fetch('https://internal/token/' + userId, {
    method: 'POST',
    body: JSON.stringify(tokenResult.value)
  })
  
  if (!storeResult.ok) {
    return c.text('Failed to store tokens', 500)
  }
  
  // 5. Clean up PKCE data
  await env.PKCE_STORE.delete(`pkce:${state}`)
  
  // 6. Return success page
  return c.html(`
    <html>
      <body>
        <h1>Authentication Successful</h1>
        <p>You can now close this window.</p>
        <script>
          // Notify parent window if in popup
          if (window.opener) {
            window.opener.postMessage({ type: 'auth-success' }, '*')
            window.close()
          }
        </script>
      </body>
    </html>
  `)
}
```

#### SSE Handler

```typescript
async function sseHandler(c: Context): Promise<Response> {
  const env = c.env
  
  // 1. Set up SSE response
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  
  // 2. Write headers
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  }
  
  // 3. Send initial connection event
  await writer.write(encoder.encode(
    'event: connected\n' +
    `data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`
  ))
  
  // 4. Set up MCP server
  const userId = getUserFromAuth(c.req)
  const tokenManager = new DurableObjectTokenManager(
    env.SPOTIFY_TOKENS,
    userId
  )
  
  const mcpServerResult = await createMCPServer(tokenManager)
  if (mcpServerResult.isErr()) {
    await writer.close()
    return c.text('Failed to create MCP server', 500)
  }
  
  const mcpServer = mcpServerResult.value
  
  // 5. Set up heartbeat
  const heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(
        'event: heartbeat\n' +
        `data: ${JSON.stringify({ timestamp: Date.now() })}\n\n`
      ))
    } catch {
      clearInterval(heartbeatInterval)
    }
  }, 30000)
  
  // 6. Handle connection close
  c.executionCtx.waitUntil(
    new Promise(resolve => {
      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
        writer.close()
        resolve(undefined)
      })
    })
  )
  
  return new Response(readable, { headers })
}
```

#### Token Handler (Durable Object Proxy)

```typescript
async function tokenHandler(c: Context): Promise<Response> {
  const env = c.env
  const userId = c.req.param('userId')
  
  // 1. Validate user authorization
  const authResult = await validateUserAccess(c.req, userId)
  if (authResult.isErr()) {
    return c.text('Unauthorized', 401)
  }
  
  // 2. Get Durable Object
  const id = env.SPOTIFY_TOKENS.idFromName(userId)
  const tokenDO = env.SPOTIFY_TOKENS.get(id)
  
  // 3. Forward request
  const doRequest = new Request(c.req.url, {
    method: c.req.method,
    headers: c.req.headers,
    body: c.req.body
  })
  
  // 4. Add internal headers
  doRequest.headers.set('X-User-Id', userId)
  doRequest.headers.set('X-Client-IP', c.req.headers.get('CF-Connecting-IP') || '')
  
  // 5. Call Durable Object
  const response = await tokenDO.fetch(doRequest)
  
  // 6. Return response
  return response
}
```

### Middleware

#### Security Headers

```typescript
function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next()
    
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '1; mode=block')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
    
    // CSP for HTML responses
    if (c.res.headers.get('content-type')?.includes('html')) {
      c.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
      )
    }
  }
}
```

#### Rate Limiter

```typescript
function rateLimiter(env: Env): MiddlewareHandler {
  return async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'
    const key = `rate:${ip}:${Math.floor(Date.now() / 60000)}`
    
    // Increment counter
    const count = await env.PKCE_STORE.get(key, 'json') || 0
    
    if (count >= 100) {  // 100 requests per minute
      return c.text('Rate limit exceeded', 429, {
        'Retry-After': '60'
      })
    }
    
    // Update counter
    c.executionCtx.waitUntil(
      env.PKCE_STORE.put(key, JSON.stringify(count + 1), {
        expirationTtl: 60
      })
    )
    
    await next()
  }
}
```

## Error Handling

### Error Types

1. **Worker Errors**
   - Unhandled exceptions
   - Memory limits
   - CPU time limits
   - Subrequest limits

2. **Network Errors**
   - Durable Object unreachable
   - Spotify API timeout
   - KV operation failure

3. **Application Errors**
   - Invalid requests
   - Authentication failures
   - Rate limiting

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    details?: any
    requestId: string
    timestamp: string
  }
}
```

### Global Error Handler

```typescript
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  
  const requestId = c.req.header('CF-Ray') || generateRequestId()
  
  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId,
      timestamp: new Date().toISOString()
    }
  }, 500)
})
```

## Testing Requirements

### Unit Tests

```typescript
describe('Cloudflare Worker', () => {
  describe('Routing', () => {
    it('should route health check correctly')
    it('should route OAuth endpoints')
    it('should route SSE endpoint')
    it('should handle 404 for unknown routes')
  })
  
  describe('OAuth Flow', () => {
    it('should generate PKCE and redirect')
    it('should exchange code for tokens')
    it('should store tokens in DO')
    it('should clean up PKCE data')
  })
  
  describe('Security', () => {
    it('should enforce rate limits')
    it('should validate authentication')
    it('should set security headers')
    it('should handle CORS properly')
  })
  
  describe('Error Handling', () => {
    it('should handle DO failures gracefully')
    it('should handle network timeouts')
    it('should return proper error responses')
  })
})
```

### Integration Tests

```typescript
describe('Worker Integration', () => {
  it('should complete full OAuth flow')
  it('should handle MCP protocol over SSE')
  it('should proxy DO requests correctly')
  it('should handle high load')
})
```

## Performance Constraints

### Latency Requirements
- Health check: < 10ms
- Static responses: < 20ms
- DO proxy: < 100ms
- OAuth redirect: < 50ms

### Resource Limits
- CPU time: 50ms per request
- Memory: 128MB
- Subrequests: 50 per request
- Response size: 100MB

### Scalability
- Auto-scaling globally
- No connection limits
- Stateless operation
- Edge caching

## Security Considerations

### Authentication
- Validate all requests
- Check OAuth state
- Verify user access
- API key validation

### Input Validation
- Sanitize all inputs
- Validate URLs
- Check content types
- Prevent injections

### Access Control
- User isolation
- Admin protection
- Rate limiting
- IP filtering

### Data Protection
- No sensitive logging
- Secure headers
- HTTPS only
- Token isolation