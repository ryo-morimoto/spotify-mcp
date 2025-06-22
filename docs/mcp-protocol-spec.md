# MCP Protocol Specification for Spotify MCP Server

## Overview

This document describes the Model Context Protocol (MCP) implementation for the Spotify MCP Server. The server implements the full MCP specification with extensions for Spotify-specific functionality.

## Protocol Version

- **MCP Version**: 1.0
- **JSON-RPC Version**: 2.0
- **Transport**: Server-Sent Events (SSE) over HTTP

## Message Format

All messages follow the JSON-RPC 2.0 specification:

```typescript
interface JsonRpcRequest {
  jsonrpc: "2.0"
  method: string
  params?: any
  id: string | number
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
  id: string | number
}

interface JsonRpcNotification {
  jsonrpc: "2.0"
  method: string
  params?: any
}
```

## Connection Lifecycle

### 1. Client Connection

```
GET /sse
Accept: text/event-stream
Authorization: Bearer <token>

Response:
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### 2. Server Greeting

```
event: message
data: {"jsonrpc":"2.0","method":"connection/ready","params":{"version":"1.0","capabilities":{"tools":true,"resources":true,"prompts":true}}}
```

### 3. Client Initialize

```
→ {"jsonrpc":"2.0","method":"initialize","params":{"clientInfo":{"name":"client","version":"1.0"},"capabilities":{}},"id":"1"}
← {"jsonrpc":"2.0","result":{"serverInfo":{"name":"spotify-mcp","version":"1.0"},"capabilities":{"tools":true,"resources":true,"prompts":true}},"id":"1"}
```

### 4. Keepalive

```
event: keepalive
data: {"timestamp":1234567890}
```

Sent every 30 seconds to maintain connection.

### 5. Connection Close

```
→ {"jsonrpc":"2.0","method":"shutdown","id":"2"}
← {"jsonrpc":"2.0","result":null,"id":"2"}

