# SSE Transport Component Specification [DEPRECATED]

> ⚠️ **DEPRECATED**: SSE support has been removed in favor of JSON-RPC over HTTP. This document is kept for historical reference only. Please see [MCP Protocol Specification](../mcp-protocol-spec.md) for current implementation details.

## Purpose & Responsibility

The SSE Transport component implements bidirectional communication over Server-Sent Events for the MCP protocol. It is responsible for:

- Establishing and maintaining SSE connections
- Framing and parsing MCP messages over SSE
- Handling connection lifecycle and reconnection
- Message queuing and delivery guarantees
- Request/response correlation
- Heartbeat and connection health monitoring

This component bridges the gap between HTTP SSE and the MCP protocol's bidirectional requirements.

## Interface Definition

### Public API

```typescript
// Transport Creation
export function createSSETransport(options: SSETransportOptions): SSETransport

// Transport Interface
export interface SSETransport {
  // Connection Management
  connect(): Promise<Result<void, NetworkError>>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Message Handling
  send(message: JsonRpcRequest): Promise<Result<JsonRpcResponse, TransportError>>
  onNotification(handler: (notification: JsonRpcNotification) => void): void
  
  // Events
  on(event: 'connected' | 'disconnected' | 'error', handler: Function): void
  off(event: string, handler: Function): void
}

// Server-side SSE Handler
export function createSSEHandler(
  mcpServer: MCPServer
): (req: Request, res: Response) => void
```

### Type Definitions

```typescript
// Transport Configuration
interface SSETransportOptions {
  url: string
  reconnect?: boolean           // Auto-reconnect (default: true)
  reconnectDelay?: number       // Initial delay in ms (default: 1000)
  reconnectMaxDelay?: number    // Max delay in ms (default: 30000)
  reconnectBackoff?: number     // Backoff multiplier (default: 1.5)
  heartbeatInterval?: number    // Heartbeat interval in ms (default: 30000)
  requestTimeout?: number       // Request timeout in ms (default: 30000)
  maxQueueSize?: number         // Max queued messages (default: 1000)
}

// Transport Errors
interface TransportError {
  type: 'TransportError'
  code: 'CONNECTION_FAILED' | 'TIMEOUT' | 'DISCONNECTED' | 
        'INVALID_MESSAGE' | 'QUEUE_FULL'
  message: string
  retryable: boolean
}

// SSE Message Types
interface SSEMessage {
  event?: string
  data: string
  id?: string
}

// Internal Message Format
interface FramedMessage {
  type: 'request' | 'response' | 'notification'
  payload: JsonRpcRequest | JsonRpcResponse | JsonRpcNotification
  timestamp: number
}

// Connection State
interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  lastConnected?: number
  lastError?: TransportError
  reconnectAttempts: number
  messagesSent: number
  messagesReceived: number
}
```

## Dependencies

### External Dependencies
- `eventsource` (^2.0.0) - SSE client implementation (for Node.js)
- `neverthrow` (^6.0.0) - Error handling
- Native EventSource API (for browsers)

### Internal Dependencies
- `mcp-server.ts` - MCP protocol handling
- `result.ts` - Error types

## Behavior Specification

### Client-Side Connection Flow

```typescript
async function connect(): Promise<Result<void, NetworkError>> {
  // 1. Check current state
  if (this.state.status === 'connected') {
    return ok(undefined)
  }
  
  if (this.state.status === 'connecting') {
    return this.waitForConnection()
  }
  
  // 2. Update state
  this.state.status = 'connecting'
  
  try {
    // 3. Create EventSource
    this.eventSource = new EventSource(this.options.url, {
      withCredentials: true,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    })
    
    // 4. Set up event handlers
    this.eventSource.onopen = () => {
      this.state.status = 'connected'
      this.state.lastConnected = Date.now()
      this.state.reconnectAttempts = 0
      this.startHeartbeat()
      this.emit('connected')
      this.flushMessageQueue()
    }
    
    this.eventSource.onmessage = (event) => {
      this.handleMessage(event)
    }
    
    this.eventSource.onerror = (error) => {
      this.handleError(error)
    }
    
    // 5. Wait for connection
    return this.waitForConnection()
    
  } catch (error) {
    this.state.status = 'disconnected'
    return err({
      type: 'NetworkError',
      message: 'Failed to create SSE connection',
      cause: error
    })
  }
}
```

