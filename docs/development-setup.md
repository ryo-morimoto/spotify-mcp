# Development Setup Guide

## Architecture Overview

The project follows a modular, domain-driven structure:

```
src/
├── external/          # External API integrations
│   └── spotify/       # Spotify Web API functions
│       ├── index.ts   # Module exports
│       ├── search.ts  # Search functionality
│       ├── player.ts  # Playback control
│       └── *.ts       # Other API functions
├── routes/            # HTTP route handlers (Hono)
│   ├── index.ts       # Route registration
│   ├── auth.ts        # OAuth endpoints (/auth, /callback)
│   ├── mcp.ts         # MCP JSON-RPC endpoint (/mcp)
│   └── health.ts      # Health check (/health)
├── mcp/               # MCP protocol implementation
│   ├── index.ts       # MCP exports
│   ├── server.ts      # MCP server core
│   ├── tools/         # MCP tool implementations
│   ├── resources/     # MCP resource handlers
│   └── prompts/       # MCP prompt templates
├── auth/              # Authentication logic
│   ├── index.ts       # Auth exports
│   ├── spotify.ts     # Spotify OAuth implementation
│   ├── pkce.ts        # PKCE utilities
│   └── tokens.ts      # Token management
├── types/             # Centralized type definitions
│   ├── index.ts       # Main type exports
│   ├── spotify.ts     # Spotify API types
│   ├── oauth.ts       # OAuth & auth types
│   └── storage.ts     # Storage layer types
├── middleware/        # Hono middleware
│   └── index.ts       # Middleware exports
├── storage/           # Data persistence
│   └── index.ts       # Storage interface
├── adapters/          # Integration adapters
│   └── index.ts       # Adapter exports
├── server.ts          # Main Hono HTTP server
├── worker.ts          # Cloudflare Workers entry
├── durableObjects.ts  # Durable Objects implementation
└── result.ts          # Error handling utilities
```

This structure promotes:
- **Single responsibility** - Each file has one clear purpose
- **Domain organization** - Related functionality grouped together
- **Declarative naming** - File names describe what they do, not how
- **Easy testing** - Tests colocated with implementation

## Prerequisites

Before starting development on the Spotify MCP Server, ensure you have:

- **Node.js** 20.0.0 or higher (for ESM support)
- **pnpm** 8.0.0 or higher (`npm install -g pnpm`)
- **Git** for version control
- **Spotify Account** (free or premium)
- **Spotify Developer Account** (free)
- A code editor (VS Code recommended)
- **Cloudflare Account** (free, for deployment)

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ryo-morimoto/spotify-mcp.git
cd spotify-mcp
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all dependencies including:
- TypeScript 5.8.3 and development tools
- @modelcontextprotocol/sdk for MCP implementation
- @spotify/web-api-ts-sdk for Spotify integration
- Hono web framework for HTTP handling
- Vitest for testing
- neverthrow for type-safe error handling
- Development tools (oxlint, prettier)

### 3. Spotify App Configuration

#### Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in the following:
   - **App name**: `Spotify MCP Dev`
   - **App description**: `Development instance of Spotify MCP Server`
   - **Website**: (optional)
   - **Redirect URI**: `http://127.0.0.1:8000/callback`
5. Check "Web API" under "Which API/SDKs are you planning to use?"
6. Agree to the terms and click "Save"

#### Get Your Credentials

After creating the app:
1. You'll see your **Client ID** on the app overview page
2. Click "Settings" to see more details
3. Note: For PKCE flow (recommended), you don't need the Client Secret

### 4. Environment Configuration

Create a `.env` file in the project root:

```bash
# Required
SPOTIFY_CLIENT_ID=your_client_id_here

# Optional - defaults shown
PORT=8000
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback

# Only needed if not using PKCE (not recommended)
# SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Security Note**: Never commit `.env` to version control. It's already in `.gitignore`.

## Development Workflow

### 1. Running the Development Server

```bash
# Start the Hono server locally
pnpm dev

# The server will start on http://127.0.0.1:8000
# Available endpoints:
# - GET  /health     - Health check
# - GET  /auth       - Start OAuth flow
# - GET  /callback   - OAuth callback
# - POST /mcp        - MCP JSON-RPC endpoint
```

### 2. Testing Strategy

```bash
# Run all tests
pnpm test

# Run tests in watch mode (recommended during development)
pnpm vitest --watch

# Run tests with coverage
pnpm test:cov

# Type checking
pnpm typecheck

# Run all checks (before committing)
pnpm check
```

### 3. Code Quality

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Fix lint issues
pnpm lint --fix
```

## Authentication Flow Testing

### 1. Initial Authentication

1. Start the dev server: `pnpm dev`
2. Open browser to: `http://127.0.0.1:8000/auth`
3. You'll be redirected to Spotify
4. Log in and authorize the app
5. You'll be redirected back to `/callback`
6. Tokens are now stored in memory

### 2. Testing Token Refresh

The server automatically refreshes tokens before they expire. To test:

```bash
# View server logs to see refresh behavior
pnpm dev

# Tokens expire after 1 hour
# Server refreshes 5 minutes before expiry
```

### 3. Manual Testing with cURL

```bash
# Health check
curl http://127.0.0.1:8000/health

# Test SSE connection
curl -N -H "Accept: text/event-stream" http://127.0.0.1:8000/sse
```

## MCP Tools Testing

### 1. Using the MCP Inspector

```bash
# Install MCP inspector globally
npm install -g @modelcontextprotocol/inspector

# Run inspector
mcp-inspector http://127.0.0.1:8000/sse
```

### 2. Testing MCP Tools via JSON-RPC

