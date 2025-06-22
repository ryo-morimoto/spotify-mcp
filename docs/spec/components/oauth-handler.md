# OAuth Handler Component Specification

## Purpose & Responsibility

The OAuth Handler component implements the OAuth 2.0 authorization flow with PKCE (Proof Key for Code Exchange) for secure authentication with Spotify's API. It is responsible for:

- Generating cryptographically secure PKCE challenges
- Constructing authorization URLs with proper parameters
- Exchanging authorization codes for access tokens
- Refreshing expired tokens
- Validating token integrity and expiration

This component ensures secure authentication without requiring a client secret, making it suitable for public clients and edge deployments.

## Interface Definition

### Public API

```typescript
// PKCE Challenge Generation
export async function generatePKCEChallenge(): Promise<Result<PKCEChallenge, NetworkError>>

// Authorization URL Generation
export function generateAuthUrl(
  clientId: string,
  redirectUri: string,
  pkceChallenge: PKCEChallenge,
  scopes: string[],
  state?: string
): Result<string, NetworkError>

// Token Exchange
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string,
  clientSecret?: string
): Promise<Result<OAuthTokens, NetworkError | AuthError>>

// Token Refresh
export async function refreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret?: string
): Promise<Result<OAuthTokens, NetworkError | AuthError>>

// Token Validation
export function validateToken(token: OAuthTokens): Result<void, AuthError>
```

### Type Definitions

```typescript
interface PKCEChallenge {
  codeVerifier: string      // Random 128-character string
  codeChallenge: string     // Base64URL(SHA256(codeVerifier))
  challengeMethod: 'S256'   // Only S256 is supported
}

interface OAuthTokens {
  access_token: string      // Bearer token for API requests
  token_type: 'Bearer'      // Always 'Bearer'
  expires_in: number        // Seconds until expiration (typically 3600)
  refresh_token: string     // Token for refreshing access
  scope: string            // Space-separated granted scopes
}

interface AuthCodeExchangeParams {
  grant_type: 'authorization_code'
  code: string
  redirect_uri: string
  client_id: string
  code_verifier: string
  client_secret?: string
}

interface TokenRefreshParams {
  grant_type: 'refresh_token'
  refresh_token: string
  client_id: string
  client_secret?: string
}
```

## Dependencies

### External Dependencies
- `neverthrow` (^6.0.0) - Type-safe error handling
- Node.js crypto API - For generating random values and SHA256 hashing
- Fetch API - For HTTP requests to Spotify

### Internal Dependencies
- `result.ts` - Error type definitions (NetworkError, AuthError)

## Behavior Specification

### PKCE Challenge Generation

1. Generate 128 random bytes
2. Convert to base64url string (code verifier)
3. Hash verifier with SHA256
4. Convert hash to base64url (code challenge)
5. Return both values with method 'S256'

```typescript
// Example output
{
  codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk...", // 128 chars
  codeChallenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  challengeMethod: "S256"
}
```

### Authorization URL Construction

1. Validate all required parameters
2. Construct base URL: `https://accounts.spotify.com/authorize`
3. Add query parameters:
   - `client_id`: Application identifier
   - `response_type`: Always 'code'
   - `redirect_uri`: Callback URL (must match app settings)
   - `code_challenge`: From PKCE generation
   - `code_challenge_method`: Always 'S256'
   - `scope`: Space-separated permissions
   - `state`: Optional CSRF protection token
4. Return properly encoded URL

### Token Exchange Flow

1. Validate authorization code format
2. Construct POST request to `https://accounts.spotify.com/api/token`
3. Set Content-Type to `application/x-www-form-urlencoded`
4. Include all required parameters
5. Handle response:
   - Success: Parse and return tokens
   - 400: Invalid request (bad code, expired, etc.)
   - 401: Authentication failed
   - 429: Rate limited
   - 5xx: Server error
6. Validate received tokens before returning

### Token Refresh Flow

1. Validate refresh token format
2. Construct POST request with refresh parameters
3. Handle response same as token exchange
4. Return new access token (refresh token may be updated)

