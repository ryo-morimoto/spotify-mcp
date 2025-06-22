// PKCE utilities
export { generateCodeChallenge, generateAuthUrl } from './pkce.ts';

// Token management
export { 
  exchangeCodeForToken, 
  refreshToken, 
  refreshTokenWithRetry,
  validateToken 
} from './tokens.ts';

// Retry utilities
export { withExponentialBackoff, createTokenRefreshRetry } from './retry.ts';

// OAuth scope management
export {
  REQUIRED_SCOPES,
  OPTIONAL_SCOPES,
  type RequiredScope,
  type OptionalScope,
  type Scope,
  hasRequiredScopes,
  getMissingRequiredScopes,
  hasScope,
  buildScopeString,
  parseScopeString,
  needsReauthentication,
} from './scopes.ts';

// Spotify OAuth
export { handleOAuthCallback } from './spotify.ts';