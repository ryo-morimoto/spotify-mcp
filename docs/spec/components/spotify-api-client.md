# Spotify API Client Component Specification

## Purpose & Responsibility

The Spotify API Client provides a type-safe, error-handled wrapper around Spotify's Web API. It is responsible for:

- Making authenticated HTTP requests to Spotify endpoints
- Transforming API responses into domain models
- Handling API-specific errors and rate limiting
- Providing a consistent interface for all Spotify operations
- Ensuring no exceptions are thrown (using Result types)

This component acts as the boundary between our application and Spotify's external API, isolating API changes and providing a stable interface.

## Interface Definition

### Public API

```typescript
// Track Search
export async function searchTracks(
  accessToken: string,
  options: SearchOptions
): Promise<Result<SearchResult, SpotifyApiError>>

// Playback State
export async function getCurrentPlayback(
  accessToken: string
): Promise<Result<PlaybackState | null, SpotifyApiError>>

// Playback Control
export async function controlPlayback(
  accessToken: string,
  command: PlaybackCommand
): Promise<Result<void, SpotifyApiError>>

// Playlist Operations
export async function createPlaylist(
  accessToken: string,
  userId: string,
  playlist: PlaylistCreate
): Promise<Result<Playlist, SpotifyApiError>>

export async function modifyPlaylist(
  accessToken: string,
  playlistId: string,
  modification: PlaylistModification
): Promise<Result<void, SpotifyApiError>>

// Recommendations
export async function getRecommendations(
  accessToken: string,
  params: RecommendationParams
): Promise<Result<RecommendationResult, SpotifyApiError>>

// Audio Features
export async function getAudioFeatures(
  accessToken: string,
  trackIds: string[]
): Promise<Result<AudioFeature[], SpotifyApiError>>

// Device Management
export async function getDevices(
  accessToken: string
): Promise<Result<Device[], SpotifyApiError>>
```

### Type Definitions

```typescript
// Search Types
interface SearchOptions {
  query: string          // Search query
  type?: 'track'         // Search type (only tracks for now)
  limit?: number         // Results per page (1-50, default: 20)
  offset?: number        // Results offset (default: 0)
  market?: string        // ISO 3166-1 alpha-2 country code
}

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
  artist: string         // Primary artist name
  artists: Artist[]      // All artists
  album: Album
  uri: string           // Spotify URI
  external_url: string  // Web URL
  duration_ms: number
  explicit: boolean
  popularity: number    // 0-100
  preview_url: string | null
  is_playable?: boolean
}

// Playback Types
interface PlaybackState {
  is_playing: boolean
  track: CurrentTrack
  device: Device | null
  repeat_state: 'off' | 'track' | 'context'
  shuffle_state: boolean
  context: PlaybackContext | null
  progress_ms: number
  timestamp: number
}

interface PlaybackCommand {
  action: 'play' | 'pause' | 'next' | 'previous' | 'seek' | 
          'volume' | 'repeat' | 'shuffle' | 'transfer'
  
  // For 'play' action
  uri?: string              // Track/album/playlist URI
  context_uri?: string      // Album/playlist URI
  offset?: {
    position?: number       // Track index (0-based)
    uri?: string           // Track URI
  }
  position_ms?: number      // Start position
  
  // For 'seek' action
  position_ms?: number      // Seek position
  
  // For 'volume' action
  volume_percent?: number   // 0-100
  
  // For 'repeat' action
  state?: 'off' | 'track' | 'context'
  
  // For 'shuffle' action
  state?: boolean
  
  // For 'transfer' action
  device_id?: string
  play?: boolean
}

// Error Types
interface SpotifyApiError {
  type: 'SpotifyError'
  message: string
  statusCode: number
  spotifyError?: {
    error: {
      status: number
      message: string
      reason?: string
    }
  }
  retryAfter?: number  // For rate limiting
}
```

## Dependencies

### External Dependencies
- `neverthrow` (^6.0.0) - Result type for error handling
- Fetch API - HTTP client

### Internal Dependencies
- `result.ts` - Base error types
- `oauth-handler.ts` - Token validation (indirect)

## Behavior Specification

### Request Construction

All requests follow this pattern:

1. Validate access token format
2. Construct URL with base: `https://api.spotify.com/v1`
3. Set headers:
   ```
   Authorization: Bearer {accessToken}
   Content-Type: application/json (for POST/PUT)
   Accept: application/json
   ```
4. Add query parameters or body as needed
5. Set appropriate timeout (5 seconds)

### Response Handling

1. Check HTTP status code:
   - 200-299: Success, parse JSON
   - 400: Bad request, extract error details
   - 401: Unauthorized, token expired/invalid
   - 403: Forbidden, insufficient scope
   - 404: Resource not found
   - 429: Rate limited, extract Retry-After
   - 500-599: Server error, retry eligible

2. Parse response body:
   - Validate against expected schema
   - Transform to domain model
   - Handle missing optional fields

3. Return Result:
   - Success: `ok(transformedData)`
   - Error: `err(SpotifyApiError)`

### Search Behavior

