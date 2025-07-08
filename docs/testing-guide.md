# Testing Guide

## Overview

This guide provides step-by-step instructions for testing the Spotify MCP server, including OAuth with PKCE authentication and MCP session management.

## Prerequisites

1. Spotify App created at https://developer.spotify.com/dashboard
2. Redirect URI `http://localhost:8787/auth/callback` added to your Spotify App
3. Node.js and pnpm installed
4. Wrangler CLI installed (`pnpm install -g wrangler`)

## Setup

### 1. Create KV Namespace

```bash
# Create KV namespace for OAuth state and sessions
wrangler kv:namespace create OAUTH_KV

# Copy the output ID and update wrangler.toml:
# [[kv_namespaces]]
# binding = "OAUTH_KV"
# id = "your-kv-namespace-id"
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Edit .dev.vars:
CLIENT_ID=your-spotify-client-id
SPOTIFY_REDIRECT_URI=http://localhost:8787/auth/callback
CORS_ORIGIN=*

# Don't set SPOTIFY_ACCESS_TOKEN to test OAuth flow
```

### 3. Start Development Server

```bash
pnpm dev
```

## Testing OAuth with PKCE Flow

### Test 1: Initial Authentication Required

```bash
# Send request without authentication
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session-001" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Authentication required",
    "data": {
      "authUrl": "/auth/spotify?mcp_session=test-session-001"
    }
  },
  "id": null
}
```

### Test 2: Complete OAuth Flow

1. Open the auth URL in your browser:
```
http://localhost:8787/auth/spotify?mcp_session=test-session-001
```

2. Log in to Spotify and authorize the application

3. You should see a success page with your session ID

### Test 3: Use Authenticated Session

```bash
# Same session ID should now work
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session-001" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 2
  }'
```

**Expected Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "search_tracks",
        "description": "Search for tracks on Spotify",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {"type": "string"},
            "limit": {"type": "number"}
          }
        }
      }
    ]
  },
  "id": 2
}
```

## Testing MCP Tools

### Test 4: Search Tracks

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session-001" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search_tracks",
      "arguments": {
        "query": "Hello",
        "limit": 3
      }
    },
    "id": 3
  }'
```

**Expected:** Returns search results from Spotify

## Testing Multiple Sessions

### Test 5: Different Session IDs

```bash
# Different session requires its own authentication
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session-002" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "clientInfo": {
        "name": "another-client",
        "version": "1.0.0"
      }
    },
    "id": 4
  }'
```

**Expected:** Returns authentication required error with new session ID

## Testing Error Cases

### Test 6: Expired Token

```bash
# Manually set expired token in KV (for testing)
wrangler kv:put "mcp_session:expired-test" \
  '{"accessToken":"fake-token","refreshToken":"fake-refresh","expiresAt":1000}' \
  --namespace-id=your-namespace-id \
  --local

# Try to use expired session
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: expired-test" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 5
  }'
```

**Expected:** Returns authentication required error

### Test 7: Invalid Session

```bash
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: non-existent-session" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 6
  }'
```

**Expected:** Returns authentication required error

## Debugging

### Check KV Storage

```bash
# List all keys
wrangler kv:key list --namespace-id=your-namespace-id --local

# Get specific session data
wrangler kv:get "mcp_session:test-session-001" --namespace-id=your-namespace-id --local
```

### Common Issues

1. **"No KV namespace bound" error**
   - Ensure `wrangler.toml` has the correct KV namespace configuration
   - Restart `pnpm dev`

2. **OAuth callback fails**
   - Verify Redirect URI is exactly `http://localhost:8787/auth/callback` in Spotify App settings
   - Check CLIENT_ID is correct

3. **Session not found after authentication**
   - Ensure `mcp_session` parameter is passed through OAuth flow
   - Check browser console for any redirect issues

## Environment Variable Authentication (Legacy)

For backward compatibility, you can still use environment variables:

```bash
# Set in .dev.vars
SPOTIFY_ACCESS_TOKEN=your-access-token
SPOTIFY_REFRESH_TOKEN=your-refresh-token
SPOTIFY_EXPIRES_AT=1234567890000

# Any request will use these tokens (no session ID needed)
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 7
  }'
```

