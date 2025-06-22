# Cloudflare Workers Deployment Guide

This guide explains how to deploy the Spotify MCP Server to Cloudflare Workers.

## Prerequisites

- Cloudflare account with Workers enabled
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare API token and Account ID

## Step 1: Install Wrangler

```bash
pnpm add -D wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

## Step 3: Create KV Namespace

Create a KV namespace for storing OAuth tokens:

```bash
wrangler kv:namespace create "OAUTH_TOKENS"
wrangler kv:namespace create "OAUTH_TOKENS" --preview
```

Update the IDs in `wrangler.toml` with the returned values.

## Step 4: Set Secrets

Set your Spotify API credentials as secrets:

```bash
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET
```

## Step 5: Build the Worker

```bash
pnpm build:worker
```

## Step 6: Deploy

### Development deployment:
```bash
pnpm deploy
```

### Staging deployment:
```bash
pnpm deploy:staging
```

### Production deployment:
```bash
pnpm deploy:production
```

## Step 7: Test the Deployment

Your Worker will be available at:
- Development: `https://spotify-mcp-server.<your-subdomain>.workers.dev`
- Production: Your custom domain (if configured)

Test the health endpoint:
```bash
curl https://spotify-mcp-server.<your-subdomain>.workers.dev/health
```

## Using Cloudflare MCP Servers

Once deployed, you can use the Cloudflare MCP servers to manage your deployment:

### 1. Check Worker Logs

Using the Observability MCP server:
```
// View real-time logs
tail logs for spotify-mcp-server

// Filter logs by level
tail logs for spotify-mcp-server --level error
```

### 2. Manage KV Storage

Using the Bindings MCP server:
```
// List all stored tokens
list kv keys in OAUTH_TOKENS

// Get a specific token
get kv value OAUTH_TOKENS user:123

// Delete expired tokens
delete kv key OAUTH_TOKENS user:123
```

### 3. Monitor Performance

Using the Observability MCP server:
```
// Get request metrics
get analytics for spotify-mcp-server

// View error rates
get error stats for spotify-mcp-server
```

## Environment-Specific Configuration

### Development
- Uses workers.dev subdomain
- Debug logging enabled
- CORS allows localhost origins

### Staging
- Separate KV namespace
- Enhanced logging
- Testing features enabled

### Production
- Custom domain
- Optimized performance
- Strict CORS policies
- Rate limiting enforced

## Troubleshooting

### Common Issues

1. **Build failures**: Ensure all dependencies are installed
   ```bash
   pnpm install
   ```

2. **Secret not found**: Verify secrets are set
   ```bash
   wrangler secret list
   ```

3. **KV namespace errors**: Check namespace IDs in wrangler.toml

4. **Durable Object errors**: Ensure migrations are applied
   ```bash
   wrangler deploy --dry-run
   ```

### Debug Commands

View Worker logs:
```bash
wrangler tail
```

Test locally:
```bash
pnpm dev:worker
```

## Security Considerations

1. **API Keys**: Always use `wrangler secret` for sensitive data
2. **CORS**: Configure allowed origins in production
3. **Rate Limiting**: Adjust thresholds based on usage
4. **Token Storage**: Implement token expiration cleanup

## Monitoring with MCP

The Cloudflare MCP servers provide powerful monitoring capabilities:

1. **Real-time Logs**: Stream logs directly in Claude
2. **Performance Metrics**: Analyze request patterns
3. **Error Tracking**: Get notified of issues
4. **Resource Usage**: Monitor KV and Durable Object usage

## Next Steps

1. Set up custom domain
2. Configure rate limiting rules
3. Implement automated token cleanup
4. Set up alerts for errors
5. Configure backup strategies