1. Validate query (non-empty, < 100 chars)
2. Encode query for URL
3. Append type parameter (default: 'track')
4. Handle pagination parameters
5. Transform Spotify track format to simplified model
6. Extract pagination links

### Playback State Behavior

1. Request current playback state
2. Handle 204 (no active device) as `null`
3. Transform complex nested response
4. Calculate relative timestamps
5. Handle missing optional fields

### Playback Control Behavior

Action-specific behaviors:

- **Play**: Can specify context, position, or resume
- **Pause**: No parameters needed
- **Next/Previous**: Skip track in context
- **Seek**: Requires position_ms
- **Volume**: Requires volume_percent (0-100)
- **Repeat**: Cycles through states
- **Shuffle**: Toggle boolean
- **Transfer**: Move playback to device

All return 204 No Content on success.

### Rate Limiting

1. Detect 429 status code
2. Extract `Retry-After` header (seconds)
3. Return error with retry information
4. Client responsible for retry logic

### Error Transformation

```typescript
function transformSpotifyError(response: Response): SpotifyApiError {
  const base = {
    type: 'SpotifyError' as const,
    message: getErrorMessage(response),
    statusCode: response.status
  }
  
  if (response.status === 429) {
    return {
      ...base,
      retryAfter: parseInt(response.headers.get('Retry-After') || '60')
    }
  }
  
  // Parse Spotify error body if available
  try {
    const body = await response.json()
    return {
      ...base,
      spotifyError: body
    }
  } catch {
    return base
  }
}
```

## Error Handling

### Common Error Scenarios

1. **Token Expired (401)**
   - Message: "Invalid access token"
   - Recovery: Refresh token and retry

2. **Insufficient Scope (403)**
   - Message: "Insufficient client scope"
   - Recovery: Re-authenticate with required scopes

3. **No Active Device (404)**
   - Message: "Player command failed: No active device found"
   - Recovery: User must start playback on a device

4. **Rate Limited (429)**
   - Message: "API rate limit exceeded"
   - Recovery: Wait for Retry-After seconds

5. **Bad Request (400)**
   - Various messages based on validation
   - Recovery: Fix request parameters

6. **Server Error (500+)**
   - Message: "Spotify server error"
   - Recovery: Retry with exponential backoff

### Network Error Handling

- Connection timeout (5s)
- DNS resolution failure
- TLS handshake failure
- Connection reset

All network errors wrapped in SpotifyApiError with appropriate message.

## Testing Requirements

### Unit Tests

```typescript
describe('Spotify API Client', () => {
  describe('searchTracks', () => {
    it('should return tracks for valid query')
    it('should handle empty results')
    it('should respect limit parameter')
    it('should handle pagination')
    it('should escape special characters in query')
    it('should handle 401 unauthorized')
    it('should handle 429 rate limit')
    it('should handle network timeout')
  })
  
  describe('getCurrentPlayback', () => {
    it('should return current playback state')
    it('should return null for no active device')
    it('should handle missing optional fields')
    it('should calculate progress correctly')
  })
  
  describe('controlPlayback', () => {
    it('should play with no parameters')
    it('should play specific track')
    it('should play with context and offset')
    it('should pause playback')
    it('should skip to next/previous')
    it('should seek to position')
    it('should set volume')
    it('should handle no active device')
  })
})
```

### Integration Tests

```typescript
describe('Spotify API Integration', () => {
  it('should complete full playback flow')
  it('should handle token refresh during operation')
  it('should respect rate limits')
  it('should recover from network errors')
})
```

### Mock Responses

```typescript
// Successful search response
const mockSearchResponse = {
  tracks: {
    items: [{
      id: "4cOdK2wGLETKBW3PvgPWqT",
      name: "Never Gonna Give You Up",
      artists: [{ name: "Rick Astley" }],
      album: { name: "Whenever You Need Somebody" },
      duration_ms: 213573,
      explicit: false,
      popularity: 86,
      uri: "spotify:track:4cOdK2wGLETKBW3PvgPWqT"
    }],
    total: 1,
    limit: 20,
    offset: 0
  }
}
```

## Performance Constraints

### Latency Requirements
- Search: < 500ms (p95)
- Playback state: < 300ms (p95)
- Control commands: < 200ms (p95)
- Batch operations: < 1s

### Resource Limits
- Max 50 tracks per search
- Max 100 tracks for audio features
- Max 50 items per playlist operation
- Request timeout: 5 seconds

### Concurrent Requests
- Max 10 concurrent requests per token
- Implement request queuing
- Share rate limit across requests

## Security Considerations

### Token Handling
- Never log access tokens
- Pass tokens in headers only
- Clear tokens from memory after use
- Validate token format before use

### Data Validation
- Sanitize search queries
- Validate URIs format
- Check array bounds
- Prevent injection attacks

### HTTPS Only
- All requests over HTTPS
- Verify SSL certificates
- No HTTP fallback
- Pin certificates in production

### Error Messages
- Don't expose internal details
- Sanitize Spotify error messages
- Log full errors server-side
- Return safe errors to clients