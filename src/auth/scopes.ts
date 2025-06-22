/**
 * OAuth scope validation and management utilities
 */

// Required scopes for basic functionality
export const REQUIRED_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state', 
  'user-read-currently-playing',
] as const;

// Optional scopes for extended features
export const OPTIONAL_SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'user-read-recently-played',
  'user-top-read',
] as const;

export type RequiredScope = typeof REQUIRED_SCOPES[number];
export type OptionalScope = typeof OPTIONAL_SCOPES[number];
export type Scope = RequiredScope | OptionalScope;

/**
 * Check if the granted scopes include all required scopes
 */
export function hasRequiredScopes(grantedScopes: string[]): boolean {
  return REQUIRED_SCOPES.every(scope => grantedScopes.includes(scope));
}

/**
 * Get missing required scopes
 */
export function getMissingRequiredScopes(grantedScopes: string[]): RequiredScope[] {
  return REQUIRED_SCOPES.filter(scope => !grantedScopes.includes(scope));
}

/**
 * Check if a specific scope is granted
 */
export function hasScope(grantedScopes: string[], scope: Scope): boolean {
  return grantedScopes.includes(scope);
}

/**
 * Build scope string for authorization request
 */
export function buildScopeString(
  includeOptional: boolean = false,
  additionalScopes: string[] = [],
): string {
  const scopes: string[] = [...REQUIRED_SCOPES];
  
  if (includeOptional) {
    scopes.push(...OPTIONAL_SCOPES);
  }
  
  if (additionalScopes.length > 0) {
    scopes.push(...additionalScopes);
  }
  
  // Remove duplicates
  return [...new Set(scopes)].join(' ');
}

/**
 * Parse scope string from token response
 */
export function parseScopeString(scopeString: string): string[] {
  return scopeString.split(' ').filter(s => s.length > 0);
}

/**
 * Check if user needs to re-authenticate for additional scopes
 */
export function needsReauthentication(
  currentScopes: string[],
  requiredScopes: string[],
): boolean {
  return requiredScopes.some(scope => !currentScopes.includes(scope));
}