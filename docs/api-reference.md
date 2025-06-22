# Spotify MCP Server API Reference

## Modular API Structure

The API is organized by domain with declarative function modules:

```
external/          # External API integrations (使うAPI)
└── spotify/       # Spotify Web API operations
    └── index.ts   # Public Spotify API exports

auth/              # Authentication domain logic
├── index.ts       # Public auth interface
├── spotify.ts     # Spotify OAuth implementation
├── pkce.ts        # PKCE utilities
└── tokens.ts      # Token management

mcp/               # MCP protocol implementation (transport-agnostic)
├── index.ts       # Public MCP interface
├── server.ts      # MCP server core
├── tools/         # MCP tools
├── resources/     # MCP resources
└── prompts/       # MCP prompts

routes/            # HTTP route handlers
├── index.ts       # Route exports
├── auth.ts        # OAuth endpoints (/auth, /callback)
├── mcp.ts         # MCP JSON-RPC endpoint (/mcp)
└── health.ts      # Health check (/health)
```

## OAuth & Security

### OAuth 2.0 PKCE Flow (`auth/`)

The server implements OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authorization without requiring a client secret.

#### 1. Generate PKCE Challenge

```typescript
import { pkce } from './auth/index.ts'

const challengeResult = await pkce.generateChallenge()
if (challengeResult.isOk()) {
  const { codeVerifier, codeChallenge, challengeMethod } = challengeResult.value
  // Store codeVerifier securely for token exchange
}
```

#### 2. Generate Authorization URL

```typescript
import { pkce } from './auth/index.ts'

const authUrlResult = pkce.generateAuthUrl(
  clientId,
  redirectUri,
  pkceChallenge,
  ['user-read-playback-state', 'user-modify-playback-state'],
  state // Optional CSRF protection
)

if (authUrlResult.isOk()) {
  // Redirect user to authUrlResult.value
}
```

#### 3. Exchange Code for Token

```typescript
import { exchangeCodeForToken } from './auth/index.ts'

const tokenResult = await exchangeCodeForToken(
  code,           // From callback URL
  clientId,
  redirectUri,
  codeVerifier    // Stored from step 1
)

if (tokenResult.isOk()) {
  const { access_token, refresh_token, expires_in } = tokenResult.value
  // Store tokens securely
}
```

#### 4. Refresh Token

```typescript
import { refreshToken } from './auth/index.ts'

const refreshResult = await refreshToken(
  refreshToken,
  clientId
)

if (refreshResult.isOk()) {
  const { access_token, expires_in } = refreshResult.value
  // Update stored access token
}
```

### Required OAuth Scopes

- `user-read-playback-state` - Read current playback state
- `user-modify-playback-state` - Control playback (play, pause, skip, etc.)
- `user-read-currently-playing` - Get currently playing track
- `playlist-read-private` - Read user's private playlists
- `playlist-modify-public` - Create/modify public playlists
- `playlist-modify-private` - Create/modify private playlists
- `user-library-read` - Read saved tracks and albums
- `user-library-modify` - Save/remove tracks and albums
- `user-read-recently-played` - Read recently played items
- `user-top-read` - Read user's top artists and tracks

## Spotify API Client

### Search Tracks

Search for tracks on Spotify.

```typescript
import { searchTracks } from './external/spotify/index.ts'

const result = await searchTracks(token, {
  query: "Never Gonna Give You Up",
  limit: 10,
  offset: 0
})

if (result.isOk()) {
  const { tracks, total, next, previous } = result.value
  tracks.forEach(track => {
    console.log(`${track.name} by ${track.artist}`)
  })
}
```

**Parameters:**
- `token` (string): Valid Spotify access token
- `options`:
  - `query` (string): Search query
  - `limit` (number): Number of results (1-50, default: 20)
  - `offset` (number): Results offset (default: 0)

**Returns:** `Result<SearchResult, SpotifyApiError>`

```typescript
interface SearchResult {
  tracks: Track[]
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}

interface Track {
  id: string
  name: string
  artist: string
  album: string
  uri: string
  external_url: string
  duration_ms: number
  explicit: boolean
  popularity: number
  preview_url: string | null
}
```

### Get Current Playback

Get information about the user's current playback state.

```typescript
import { getCurrentPlayback } from './external/spotify/index.ts'

const result = await getCurrentPlayback(token)

if (result.isOk()) {
  const playback = result.value
  if (playback) {
    console.log(`Playing: ${playback.track.name}`)
    console.log(`Progress: ${playback.progress_ms}/${playback.track.duration_ms}`)
  } else {
    console.log("No active playback")
  }
}
```

**Returns:** `Result<PlaybackState | null, SpotifyApiError>`

```typescript
interface PlaybackState {
  is_playing: boolean
  track: {
    id: string
    name: string
    artist: string
    album: string
    uri: string
    duration_ms: number
    progress_ms: number
    external_url: string
  }
  device: {
    id: string
    name: string
    type: string
    volume_percent: number
    is_active: boolean
  } | null
  repeat_state: 'off' | 'track' | 'context'
  shuffle_state: boolean
  context: {
    type: 'album' | 'playlist' | 'show' | 'collection'
    uri: string
    external_url: string
  } | null
}
```

### Control Playback

Control the user's Spotify playback.

