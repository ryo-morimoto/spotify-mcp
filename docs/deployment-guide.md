# Spotify MCP Server Deployment Guide

## Prerequisites

- Spotify Developer Account with registered app
- Cloudflare account (for Workers deployment)
- Node.js 18+ and pnpm (for local development)
- Wrangler CLI installed (`pnpm install -g wrangler`)

## Spotify App Setup

### 1. Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Fill in app details:
   - App name: `Spotify MCP Server`
   - App description: `MCP server for controlling Spotify`
   - Redirect URIs: 
     - Local: `http://127.0.0.1:8000/callback`
     - Production: `https://your-worker.workers.dev/callback`
4. Select "Web API" and "Web Playback SDK" APIs
5. Save the app

### 2. Configure OAuth Settings

1. Note your `Client ID` from the app settings
2. For PKCE flow, no client secret is needed
3. Add all redirect URIs you'll use

## Local Development Setup

### 1. Clone and Install

```bash
git clone https://github.com/your-username/spotify-mcp.git
cd spotify-mcp
pnpm install
```

### 2. Environment Configuration

Create `.env` file:

```bash
# Required
SPOTIFY_CLIENT_ID=your_client_id_here

# Optional (defaults shown)
PORT=8000
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback

# Only if not using PKCE
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 3. Run Development Server

```bash
# Start the server
pnpm dev

# In another terminal, run tests in watch mode
pnpm vitest --watch
```

### 4. Authenticate with Spotify

1. Open browser to `http://127.0.0.1:8000/auth`
2. Authorize the app with Spotify
3. You'll be redirected back with tokens stored

### 5. Connect MCP Client

Configure your MCP client (e.g., Claude Desktop) to connect to:
- URL: `http://127.0.0.1:8000/sse`
- Method: GET
- Headers: `Accept: text/event-stream`

## Cloudflare Workers Deployment

### 1. Configure Wrangler

Create/update `wrangler.toml`:

```toml
name = "spotify-mcp"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

# Durable Objects for token storage
[[durable_objects.bindings]]
name = "SPOTIFY_TOKENS"
class_name = "SpotifyTokenDurableObject"

[[migrations]]
tag = "v1"
new_classes = ["SpotifyTokenDurableObject"]

# KV for PKCE storage
[[kv_namespaces]]
binding = "PKCE_STORE"
id = "your-kv-namespace-id"

# Environment variables
[vars]
SPOTIFY_CLIENT_ID = "your-client-id"
REDIRECT_URI = "https://spotify-mcp.your-subdomain.workers.dev/callback"

# Staging environment
[env.staging]
name = "spotify-mcp-staging"
vars = { ENVIRONMENT = "staging" }

# Production environment
[env.production]
vars = { ENVIRONMENT = "production" }
```

### 2. Create KV Namespace

```bash
# Create KV namespace for PKCE storage
wrangler kv:namespace create "PKCE_STORE"

# Note the ID and update wrangler.toml
```

### 3. Deploy to Cloudflare

```bash
# Deploy to staging
wrangler deploy --env staging

# Test the deployment
curl https://spotify-mcp-staging.your-subdomain.workers.dev/health

# Deploy to production
wrangler deploy --env production
```

### 4. Configure Custom Domain (Optional)

1. In Cloudflare dashboard, go to Workers & Pages
2. Select your worker
3. Go to "Custom Domains" tab
4. Add your domain (e.g., `mcp.yourdomain.com`)
5. Update redirect URI in Spotify app settings

## Production Configuration

### 1. Security Headers

The worker automatically sets security headers:

```typescript
headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'"
}
```

### 2. Rate Limiting

Durable Objects implement per-user rate limiting:
- 100 requests per minute
- 1000 requests per hour
- Automatic backoff on limit exceeded

### 3. Token Management

Tokens are automatically refreshed:
- Check expiry on each request
- Refresh 5 minutes before expiration
- Retry with exponential backoff on failure

### 4. Monitoring

```bash
# View real-time logs
wrangler tail

# View metrics in Cloudflare dashboard
# Workers & Pages > Analytics
```