```bash
# Search for tracks
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "search",
      "arguments": {
        "query": "Never Gonna Give You Up",
        "type": "track",
        "limit": 5
      }
    },
    "id": 1
  }'

# Get player state
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "player_state",
      "arguments": {}
    },
    "id": 2
  }'
```

### 3. Testing Error Scenarios

```typescript
// Test with invalid token
// Test with no active device
// Test with rate limiting
// Test with network errors
```

## Key Development Commands

```bash
# Essential workflow commands
pnpm typecheck       # Type checking
pnpm test           # Run all tests
pnpm test:cov       # Coverage report
pnpm check          # typecheck + tests (pre-commit)
pnpm vitest --watch # TDD watch mode

# Code quality
pnpm format         # Format with prettier
pnpm lint           # Lint with oxlint

# Deployment
pnpm build          # Build for production
pnpm deploy         # Deploy to Cloudflare
```

## Common Development Tasks

### Adding a New MCP Tool

1. Create the tool file in `src/mcp/tools/`:

```typescript
// src/mcp/tools/newTool.ts
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { ok, err, Result } from 'neverthrow'
import type { ToolError } from '../../types/index.ts'

export function newTool(args: ToolArgs): Result<CallToolResult, ToolError> {
  // Implementation
  return ok({
    content: [{ type: 'text', text: 'Result' }]
  })
}
```

2. Register in `src/mcp/tools/index.ts`:

```typescript
import { newTool } from './newTool.ts'

export const tools = {
  // existing tools...
  new_tool: newTool
}
```

3. Add comprehensive tests:

```typescript
// src/mcp/tools/newTool.test.ts
import { describe, it, expect } from 'vitest'
import { newTool } from './newTool.ts'

describe('newTool', () => {
  it('should handle success case', () => {
    const result = newTool({ /* args */ })
    expect(result.isOk()).toBe(true)
  })
})
```

### Adding Spotify API Methods

1. Create new file in `src/external/spotify/`:

```typescript
// src/external/spotify/newFeature.ts
import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import { ok, err, Result } from 'neverthrow'
import type { SpotifyError } from '../../types/index.ts'

export async function newFeature(
  client: SpotifyApi,
  params: FeatureParams
): Promise<Result<FeatureResponse, SpotifyError>> {
  try {
    const response = await client.someEndpoint(params)
    return ok(response)
  } catch (error) {
    return err(mapSpotifyError(error))
  }
}
```

2. Export from `src/external/spotify/index.ts`
3. Add tests with mocked Spotify client
4. Update types in `src/types/spotify.ts`

### Error Handling Pattern

Always use neverthrow for error handling:

```typescript
import { ok, err, Result } from 'neverthrow'

function doSomething(): Result<string, Error> {
  try {
    // Success case
    return ok('success')
  } catch (error) {
    // Error case
    return err(new Error('failed'))
  }
}

// Usage
const result = doSomething()
if (result.isOk()) {
  console.log(result.value)
} else {
  console.error(result.error)
}
```

## Debugging

### 1. VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Hono Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/src/server.ts",
      "runtimeArgs": ["--import", "tsx"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current Test",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. Logging

Use structured logging for debugging:

```typescript
console.log('API Request', {
  method: 'GET',
  url: '/api/endpoint',
  headers: { /* ... */ },
  timestamp: new Date().toISOString()
})
```

### 3. Network Debugging

```bash
# Monitor network requests
export DEBUG=spotify-mcp:*
pnpm dev

# Use proxy for request inspection
export HTTP_PROXY=http://127.0.0.1:8080
```

## Testing Best Practices

### 1. Unit Tests

- Test each function in isolation
- Mock external dependencies
- Focus on edge cases
- Aim for >80% coverage

### 2. Integration Tests

- Test API endpoints end-to-end
- Use real Spotify API in test mode
- Test error scenarios
- Verify timeout handling

### 3. Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('Feature', () => {
  beforeEach(() => {
    // Setup
  })

  it('should handle success case', async () => {
    // Arrange
    const input = { /* ... */ }
    
    // Act
    const result = await functionUnderTest(input)
    
    // Assert
    expect(result.isOk()).toBe(true)
    expect(result.value).toEqual(expected)
  })

  it('should handle error case', async () => {
    // Test error scenarios
  })
})
```

## Performance Considerations

### 1. Development Metrics

Monitor these during development:
- Response time for API calls
- Memory usage over time
- Token refresh performance
- SSE connection stability

### 2. Performance Monitoring

```bash
# Run with Node.js profiling
node --inspect src/server.ts

# For Cloudflare Workers local testing
pnpm wrangler dev --local

# Monitor with Chrome DevTools
# Open chrome://inspect
```

### 3. Load Testing

```bash
# Simple load test
for i in {1..100}; do
  curl http://127.0.0.1:8000/health &
done
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

#### TypeScript Errors

```bash
# Clear cache and rebuild
rm -rf node_modules/.cache
pnpm typecheck
```

#### Test Failures

```bash
# Run single test file
pnpm vitest run src/spotifyApi.test.ts

# Run with verbose output
pnpm vitest run --reporter=verbose
```

## Next Steps

1. Review the [Architecture Documentation](./architecture.md)
2. Read the [API Reference](./api-reference.md)
3. Check the [Deployment Guide](./deployment-guide.md)
4. Join the development discussion on GitHub Issues

## Getting Help

- Check existing [GitHub Issues](https://github.com/ryo-morimoto/spotify-mcp/issues)
- Read the [MCP Documentation](https://modelcontextprotocol.io/)
- Review [Spotify Web API Docs](https://developer.spotify.com/documentation/web-api/)
- Ask questions in discussions