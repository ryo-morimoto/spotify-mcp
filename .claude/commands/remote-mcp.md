# Remote MCP

Connect to and manage remote MCP servers using HTTP-based transports with SSE support.

## Usage

```
/remote-mcp connect <server-url>
/remote-mcp test <server-url>
/remote-mcp --list
```

## What it does

1. **Discovers server capabilities**
   - Checks transport type
   - Validates endpoints
   - Tests connectivity
   - Verifies protocols

2. **Establishes connection**
   - Sends initialization request
   - Negotiates capabilities
   - Sets up SSE streams
   - Handles session management

3. **Manages communication**
   - Sends tool requests
   - Receives responses
   - Handles notifications
   - Maintains connection

4. **Handles errors**
   - Reconnects automatically
   - Retries failed requests
   - Reports connection issues
   - Manages timeouts

## Example

```
/remote-mcp connect https://api.example.com/mcp

Discovering server capabilities...
✅ Server supports Streamable HTTP transport
✅ SSE endpoint available
✅ Session management enabled

Initializing connection...
Session ID: abc123-def456-ghi789
Available tools:
- search_tracks
- player_control
- get_playback_state

Connection established!
```

## Transport Types

### Streamable HTTP
- **Modern standard**: Unified endpoint
- **SSE support**: Real-time updates
- **Session management**: Stateful connections
- **Backwards compatible**: Works with older clients

### HTTP+SSE (Legacy)
- **Deprecated**: From protocol 2024-11-05
- **Separate endpoints**: POST and SSE
- **Limited features**: No session support
- **Still supported**: For compatibility

### STDIO
- **Local only**: Subprocess communication
- **No HTTP**: Direct process I/O
- **Fast**: No network overhead
- **Simple**: Basic transport

## Process

1. **Check server metadata**
   ```bash
   GET https://api.example.com/.well-known/oauth-authorization-server
   ```

2. **Test MCP endpoint**
   ```bash
   POST https://api.example.com/mcp
   Accept: application/json, text/event-stream
   ```

3. **Initialize connection**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "initialize",
     "params": {
       "protocolVersion": "2025-03-26",
       "capabilities": {}
     },
     "id": 1
   }
   ```

4. **Handle response**
   - Extract session ID
   - Store capabilities
   - Set up SSE if needed
   - Ready for requests

5. **Send tool requests**
   ```json
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "params": {
       "name": "search_tracks",
       "arguments": {"query": "Beatles"}
     },
     "id": 2
   }
   ```

6. **Process SSE stream**
   ```
   data: {"jsonrpc":"2.0","result":{...},"id":2}
   
   data: {"jsonrpc":"2.0","method":"notification",...}
   ```

## Connection Options

### Headers
```http
Accept: application/json, text/event-stream
Content-Type: application/json
MCP-Protocol-Version: 2025-03-26
Mcp-Session-Id: <session-id>
```

### Timeouts
- **Connection**: 30 seconds
- **Request**: 2 minutes default
- **SSE stream**: Indefinite
- **Idle**: Server-dependent

### Retries
- **Connection failures**: 3 attempts
- **Request failures**: Exponential backoff
- **SSE reconnect**: Automatic with Last-Event-ID
- **Session expired**: Re-initialize

## Common Issues

### Connection Refused
```
❌ Failed to connect to server
- Check server URL
- Verify server is running
- Check network access
- Try with curl first
```

### Method Not Allowed
```
❌ HTTP 405 Method Not Allowed
- Server might be legacy HTTP+SSE
- Try GET request first
- Check for endpoint event
```

### Unauthorized
```
❌ HTTP 401 Unauthorized
- Server requires authentication
- See /remote-mcp-auth
- Check OAuth configuration
```

### Session Expired
```
❌ HTTP 404 Not Found with session ID
- Session timed out
- Re-initialize connection
- Store new session ID
```

## Best Practices

### Connection Management
- **Test first**: Verify before full setup
- **Store sessions**: Reuse when possible
- **Handle reconnects**: Gracefully recover
- **Clean shutdown**: Close SSE streams

### Error Handling
- **Expect failures**: Network is unreliable
- **Retry smartly**: Exponential backoff
- **Report clearly**: User-friendly messages
- **Fallback options**: Legacy transport support

### Performance
- **Reuse connections**: Don't reconnect often
- **Batch requests**: When possible
- **Stream responses**: Use SSE effectively
- **Monitor health**: Track connection state

### Security
- **Validate origins**: Check server identity
- **Use HTTPS**: Always for remote
- **Handle tokens**: If auth required
- **Limit scope**: Request minimal access

## Configuration

### Environment Variables
```bash
MCP_PROTOCOL_VERSION=2025-03-26
MCP_TIMEOUT=120000
MCP_RETRY_ATTEMPTS=3
```

### Debug Mode
```bash
DEBUG=mcp:* node client.js  # Verbose logging
```

### Custom Headers
```javascript
{
  headers: {
    'User-Agent': 'MCP-Client/1.0',
    'X-Custom-Header': 'value'
  }
}
```

## Transport Detection

### Auto-detection Flow
1. Try Streamable HTTP first
2. Check for 405 error
3. Fall back to legacy HTTP+SSE
4. Extract endpoint from SSE
5. Continue with legacy flow

### Manual Override
```
/remote-mcp connect https://api.example.com/mcp --transport=streamable
/remote-mcp connect https://api.example.com/mcp --transport=legacy
```

## Session Management

### With Sessions
- Server provides `Mcp-Session-Id`
- Include in all requests
- Handle session expiry
- Support session deletion

### Without Sessions
- Stateless operation
- No session header
- Each request independent
- Simpler but limited

## Notes

- Prefer Streamable HTTP transport
- Support legacy for compatibility
- Handle all error cases gracefully
- Test thoroughly before production
- Monitor connection health actively