### Token Validation

1. Check token structure completeness
2. Verify token_type is 'Bearer'
3. Check expiration (considering clock skew)
4. Validate scope format
5. Return specific error for each validation failure

## Error Handling

### Error Types

```typescript
// Network-related errors
interface NetworkError {
  type: 'NetworkError'
  message: string
  statusCode?: number
  cause?: unknown
}

// Authentication errors
interface AuthError {
  type: 'AuthError'
  message: string
  reason: 'expired' | 'invalid' | 'missing' | 'insufficient_scope'
  details?: {
    error: string
    error_description: string
  }
}
```

### Error Scenarios

1. **PKCE Generation Failure**
   - Crypto API unavailable
   - Insufficient entropy
   - Recovery: Retry with fallback to Math.random (dev only)

2. **Invalid Authorization Code**
   - Code already used
   - Code expired (10 minutes)
   - Wrong redirect_uri
   - Recovery: Restart auth flow

3. **Token Refresh Failure**
   - Refresh token revoked
   - Refresh token expired
   - Recovery: Full re-authentication

4. **Network Errors**
   - Connection timeout
   - DNS failure
   - TLS errors
   - Recovery: Exponential backoff retry

5. **Rate Limiting**
   - Too many requests
   - Recovery: Honor Retry-After header

## Testing Requirements

### Unit Tests

```typescript
describe('OAuth Handler', () => {
  describe('generatePKCEChallenge', () => {
    it('should generate 128-character code verifier')
    it('should use S256 challenge method')
    it('should generate different values each time')
    it('should produce valid base64url strings')
  })

  describe('generateAuthUrl', () => {
    it('should include all required parameters')
    it('should properly encode special characters')
    it('should handle optional state parameter')
    it('should validate redirect URI format')
  })

  describe('exchangeCodeForToken', () => {
    it('should exchange valid code for tokens')
    it('should handle expired codes')
    it('should handle invalid codes')
    it('should handle network errors')
    it('should validate token response')
  })

  describe('refreshToken', () => {
    it('should refresh valid token')
    it('should handle revoked refresh tokens')
    it('should handle expired refresh tokens')
    it('should update token cache')
  })

  describe('validateToken', () => {
    it('should accept valid tokens')
    it('should reject expired tokens')
    it('should reject malformed tokens')
    it('should handle clock skew')
  })
})
```

### Integration Tests

- Full OAuth flow with real Spotify API
- Token refresh cycle over time
- Error recovery scenarios
- Concurrent token operations

### Test Fixtures

```typescript
// Valid token fixture
const validToken: OAuthTokens = {
  access_token: "BQD...",
  token_type: "Bearer",
  expires_in: 3600,
  refresh_token: "AQD...",
  scope: "user-read-playback-state user-modify-playback-state"
}

// Expired token fixture
const expiredToken: OAuthTokens = {
  ...validToken,
  expires_in: -1
}
```

## Performance Constraints

### Latency Requirements
- PKCE generation: < 10ms
- URL generation: < 1ms
- Token exchange: < 500ms (network dependent)
- Token refresh: < 300ms (network dependent)
- Token validation: < 1ms

### Resource Limits
- Memory: < 1MB per operation
- No persistent storage required
- Stateless operation (except PKCE storage)

### Scalability
- Horizontal scaling: Fully stateless
- Concurrent operations: Thread-safe
- Rate limits: Respect Spotify's limits (undocumented)

## Security Considerations

### PKCE Security
- Use cryptographically secure random generator
- Never reuse code verifiers
- Store verifiers securely until exchange
- Clear verifiers after use

### Token Security
- Never log access tokens
- Transmit only over HTTPS
- Store tokens encrypted at rest
- Implement token rotation
- Clear tokens on logout

### Authorization Security
- Validate state parameter for CSRF
- Verify redirect URI matches exactly
- Check response origin
- Implement nonce for replay protection

### Error Information Disclosure
- Don't expose internal errors to clients
- Log detailed errors server-side only
- Return generic errors to users
- Avoid timing attacks in validation