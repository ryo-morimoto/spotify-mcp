# MCP Server Component Specification

## Purpose & Responsibility

The MCP Server component implements the Model Context Protocol, providing a standardized interface for AI assistants to interact with Spotify. It is responsible for:

- Exposing Spotify functionality as MCP tools
- Managing request/response lifecycle
- Validating tool inputs and outputs
- Coordinating between protocol layer and business logic
- Maintaining protocol compliance and versioning

This component serves as the core of the system, translating MCP protocol requests into Spotify operations.

## Interface Definition

### Public API

```typescript
// Server Creation
export async function createMCPServer(
  tokenManager: TokenManager
): Promise<Result<Server, NetworkError | AuthError>>

// Server Lifecycle
export interface MCPServer {
  start(): Promise<void>
  stop(): Promise<void>
  handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse>
}

// Token Manager Interface
export interface TokenManager {
  getToken(): Promise<Result<string, NetworkError | AuthError>>
  refreshTokenIfNeeded(): Promise<Result<string, NetworkError | AuthError>>
}
```

### Tool Definitions

```typescript
// Search Tool
interface SearchTool {
  name: 'search'
  description: 'Search for tracks on Spotify'
  inputSchema: {
    type: 'object'
    properties: {
      query: { type: 'string', description: 'Search query' }
      limit: { type: 'number', minimum: 1, maximum: 50, default: 10 }
      offset: { type: 'number', minimum: 0, default: 0 }
    }
    required: ['query']
  }
}

// Player State Tool
interface PlayerStateTool {
  name: 'player_state'
  description: 'Get current Spotify playback state'
  inputSchema: {
    type: 'object'
    properties: {}
  }
}

// Player Control Tool
interface PlayerControlTool {
  name: 'player_control'
  description: 'Control Spotify playback'
  inputSchema: {
    type: 'object'
    properties: {
      action: {
        type: 'string'
        enum: ['play', 'pause', 'next', 'previous', 'seek', 
               'volume', 'repeat', 'shuffle', 'transfer']
      }
      // Action-specific parameters...
    }
    required: ['action']
  }
}

// Additional Tools (future)
interface PlaylistCreateTool { /* ... */ }
interface PlaylistModifyTool { /* ... */ }
interface RecommendationsTool { /* ... */ }
interface AudioFeaturesTool { /* ... */ }
interface DevicesTool { /* ... */ }
```

### Protocol Types

```typescript
// MCP Protocol Types
interface ToolResult {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError?: boolean
}

interface ServerCapabilities {
  tools: boolean
  resources: boolean
  prompts: boolean
}

interface ServerInfo {
  name: string
  version: string
}

// JSON-RPC Types
interface JsonRpcRequest {
  jsonrpc: '2.0'
  method: string
  params?: any
  id: string | number
}

interface JsonRpcResponse {
  jsonrpc: '2.0'
  result?: any
  error?: JsonRpcError
  id: string | number
}

interface JsonRpcError {
  code: number
  message: string
  data?: any
}
```

## Dependencies

### External Dependencies
- `@modelcontextprotocol/sdk` (^0.5.0) - MCP protocol implementation
- `neverthrow` (^6.0.0) - Error handling

### Internal Dependencies
- `spotify-api-client.ts` - Spotify API operations
- `token-manager.ts` - Token lifecycle management
- `error-handler.ts` - Error transformation

## Behavior Specification

### Server Initialization

1. Create MCP SDK server instance
2. Register tool handlers
3. Set up request routing
4. Initialize token manager connection
5. Validate server configuration
6. Return initialized server

```typescript
const server = new Server({
  name: 'spotify-mcp',
  version: '1.0.0'
}, {
  capabilities: {
    tools: true,
    resources: true,
    prompts: true
  }
})
```

### Request Handling Flow

1. **Request Reception**
   - Parse JSON-RPC request
   - Validate request structure
   - Extract method and parameters

2. **Method Routing**
   ```
   initialize → Handle capability exchange
   tools/list → Return available tools
   tools/invoke → Execute specific tool
   resources/list → List available resources
   resources/read → Read resource data
   prompts/list → List available prompts
   prompts/execute → Execute prompt
   ```

3. **Tool Execution**
   - Validate tool exists
   - Validate input against schema
   - Get valid token from manager
   - Execute tool logic
   - Format result
   - Return response

### Tool Implementation

#### Search Tool

```typescript
async function handleSearch(args: SearchArgs): Promise<ToolResult> {
  // 1. Validate inputs
  if (!args.query || args.query.trim().length === 0) {
    return errorResult('Query cannot be empty')
  }
  
  // 2. Get token
  const tokenResult = await tokenManager.getToken()
  if (tokenResult.isErr()) {
    return errorResult('Authentication required')
  }
  
  // 3. Search tracks
  const searchResult = await searchTracks(tokenResult.value, {
    query: args.query,
    limit: args.limit || 10,
    offset: args.offset || 0
  })
  
  // 4. Handle errors
  if (searchResult.isErr()) {
    return errorResult(formatSpotifyError(searchResult.error))
  }
  
  // 5. Format results
  return {
    content: [{
      type: 'text',
      text: formatSearchResults(searchResult.value)
    }]
  }
}
```

#### Player State Tool

