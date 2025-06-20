# Cloudflare Workers Deployment Guide

This guide explains how to deploy the Spotify MCP Server to Cloudflare Workers.

## Prerequisites

- Cloudflare account
- Wrangler CLI installed: `npm install -g wrangler`
- Spotify app credentials

## Setup Steps

### 1. Authenticate with Cloudflare

```bash
wrangler login
```

### 2. Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create "OAUTH_TOKENS"

# Create preview KV namespace for development
wrangler kv:namespace create "OAUTH_TOKENS" --preview
```

Update `wrangler.toml` with the generated namespace IDs.

### 3. Set Secrets

```bash
# Set Spotify credentials as secrets
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put SPOTIFY_CLIENT_SECRET
```

### 4. Deploy

```bash
# Deploy to development
wrangler deploy

# Deploy to production
wrangler deploy --env production
```

### 5. Configure Spotify App

Add your Cloudflare Workers URL to Spotify app redirect URIs:
- Development: `https://spotify-mcp-server.<your-subdomain>.workers.dev/callback`
- Production: `https://spotify-mcp.example.com/callback`

## Testing

1. Visit `/health` to check if the worker is running
2. Visit `/auth` to start OAuth flow
3. Use `/sse` endpoint with MCP client

## Monitoring

View logs and metrics in Cloudflare dashboard or use:

```bash
wrangler tail
```

## Troubleshooting

### SSE Connection Issues
- Cloudflare may buffer SSE responses
- Consider using WebSockets for long-lived connections
- Check browser console for CORS errors

### OAuth Errors
- Verify redirect URIs match exactly
- Check KV namespace permissions
- Ensure secrets are set correctly

### Performance
- Monitor CPU time limits
- Check memory usage
- Use Durable Objects for complex state management