### Server-Side SSE Handler

```typescript
function createSSEHandler(mcpServer: MCPServer) {
  return async (req: Request, res: Response) => {
    // 1. Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'  // Disable Nginx buffering
    })
    
    // 2. Send initial connection event
    res.write('event: connected\n')
    res.write(`data: ${JSON.stringify({ 
      type: 'connection',
      timestamp: Date.now() 
    })}\n\n`)
    
    // 3. Set up heartbeat
    const heartbeat = setInterval(() => {
      res.write('event: heartbeat\n')
      res.write(`data: ${JSON.stringify({ 
        timestamp: Date.now() 
      })}\n\n`)
    }, 30000)
    
    // 4. Handle incoming messages (via POST to companion endpoint)
    const messageHandler = async (message: JsonRpcRequest) => {
      const response = await mcpServer.handleRequest(message)
      
      res.write('event: message\n')
      res.write(`data: ${JSON.stringify(response)}\n`)
      res.write(`id: ${message.id}\n\n`)
    }
    
    // 5. Clean up on disconnect
    req.on('close', () => {
      clearInterval(heartbeat)
      // Remove message handler
    })
  }
}
```

### Message Framing

```typescript
// Client → Server (via POST /rpc)
async function send(message: JsonRpcRequest): Promise<Result<JsonRpcResponse, TransportError>> {
  // 1. Check connection
  if (this.state.status !== 'connected') {
    if (this.options.reconnect) {
      this.queueMessage(message)
      return err(transportError('DISCONNECTED', 'Not connected', true))
    }
    return err(transportError('DISCONNECTED', 'Not connected', false))
  }
  
  // 2. Create promise for response
  const responsePromise = new Promise<JsonRpcResponse>((resolve, reject) => {
    this.pendingRequests.set(message.id, {
      resolve,
      reject,
      timestamp: Date.now()
    })
  })
  
  // 3. Send via POST
  const sendResult = await fetch(`${this.baseUrl}/rpc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': this.authHeader
    },
    body: JSON.stringify(message)
  })
  
  if (!sendResult.ok) {
    this.pendingRequests.delete(message.id)
    return err(transportError('CONNECTION_FAILED', 'Send failed', true))
  }
  
  // 4. Wait for response with timeout
  const timeout = setTimeout(() => {
    this.pendingRequests.delete(message.id)
    reject(transportError('TIMEOUT', 'Request timeout', true))
  }, this.options.requestTimeout)
  
  try {
    const response = await responsePromise
    clearTimeout(timeout)
    return ok(response)
  } catch (error) {
    clearTimeout(timeout)
    return err(error as TransportError)
  }
}

// Server → Client (via SSE)
private handleMessage(event: MessageEvent) {
  try {
    // 1. Parse message
    const message = JSON.parse(event.data)
    this.state.messagesReceived++
    
    // 2. Handle by type
    if ('id' in message && this.pendingRequests.has(message.id)) {
      // Response to request
      const pending = this.pendingRequests.get(message.id)!
      this.pendingRequests.delete(message.id)
      pending.resolve(message)
      
    } else if ('method' in message && !('id' in message)) {
      // Notification
      this.emit('notification', message)
      
    } else {
      console.warn('Unknown message type:', message)
    }
    
  } catch (error) {
    console.error('Failed to parse SSE message:', error)
  }
}
```

### Reconnection Logic

```typescript
private async handleReconnection() {
  if (!this.options.reconnect || this.state.status === 'connected') {
    return
  }
  
  this.state.status = 'reconnecting'
  
  // Calculate delay with exponential backoff
  const delay = Math.min(
    this.options.reconnectDelay * Math.pow(
      this.options.reconnectBackoff,
      this.state.reconnectAttempts
    ),
    this.options.reconnectMaxDelay
  )
  
  this.state.reconnectAttempts++
  
  // Wait before reconnecting
  await sleep(delay)
  
  // Attempt reconnection
  const result = await this.connect()
  
  if (result.isErr()) {
    // Schedule next attempt
    this.handleReconnection()
  }
}
```

### Message Queue Management

```typescript
class MessageQueue {
  private queue: QueuedMessage[] = []
  private maxSize: number
  