event: close
data: {"reason":"shutdown"}
```

## Method Specifications

### Core Methods

#### initialize

Initialize the connection and exchange capabilities.

**Request**:
```typescript
{
  clientInfo: {
    name: string
    version: string
  }
  capabilities: {
    tools?: boolean
    resources?: boolean
    prompts?: boolean
  }
}
```

**Response**:
```typescript
{
  serverInfo: {
    name: string
    version: string
  }
  capabilities: {
    tools: boolean
    resources: boolean
    prompts: boolean
  }
}
```

#### shutdown

Gracefully shutdown the connection.

**Request**: No parameters

**Response**: `null`

### Tool Methods

#### tools/list

List all available tools.

**Request**: No parameters

**Response**:
```typescript
{
  tools: Array<{
    name: string
    description: string
    inputSchema: JsonSchema
  }>
}
```

#### tools/invoke

Execute a tool.

**Request**:
```typescript
{
  name: string
  arguments: any
}
```

**Response**:
```typescript
{
  result: any
  error?: {
    type: string
    message: string
    details?: any
  }
}
```

### Resource Methods

#### resources/list

List all available resources.

**Request**: No parameters

**Response**:
```typescript
{
  resources: Array<{
    uri: string
    name: string
    mimeType: string
  }>
}
```

#### resources/read

Read a resource by URI.

**Request**:
```typescript
{
  uri: string
}
```

**Response**:
```typescript
{
  content: any
  mimeType: string
}
```

### Prompt Methods

#### prompts/list

List all available prompts.

**Request**: No parameters

**Response**:
```typescript
{
  prompts: Array<{
    name: string
    description: string
    arguments: Array<{
      name: string
      type: string
      required: boolean
    }>
  }>
}
```

#### prompts/execute

Execute a prompt.

**Request**:
```typescript
{
  name: string
  arguments: Record<string, any>
}
```

**Response**:
```typescript
{
  result: string  // Generated prompt text
}
```

## Notifications

Server can send notifications at any time:

### Tool Result Notification

Sent when a long-running tool completes:

```typescript
{
  jsonrpc: "2.0"
  method: "tools/progress"
  params: {
    toolName: string
    progress: number  // 0-100
    message?: string
  }
}
```

### Resource Update Notification

Sent when a resource changes:

```typescript
{
  jsonrpc: "2.0"
  method: "resources/changed"
  params: {
    uri: string
    changeType: "created" | "updated" | "deleted"
  }
}
```

### Player State Change Notification

Sent when Spotify player state changes:

```typescript
{
  jsonrpc: "2.0"
  method: "spotify/playerStateChanged"
  params: {
    is_playing: boolean
    track?: {
      id: string
      name: string
      artist: string
    }
  }
}
```

## Error Codes

Standard JSON-RPC error codes:

- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error

Custom error codes:

- `1001`: Authentication required
- `1002`: Invalid token
- `1003`: Token expired
- `2001`: Spotify API error
- `2002`: No active device
- `2003`: Rate limit exceeded
- `3001`: Resource not found
- `3002`: Invalid resource URI

## SSE Transport Details

### Message Framing

Each JSON-RPC message is sent as an SSE event:

```
event: message
data: <json-rpc-message>
id: <optional-event-id>
```

### Reconnection

Clients should implement automatic reconnection:

1. Use `Last-Event-ID` header to resume from last received message
2. Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (max)
3. Reset backoff on successful reconnection

### Message Queuing

Server maintains a message queue per connection:

- Queue size: 1000 messages
- TTL: 5 minutes
- Overflow behavior: Drop oldest messages

## Authentication

### Bearer Token

Include Spotify access token in Authorization header:

```
Authorization: Bearer <spotify-access-token>
```

### Token Validation

Server validates:
1. Token signature
2. Token expiry
3. Required scopes
4. User permissions

### Token Refresh

When token expires:

1. Client receives error with code `1003`
2. Client refreshes token via OAuth flow
3. Client reconnects with new token

## Rate Limiting

### Request Limits

- **Per connection**: 100 requests/minute
- **Per user**: 1000 requests/hour
- **Burst**: 10 requests/second

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

### Rate Limit Error

```typescript
{
  jsonrpc: "2.0"
  error: {
    code: 2003
    message: "Rate limit exceeded"
    data: {
      retryAfter: 60  // seconds
    }
  }
  id: "123"
}
```

## Security Considerations

### CORS

Server implements CORS for browser clients:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

### Request Validation

- Validate JSON-RPC structure
- Sanitize string inputs
- Validate parameter types
- Check parameter bounds

### Audit Logging

Log all:
- Authentication attempts
- Tool invocations
- Resource access
- Rate limit violations

## Extension Points

### Custom Tools

Register custom tools via:

```typescript
server.registerTool({
  name: string
  description: string
  inputSchema: JsonSchema
  handler: (args: any) => Promise<Result>
})
```

### Custom Resources

Register custom resources via:

```typescript
server.registerResource({
  uri: string
  name: string
  mimeType: string
  reader: () => Promise<any>
})
```

### Middleware

Add request/response middleware:

```typescript
server.use((req, res, next) => {
  // Custom logic
  next()
})
```

## Client Implementation Guide

### TypeScript Client Example

```typescript
class SpotifyMCPClient {
  private eventSource: EventSource
  private requestId = 0
  private pendingRequests = new Map()

  connect(url: string, token: string) {
    this.eventSource = new EventSource(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    this.eventSource.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)
        this.pendingRequests.delete(message.id)
        
        if (message.error) {
          reject(message.error)
        } else {
          resolve(message.result)
        }
      } else if (message.method) {
        this.handleNotification(message)
      }
    }
  }

  async request(method: string, params?: any): Promise<any> {
    const id = String(++this.requestId)
    const request = {
      jsonrpc: "2.0",
      method,
      params,
      id
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
      
      // Send via POST to /rpc endpoint
      fetch('/rpc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(request)
      })
    })
  }
}
```

## Testing

### Protocol Conformance

Test suite validates:
- JSON-RPC 2.0 compliance
- MCP method implementations
- Error handling
- Edge cases

### Load Testing

- 1000 concurrent connections
- 100,000 requests/minute
- Message delivery latency < 100ms (p95)

### Integration Testing

- Full OAuth flow
- Tool execution
- Resource access
- Error recovery