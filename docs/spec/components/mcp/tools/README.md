# MCP Tools Specifications

## Overview

Tools are executable functions that perform actions within the Spotify MCP Server. Each tool has a specific purpose, well-defined inputs/outputs, and error handling.

## Tool Structure

Each tool specification follows this structure:

```typescript
interface ToolSpecification {
  // Metadata
  name: string
  description: string
  category: 'playback' | 'search' | 'library' | 'playlist'
  
  // Schema
  inputSchema: JsonSchema
  outputSchema: JsonSchema
  
  // Implementation
  handler: ToolHandler
  
  // Requirements
  requiredScopes: string[]
  rateLimit?: RateLimitConfig
}
```

## Available Tools

### Core Tools (Implemented)

1. **[search](./search.md)** - Search Spotify catalog
   - Search for tracks, albums, artists, playlists
   - Natural language query support
   - Pagination and filtering

2. **[player_state](./player-state.md)** - Get current playback state
   - Current track information
   - Device status
   - Playback progress

3. **[player_control](./player-control.md)** - Control playback
   - Play/pause/skip
   - Volume and shuffle control
   - Device transfer

### Planned Tools

4. **playlist_create** - Create new playlists
5. **playlist_modify** - Add/remove tracks from playlists
6. **recommendations** - Get music recommendations
7. **audio_features** - Analyze track characteristics
8. **devices** - List available devices
9. **library_save** - Save tracks to library
10. **recently_played** - Get listening history

## Tool Development Guidelines

### 1. Input Validation

All tools MUST validate inputs against their schema:

```typescript
const validator = ajv.compile(tool.inputSchema)
if (!validator(input)) {
  return err({
    type: 'ValidationError',
    message: 'Invalid input',
    errors: validator.errors
  })
}
```

### 2. Error Handling

Tools MUST handle all error cases:

```typescript
type ToolError = 
  | ValidationError    // Invalid input
  | AuthError         // Authentication issues
  | SpotifyError      // Spotify API errors
  | NetworkError      // Network failures
  | BusinessError     // Business logic errors
```

### 3. Output Formatting

Tools return formatted text content:

```typescript
interface ToolResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}
```

### 4. Performance

Each tool MUST meet performance requirements:
- Response time: < 2s (p95)
- Memory usage: < 10MB
- API calls: Minimize

### 5. Security

Tools MUST:
- Validate all inputs
- Check required scopes
- Sanitize outputs
- Log security events

## Tool Context

Each tool receives a context object:

```typescript
interface ToolContext {
  token: string          // Spotify access token
  userId: string         // User identifier
  requestId: string      // Request correlation ID
  timestamp: number      // Request timestamp
}
```

## Testing Requirements

### Unit Tests

Each tool MUST have tests for:
- Valid inputs
- Invalid inputs
- API success cases
- API error cases
- Edge cases

### Integration Tests

Tools MUST be tested with:
- Real Spotify API
- Token refresh scenarios
- Rate limiting
- Concurrent execution

## Common Patterns

### 1. Pagination

```typescript
interface PaginatedInput {
  limit?: number   // Items per page (max: 50)
  offset?: number  // Starting position
}

interface PaginatedOutput {
  items: Array<any>
  total: number
  limit: number
  offset: number
  next: string | null
  previous: string | null
}
```

### 2. Error Messages

```typescript
function formatError(error: ToolError): string {
  switch (error.type) {
    case 'AuthError':
      return '🔒 Authentication required. Please re-authenticate.'
    case 'SpotifyError':
      return `❌ Spotify error: ${error.message}`
    case 'NetworkError':
      return '🌐 Network error. Please try again.'
    default:
      return `❌ Error: ${error.message}`
  }
}
```

### 3. Success Messages

```typescript
function formatSuccess(action: string): string {
  const emojis = {
    play: '▶️',
    pause: '⏸️',
    next: '⏭️',
    previous: '⏮️',
    save: '💾',
    create: '✨'
  }
  
  return `${emojis[action] || '✅'} ${action} successful`
}
```

## Rate Limiting

Tools respect Spotify's rate limits:

```typescript
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  strategy: 'fixed-window' | 'sliding-window'
}

// Default: 100 requests per minute
const defaultRateLimit: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000,
  strategy: 'sliding-window'
}
```

## Monitoring

Each tool tracks:
- Execution count
- Success/failure rate
- Response time
- Error distribution

```typescript
interface ToolMetrics {
  tool: string
  executions: number
  successRate: number
  avgResponseTime: number
  errors: Record<string, number>
}
```