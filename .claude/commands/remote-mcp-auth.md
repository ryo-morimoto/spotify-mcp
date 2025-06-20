# Remote MCP Auth

Handle OAuth 2.1 authentication for secure remote MCP server connections.

## Usage

```
/remote-mcp-auth setup <server-url>
/remote-mcp-auth refresh <server-url>
/remote-mcp-auth status
```

## What it does

1. **Discovers auth endpoints**
   - Checks server metadata
   - Finds OAuth endpoints
   - Validates configuration
   - Falls back to defaults

2. **Registers client dynamically**
   - Creates OAuth client
   - Obtains client ID
   - Stores credentials
   - No manual setup

3. **Executes OAuth flow**
   - Generates PKCE challenge
   - Opens browser for auth
   - Handles callback
   - Exchanges for tokens

4. **Manages tokens**
   - Stores securely
   - Refreshes automatically
   - Handles expiration
   - Revokes when done

## Example

```
/remote-mcp-auth setup https://api.example.com/mcp

Discovering OAuth configuration...
✅ Found authorization server metadata
✅ Dynamic registration supported

Registering OAuth client...
Client ID: mcp-client-abc123
Redirect URI: http://localhost:8080/callback

Starting OAuth flow...
Opening browser for authorization...
✅ Authorization code received
✅ Access token obtained

Authentication successful!
Token expires in: 3600 seconds
```

## OAuth Flow Types

### Authorization Code (User Auth)
- **Human users**: Personal authentication
- **Browser flow**: User approves access
- **PKCE required**: Security enhancement
- **Refresh tokens**: Long-lived sessions

### Client Credentials (App Auth)
- **Service accounts**: No user involved
- **Direct exchange**: Client ID/secret
- **No browser**: Automated flow
- **Limited scope**: App-level access

## Process

1. **Discover OAuth metadata**
   ```bash
   GET https://api.example.com/.well-known/oauth-authorization-server
   ```

2. **Register client (if supported)**
   ```json
   POST https://api.example.com/register
   {
     "client_name": "MCP Client",
     "redirect_uris": ["http://localhost:8080/callback"],
     "grant_types": ["authorization_code"],
     "response_types": ["code"],
     "token_endpoint_auth_method": "none"
   }
   ```

3. **Generate PKCE challenge**
   ```javascript
   code_verifier = random_string(128)
   code_challenge = base64url(sha256(code_verifier))
   ```

4. **Start authorization**
   ```
   https://api.example.com/authorize?
     client_id=abc123&
     redirect_uri=http://localhost:8080/callback&
     response_type=code&
     code_challenge=xyz789&
     code_challenge_method=S256
   ```

5. **Exchange code for token**
   ```json
   POST https://api.example.com/token
   {
     "grant_type": "authorization_code",
     "code": "auth-code-123",
     "redirect_uri": "http://localhost:8080/callback",
     "client_id": "abc123",
     "code_verifier": "original-verifier"
   }
   ```

6. **Use access token**
   ```http
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

## Token Management

### Storage
- **Secure storage**: OS keychain preferred
- **Encrypted file**: Fallback option
- **Memory only**: For sensitive environments
- **Never plain text**: Always encrypted

### Refresh
```json
POST https://api.example.com/token
{
  "grant_type": "refresh_token",
  "refresh_token": "refresh-token-xyz",
  "client_id": "abc123"
}
```

### Expiration Handling
- **Check before use**: Validate expiry
- **Refresh early**: 5 minutes before
- **Retry on 401**: Token might be revoked
- **Re-authenticate**: If refresh fails

## Security Best Practices

### PKCE (Required)
- **Always use**: Even for confidential clients
- **Secure random**: 128 characters minimum
- **SHA256 hash**: For code challenge
- **One-time use**: New for each flow

### Redirect URIs
- **Localhost only**: For local clients
- **HTTPS required**: For remote URLs
- **Exact match**: No wildcards
- **Port binding**: Use dynamic ports

### Token Handling
- **Short-lived**: Prefer short expiry
- **Minimal scope**: Request only needed
- **Secure transport**: Always HTTPS
- **No logging**: Never log tokens

### Client Registration
- **Dynamic preferred**: Auto-registration
- **Unique names**: Include timestamp
- **Minimal info**: Don't over-share
- **Clean up**: Delete unused clients

## Common Issues

### Registration Failed
```
❌ Dynamic registration not supported
- Use manual client registration
- Check server documentation
- Contact server admin
- Use pre-configured client
```

### Invalid Grant
```
❌ OAuth error: invalid_grant
- Authorization code expired
- Code already used
- PKCE mismatch
- Wrong redirect URI
```

### Insufficient Scope
```
❌ HTTP 403 Forbidden
- Token lacks required scope
- Request additional permissions
- Check server requirements
- Re-authenticate with scope
```

### Token Expired
```
❌ HTTP 401 Unauthorized
- Access token expired
- Use refresh token
- If refresh fails, re-auth
- Check token lifetime
```

## Configuration

### OAuth Endpoints (Fallback)
```
Authorization: /authorize
Token: /token
Registration: /register
Revocation: /revoke
```

### Client Options
```javascript
{
  client_name: "MCP Client",
  logo_uri: "https://example.com/logo.png",
  contacts: ["admin@example.com"],
  token_endpoint_auth_method: "none"
}
```

### PKCE Settings
```javascript
{
  code_verifier_length: 128,
  code_challenge_method: "S256"
}
```

## Third-Party Auth

### Flow Overview
1. MCP client → MCP server
2. MCP server → Third-party auth
3. User authorizes third-party
4. Third-party → MCP server
5. MCP server → MCP client token

### Considerations
- **Double hop**: Two auth flows
- **Token binding**: Server manages mapping
- **Scope translation**: May differ
- **Error propagation**: Complex handling

## Manual Client Setup

### When Required
- No dynamic registration
- Pre-approved clients only
- Enterprise environments
- Custom configurations

### Steps
1. Register on server website
2. Obtain client ID/secret
3. Configure redirect URI
4. Store credentials securely
5. Use in OAuth flow

## Best Practices

### User Experience
- **Clear instructions**: Guide users
- **Browser handling**: Auto-open/detect
- **Progress feedback**: Show status
- **Error recovery**: Helpful messages

### Token Lifecycle
- **Monitor expiry**: Track remaining time
- **Refresh proactively**: Before expiry
- **Handle failures**: Graceful degradation
- **Clean shutdown**: Revoke if possible

### Development
- **Test locally**: Use localhost
- **Mock auth**: For testing
- **Log safely**: No sensitive data
- **Handle edge cases**: Network failures

### Production
- **Secure storage**: Use OS keychain
- **Audit logging**: Track auth events
- **Rate limiting**: Respect limits
- **Monitoring**: Track auth health

## Testing Auth

### Local Testing
```bash
# Start local callback server
python -m http.server 8080

# Test OAuth flow
curl -X POST https://api.example.com/token \
  -d "grant_type=authorization_code" \
  -d "code=test-code" \
  -d "client_id=test-client"
```

### Debug Mode
```bash
DEBUG=oauth:* node client.js
OAUTH_LOG_LEVEL=debug
```

## Notes

- PKCE is mandatory for all clients
- Prefer dynamic registration
- Handle all OAuth errors gracefully
- Never store tokens in plain text
- Monitor token expiration actively