```typescript
async function handlePlayerState(): Promise<ToolResult> {
  // 1. Get token
  const tokenResult = await tokenManager.getToken()
  if (tokenResult.isErr()) {
    return errorResult('Authentication required')
  }
  
  // 2. Get playback state
  const stateResult = await getCurrentPlayback(tokenResult.value)
  if (stateResult.isErr()) {
    return errorResult(formatSpotifyError(stateResult.error))
  }
  
  // 3. Handle no active device
  if (!stateResult.value) {
    return {
      content: [{
        type: 'text',
        text: 'No active Spotify playback found.'
      }]
    }
  }
  
  // 4. Format state
  return {
    content: [{
      type: 'text',
      text: formatPlaybackState(stateResult.value)
    }]
  }
}
```

#### Player Control Tool

```typescript
async function handlePlayerControl(args: ControlArgs): Promise<ToolResult> {
  // 1. Validate action
  if (!isValidAction(args.action)) {
    return errorResult(`Invalid action: ${args.action}`)
  }
  
  // 2. Validate action-specific parameters
  const validation = validateActionParams(args)
  if (validation.isErr()) {
    return errorResult(validation.error)
  }
  
  // 3. Get token
  const tokenResult = await tokenManager.getToken()
  if (tokenResult.isErr()) {
    return errorResult('Authentication required')
  }
  
  // 4. Execute control command
  const controlResult = await controlPlayback(
    tokenResult.value,
    args
  )
  
  // 5. Handle errors
  if (controlResult.isErr()) {
    return errorResult(formatSpotifyError(controlResult.error))
  }
  
  // 6. Return success
  return {
    content: [{
      type: 'text',
      text: `✅ ${formatActionSuccess(args.action)}`
    }]
  }
}
```

### Output Formatting

```typescript
function formatSearchResults(results: SearchResult): string {
  if (results.tracks.length === 0) {
    return 'No tracks found.'
  }
  
  const header = `Found ${results.total} tracks:\n\n`
  const tracks = results.tracks.map((track, i) => 
    `${i + 1}. "${track.name}" by ${track.artist}\n` +
    `   Album: ${track.album.name}\n` +
    `   URI: ${track.uri}`
  ).join('\n\n')
  
  return header + tracks
}

function formatPlaybackState(state: PlaybackState): string {
  const status = state.is_playing ? '▶️ Playing' : '⏸️ Paused'
  const progress = formatTime(state.progress_ms)
  const duration = formatTime(state.track.duration_ms)
  
  return `${status}:\n` +
    `🎵 "${state.track.name}" by ${state.track.artist}\n` +
    `💿 Album: ${state.track.album}\n` +
    `📱 Device: ${state.device?.name || 'Unknown'}\n` +
    `🔊 Volume: ${state.device?.volume_percent || 0}%\n` +
    `⏱️ Progress: ${progress} / ${duration}`
}
```

## Error Handling

### Error Types

1. **Protocol Errors** (JSON-RPC)
   - Parse error (-32700)
   - Invalid request (-32600)
   - Method not found (-32601)
   - Invalid params (-32602)
   - Internal error (-32603)

2. **Application Errors**
   - Authentication required (1001)
   - Token expired (1002)
   - Spotify API error (2001)
   - No active device (2002)
   - Invalid input (3001)

### Error Response Format

```typescript
function createErrorResponse(
  id: string | number,
  code: number,
  message: string,
  data?: any
): JsonRpcResponse {
  return {
    jsonrpc: '2.0',
    error: {
      code,
      message,
      data
    },
    id
  }
}
```

### Error Recovery

- **Token Expired**: Automatic refresh via TokenManager
- **Rate Limited**: Return retry information to client
- **No Device**: Clear error message with instructions
- **Network Error**: Suggest retry with backoff

## Testing Requirements

### Unit Tests

```typescript
describe('MCP Server', () => {
  describe('Server Creation', () => {
    it('should create server with token manager')
    it('should handle initialization errors')
    it('should register all tools')
  })
  
  describe('Tool: search', () => {
    it('should search with valid query')
    it('should handle empty query')
    it('should respect limit parameter')
    it('should handle authentication errors')
    it('should format results correctly')
  })
  
  describe('Tool: player_state', () => {
    it('should return current state')
    it('should handle no active device')
    it('should format all fields')
    it('should handle missing optional fields')
  })
  
  describe('Tool: player_control', () => {
    it('should execute each action type')
    it('should validate action parameters')
    it('should handle device not found')
    it('should return appropriate success messages')
  })
  
  describe('Protocol Compliance', () => {
    it('should handle initialize method')
    it('should list tools correctly')
    it('should validate JSON-RPC format')
    it('should return proper error codes')
  })
})
```

### Integration Tests

```typescript
describe('MCP Server Integration', () => {
  it('should handle full search → play flow')
  it('should recover from token expiration')
  it('should handle concurrent requests')
  it('should maintain protocol compliance')
})
```

## Performance Constraints

### Latency Requirements
- Tool listing: < 1ms
- Search tool: < 600ms
- Player state: < 400ms
- Control commands: < 300ms
- Initialize: < 10ms

### Resource Limits
- Max concurrent requests: 100
- Response size: < 1MB
- Memory per request: < 10MB

### Scalability
- Stateless operation
- Horizontal scaling ready
- Connection pooling for Spotify API

## Security Considerations

### Input Validation
- Strict schema validation
- Input sanitization
- Parameter bounds checking
- Injection prevention

### Authentication
- Token validation on every request
- Scope verification per tool
- Token refresh transparency

### Output Security
- No token leakage in responses
- Sanitized error messages
- No internal details exposed

### Rate Limiting
- Per-user limits
- Tool-specific limits
- Graceful degradation