## MCP Client Configuration

### Claude Desktop

Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "curl",
      "args": [
        "-N",
        "-H", "Accept: text/event-stream",
        "https://spotify-mcp.yourdomain.com/sse"
      ]
    }
  }
}
```

### Custom Client

```typescript
const client = new MCPClient({
  url: 'https://spotify-mcp.yourdomain.com/sse',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

await client.connect()
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Problem**: "Invalid client" or "Invalid redirect URI"

**Solution**: 
- Verify Client ID in `.env` and Spotify app
- Ensure redirect URI exactly matches (including trailing slash)
- Check URI is added to Spotify app settings

#### 2. No Active Device

**Problem**: "No active Spotify device found"

**Solution**:
- Open Spotify on any device
- Start playing something, then pause
- Device should now be available

#### 3. Token Expiration

**Problem**: "Token expired" errors

**Solution**:
- Tokens auto-refresh in production
- For local dev, re-authenticate at `/auth`
- Check token refresh logic in logs

#### 4. CORS Issues

**Problem**: "CORS policy" errors in browser

**Solution**:
- Worker sets CORS headers automatically
- For local dev, use the Express server
- Don't access worker directly from browser

### Debug Commands

```bash
# Check worker status
wrangler tail

# Test health endpoint
curl https://your-worker.workers.dev/health

# View KV storage
wrangler kv:key list --binding=PKCE_STORE

# Check Durable Object storage
# Use Cloudflare dashboard or API
```

## Scaling Considerations

### 1. Durable Objects Limits

- 1000 requests/second per object
- 128KB storage per key
- 10MB total storage per object
- Automatic scaling with user isolation

### 2. Workers Limits

- 10ms CPU time per request (50ms for paid)
- 128MB memory
- 1000 requests/second globally
- Automatic global distribution

### 3. Cost Optimization

- Use KV for read-heavy data
- Minimize Durable Object operations
- Cache responses where possible
- Use batch operations

## Security Best Practices

### 1. Token Security

- Never expose tokens in logs
- Use encrypted storage in production
- Implement token rotation
- Monitor for suspicious activity

### 2. Rate Limiting

- Implement per-user limits
- Use exponential backoff
- Monitor for abuse patterns
- Block suspicious IPs

### 3. Input Validation

- Validate all user inputs
- Sanitize search queries
- Check parameter bounds
- Prevent injection attacks

### 4. Audit Logging

- Log authentication attempts
- Track API usage per user
- Monitor error rates
- Set up alerts for anomalies

## Backup and Recovery

### 1. Token Backup

Durable Objects are automatically replicated, but for extra safety:

```typescript
// Export tokens (admin only)
GET /admin/export-tokens

// Import tokens
POST /admin/import-tokens
```

### 2. Configuration Backup

```bash
# Backup wrangler.toml and secrets
wrangler secret list
```

### 3. Disaster Recovery

1. Redeploy worker from git
2. Restore KV namespaces if needed
3. Users re-authenticate (tokens in DO survive)
4. Monitor for issues

## Updates and Maintenance

### 1. Zero-Downtime Deployment

```bash
# Deploy new version
wrangler deploy --env production

# Workers automatically route to new version
# Old version handles existing requests
```

### 2. Database Migrations

For Durable Object schema changes:

```toml
[[migrations]]
tag = "v2"
renamed_classes = [
  { from = "OldClass", to = "NewClass" }
]
```

### 3. Rollback Procedure

```bash
# Revert to previous version
wrangler rollback --env production

# Or deploy specific version
wrangler deploy --env production --compatibility-date=2024-01-01
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Cache API responses
const cache = caches.default
const cacheKey = new Request(url, { 
  cf: { cacheTtl: 300 } // 5 minutes
})
```

### 2. Connection Pooling

- Reuse HTTP connections
- Minimize TLS handshakes
- Use keepalive headers

### 3. Response Optimization

- Compress large responses
- Stream data when possible
- Minimize JSON payload size

## Support and Resources

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Project Issues](https://github.com/your-username/spotify-mcp/issues)