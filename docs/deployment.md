# Deployment Guide

This guide will help you deploy your own instance of the Spotify MCP Server to Cloudflare Workers.

## Prerequisites

- Node.js 18+ and pnpm installed
- A [Cloudflare account](https://dash.cloudflare.com/sign-up)
- A [Spotify App](https://developer.spotify.com/dashboard) with OAuth credentials
- Wrangler CLI (installed via `pnpm install`)

## Setup Steps

### 1. Clone and Install

```bash
git clone https://github.com/ryo-morimoto/spotify-mcp.git
cd spotify-mcp
pnpm install
```

### 2. Configure Environment Variables

Copy the environment variables template:

```bash
cp .dev.vars.example .dev.vars
```

### 3. Create KV Namespace

Create a KV namespace for storing OAuth tokens:

```bash
pnpm wrangler kv namespace create OAUTH_KV
```

Copy the generated `id` and update it in your `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "OAUTH_KV"
id = "YOUR_KV_NAMESPACE_ID"  # Replace with your actual ID
```

### 4. Configure Spotify App

1. Go to your [Spotify App Dashboard](https://developer.spotify.com/dashboard)
2. Add your redirect URI:
   - For local development: `http://localhost:8787/auth/spotify/callback`
   - For production: `https://your-worker-name.your-subdomain.workers.dev/auth/spotify/callback`

### 5. Set Environment Variables

CLIENT_ID should always be set as a secret for security:

```bash
# For production
pnpm wrangler secret put CLIENT_ID --env production
# Enter your Spotify Client ID when prompted

# For staging  
pnpm wrangler secret put CLIENT_ID --env staging
# Enter your Spotify Client ID when prompted
```

Note: `SPOTIFY_REDIRECT_URI` is now configured in `wrangler.toml` for each environment.
Update the values in your `wrangler.toml` to match your deployment URLs.

### 6. Update CORS Origin

Edit `wrangler.toml` to set the appropriate CORS origin:

```toml
[vars]
CORS_ORIGIN = "https://claude.ai"  # Or your MCP client's origin
```

### 7. Deploy

Deploy to Cloudflare Workers:

```bash
pnpm wrangler deploy
```

Your MCP server will be available at:
`https://your-worker-name.your-subdomain.workers.dev`

## Testing the Deployment

1. Check the health endpoint:
   ```bash
   curl https://your-worker-name.your-subdomain.workers.dev/health
   ```

2. Verify OAuth discovery:
   ```bash
   curl https://your-worker-name.your-subdomain.workers.dev/.well-known/oauth-authorization-server
   ```

## Staging Environment (Optional)

To create a staging environment:

1. Create a staging KV namespace:
   ```bash
   pnpm wrangler kv namespace create OAUTH_KV --env staging
   ```

2. Update the staging configuration in `wrangler.toml`

3. Deploy to staging:
   ```bash
   pnpm wrangler deploy --env staging
   ```

## Security Considerations

- **Never commit** your `wrangler.toml` file (it's in `.gitignore`)
- **Always use secrets** for sensitive values like `CLIENT_ID`
- **Configure CORS** appropriately for your use case
- **Use HTTPS** for all redirect URIs in production

## Troubleshooting

### KV Namespace Issues
If you see errors about KV namespaces, ensure:
- The namespace ID is correctly set in `wrangler.toml`
- You're logged in to the correct Cloudflare account

### OAuth Errors
- Verify your redirect URI matches exactly in both Spotify and your deployment
- Check that `CLIENT_ID` is correctly set as a secret
- Ensure CORS is configured for your MCP client's origin