```typescript
import { controlPlayback } from './external/spotify/index.ts'

// Play/Resume
await controlPlayback(token, { action: 'play' })

// Play specific track
await controlPlayback(token, { 
  action: 'play',
  uri: 'spotify:track:4cOdK2wGLETKBW3PvgPWqT'
})

// Pause
await controlPlayback(token, { action: 'pause' })

// Next track
await controlPlayback(token, { action: 'next' })

// Previous track
await controlPlayback(token, { action: 'previous' })

// Seek to position
await controlPlayback(token, { 
  action: 'seek',
  position_ms: 30000 // 30 seconds
})

// Set volume
await controlPlayback(token, { 
  action: 'volume',
  volume_percent: 50
})

// Set repeat mode
await controlPlayback(token, { 
  action: 'repeat',
  state: 'track' // 'off', 'track', or 'context'
})

// Toggle shuffle
await controlPlayback(token, { 
  action: 'shuffle',
  state: true
})

// Transfer playback to another device
await controlPlayback(token, { 
  action: 'transfer',
  device_id: 'device_id_here',
  play: true // Start playback on new device
})
```

**Parameters:**
- `token` (string): Valid Spotify access token
- `options`: Control options based on action

**Returns:** `Result<void, SpotifyApiError>`

## MCP Server

### Creating an MCP Server

```typescript
import { createMCPServer } from './mcp/index.ts'

const tokenManager: TokenManager = {
  async getToken() {
    // Return valid token
  },
  async refreshTokenIfNeeded() {
    // Refresh if needed and return token
  }
}

const serverResult = await createMCPServer(tokenManager)
if (serverResult.isOk()) {
  const server = serverResult.value
  // Server is ready to handle requests
}
```

### Available MCP Tools

#### 1. Search Tool

```json
{
  "name": "search",
  "arguments": {
    "query": "search query",
    "limit": 10,
    "offset": 0
  }
}
```

#### 2. Player State Tool

```json
{
  "name": "player_state"
}
```

#### 3. Player Control Tool

```json
{
  "name": "player_control",
  "arguments": {
    "action": "play",
    "uri": "spotify:track:..."
  }
}
```

## Token Management

### Token Manager Interface

```typescript
interface TokenManager {
  getToken(): Promise<Result<string, NetworkError | AuthError>>
  refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>>
}
```

### Durable Object Token Manager

For Cloudflare Workers deployment:

```typescript
class SpotifyTokenDurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathname = url.pathname
    
    // GET /token/{userId}
    // POST /token/{userId} with body: { access_token, refresh_token, expires_in }
    // PUT /token/{userId}/refresh
    // DELETE /token/{userId}
    // GET /token/{userId}/status
  }
}
```

## Error Handling

All functions return `Result<T, E>` types using neverthrow:

```typescript
import { Result, ok, err } from 'neverthrow'

// Success case
const successResult: Result<string, Error> = ok("success")

// Error case
const errorResult: Result<string, Error> = err(new Error("failed"))

// Handle results
result
  .map(value => {
    // Handle success
  })
  .mapErr(error => {
    // Handle error
  })
```

### Error Types

```typescript
interface NetworkError {
  type: 'NetworkError'
  message: string
  statusCode?: number
}

interface AuthError {
  type: 'AuthError'
  message: string
  reason: 'expired' | 'invalid' | 'missing'
}

interface SpotifyError {
  type: 'SpotifyError'
  message: string
  spotifyErrorCode?: string
}

interface ValidationError {
  type: 'ValidationError'
  message: string
  field?: string
}
```

## Cloudflare Workers Deployment

### Worker Configuration

```toml
# wrangler.toml
name = "spotify-mcp"
main = "src/worker.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "SPOTIFY_TOKENS"
class_name = "TokenStore"

[[durable_objects.bindings]]
name = "AUTH_STATE"
class_name = "AuthState"

[vars]
SPOTIFY_CLIENT_ID = "your-client-id"
REDIRECT_URI = "https://your-worker.workers.dev/callback"
```

### Environment Types

```typescript
interface Env {
  SPOTIFY_CLIENT_ID: string
  WORKER_URL: string
  SPOTIFY_TOKENS: DurableObjectNamespace
  AUTH_STATE: DurableObjectNamespace
}
```

## MCP Communication

### JSON-RPC Endpoint

```typescript
// Send MCP request to /mcp endpoint
const response = await fetch('/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/invoke',
    params: {
      name: 'search',
      arguments: { query: 'test' }
    },
    id: '1'
  })
})

const result = await response.json()
// Handle MCP response
```

### Message Format

All messages follow JSON-RPC 2.0:

```typescript
// Request
{
  "jsonrpc": "2.0",
  "method": "tools/invoke",
  "params": {
    "name": "search",
    "arguments": { "query": "test" }
  },
  "id": "1"
}

// Response
{
  "jsonrpc": "2.0",
  "result": { /* tool result */ },
  "id": "1"
}

// Error
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal error",
    "data": { /* error details */ }
  },
  "id": "1"
}
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { searchTracks } from './spotifyApi.ts'

describe('searchTracks', () => {
  it('should return search results', async () => {
    const result = await searchTracks('valid-token', {
      query: 'test',
      limit: 1
    })
    
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.tracks).toHaveLength(1)
    }
  })
})
```

### Integration Testing

```typescript
// Test with real Spotify API
const token = await getTestToken()
const result = await searchTracks(token, { query: 'real query' })
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:cov

# Watch mode
pnpm vitest --watch

# Type checking
pnpm typecheck
```