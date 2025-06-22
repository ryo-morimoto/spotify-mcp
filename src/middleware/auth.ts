import { Context, Next } from 'hono';
import { getTokenStorage } from '../storage/index.ts';
import { validateToken } from '../auth/index.ts';
import { parseScopeString, hasRequiredScopes } from '../auth/index.ts';
import type { TokenStorage } from '../types/index.ts';

// Import centralized type augmentations
import '../types/hono.d.ts';

export async function authMiddleware(c: Context, next: Next): Promise<void> {
  const tokenStorage = getTokenStorage();

  // For now, we use a default user ID
  // In production, this should be derived from session/cookie/JWT
  const userId = 'default-user';

  // Check if user has valid tokens
  const tokenResult = await tokenStorage.get(userId);
  let authenticated = false;
  
  if (tokenResult.isOk() && tokenResult.value) {
    // Validate token is not expired
    const validationResult = validateToken(tokenResult.value);
    authenticated = validationResult.isOk();
    
    if (authenticated) {
      // Set tokens in context for use by routes
      c.set('tokens', tokenResult.value);
    }
  }

  // Set context variables
  c.set('userId', userId);
  c.set('authenticated', authenticated);
  c.set('tokenStorage', tokenStorage);

  await next();
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const authenticated = c.get('authenticated');
  const tokens = c.get('tokens');

  if (!authenticated || !tokens) {
    return c.json({ error: 'Not authenticated. Please visit /auth first.' }, 401);
  }

  return await next();
}

/**
 * Optional authentication middleware that doesn't fail if no auth present
 */
export async function optionalAuth(c: Context, next: Next): Promise<void> {
  // Auth is already attempted in authMiddleware, just proceed
  await next();
}

/**
 * Middleware to check if specific OAuth scopes are available
 */
export function requireScopes(...requiredScopes: string[]) {
  return async (c: Context, next: Next): Promise<Response | void> => {
    const tokens = c.get('tokens');
    if (!tokens) {
      return c.json({ error: 'Unauthorized: No authentication tokens' }, 401);
    }

    const grantedScopes = parseScopeString(tokens.scope || '');
    const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));

    if (missingScopes.length > 0) {
      return c.json({ 
        error: 'Insufficient permissions',
        required_scopes: requiredScopes,
        missing_scopes: missingScopes,
        granted_scopes: grantedScopes,
      }, 403);
    }

    await next();
  };
}