  enqueue(message: JsonRpcRequest, priority: 'normal' | 'high' = 'normal') {
    if (this.queue.length >= this.maxSize) {
      // Drop oldest normal priority message
      const dropIndex = this.queue.findIndex(m => m.priority === 'normal')
      if (dropIndex >= 0) {
        this.queue.splice(dropIndex, 1)
      } else {
        throw new Error('Queue full')
      }
    }
    
    this.queue.push({
      message,
      priority,
      timestamp: Date.now(),
      attempts: 0
    })
    
    // Sort by priority and timestamp
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1
      }
      return a.timestamp - b.timestamp
    })
  }
  
  async flush(sender: (msg: JsonRpcRequest) => Promise<Result<any, any>>) {
    while (this.queue.length > 0) {
      const queued = this.queue[0]
      
      const result = await sender(queued.message)
      
      if (result.isOk()) {
        this.queue.shift()
      } else if (queued.attempts >= 3) {
        // Drop after 3 attempts
        this.queue.shift()
      } else {
        queued.attempts++
        break  // Try again later
      }
    }
  }
}
```

## Error Handling

### Connection Errors

1. **Initial Connection Failure**
   - Retry with exponential backoff
   - Emit error event
   - Queue messages if enabled

2. **Connection Lost**
   - Automatic reconnection
   - Preserve pending requests
   - Flush queue on reconnect

3. **Invalid Server Response**
   - Log error
   - Continue processing
   - Don't break connection

### Message Errors

1. **Parse Error**
   - Log and discard message
   - Continue processing
   - Track error metrics

2. **Timeout**
   - Return timeout error
   - Remove from pending
   - Allow retry by caller

3. **Queue Full**
   - Drop oldest messages
   - Prioritize high priority
   - Return error to caller

## Testing Requirements

### Unit Tests

```typescript
describe('SSE Transport', () => {
  describe('Connection', () => {
    it('should establish SSE connection')
    it('should handle connection failure')
    it('should reconnect on disconnect')
    it('should respect max reconnect attempts')
    it('should use exponential backoff')
  })
  
  describe('Message Handling', () => {
    it('should send requests via POST')
    it('should receive responses via SSE')
    it('should correlate requests and responses')
    it('should handle notifications')
    it('should timeout pending requests')
  })
  
  describe('Queue Management', () => {
    it('should queue messages when disconnected')
    it('should flush queue on reconnect')
    it('should respect queue size limit')
    it('should prioritize messages')
    it('should retry failed messages')
  })
  
  describe('Heartbeat', () => {
    it('should send periodic heartbeats')
    it('should detect stale connections')
    it('should reconnect on heartbeat timeout')
  })
})
```

### Integration Tests

```typescript
describe('SSE Transport Integration', () => {
  it('should handle full request/response cycle')
  it('should recover from network interruption')
  it('should handle server restart')
  it('should manage concurrent requests')
  it('should handle large messages')
})
```

## Performance Constraints

### Latency Requirements
- Connection establishment: < 1s
- Message round trip: < 100ms (local)
- Heartbeat interval: 30s
- Reconnect delay: 1s-30s

### Resource Limits
- Max connections: 10,000
- Max queue size: 1,000 messages
- Max message size: 1MB
- Memory per connection: < 100KB

### Scalability
- Connection pooling
- Message compression
- Binary protocol support (future)
- WebSocket upgrade path

## Security Considerations

### Authentication
- Bearer token in headers
- Token validation per request
- Secure connection only (HTTPS)
- Session management

### Message Security
- Input validation
- Output sanitization
- No sensitive data in URLs
- Audit logging

### Connection Security
- CORS headers
- Rate limiting
- Connection timeout
- IP filtering (optional)

### DoS Protection
- Connection limits per IP
- Message rate limiting
- Queue size limits
- CPU usage monitoring