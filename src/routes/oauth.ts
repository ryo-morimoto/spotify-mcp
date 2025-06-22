import { Hono } from 'hono';
import { 
  generateCodeChallenge, 
  generateAuthUrl, 
  buildScopeString,
  parseScopeString,
  hasRequiredScopes,
  handleOAuthCallback,
} from '../auth/index.ts';

// Import centralized type augmentations
import '../types/hono.d.ts';

export const oauthRoutes = new Hono();

oauthRoutes.get('/auth', async (c): Promise<Response> => {
  try {
    const pkceResult = await generateCodeChallenge();
    if (pkceResult.isErr()) {
      return c.json({ error: 'Failed to generate PKCE challenge' }, 500);
    }

    const pkce = pkceResult.value;
    const storage = c.get('codeChallengeStorage');

    // Generate a random state parameter
    const state = crypto.randomUUID();

    // Store PKCE challenge with state
    const storeResult = await storage.store(state, {
      codeChallenge: pkce.codeChallenge,
      codeVerifier: pkce.codeVerifier,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    if (storeResult.isErr()) {
      return c.json({ error: 'Failed to store PKCE challenge' }, 500);
    }

    // Use buildScopeString to get required scopes
    const scopeString = buildScopeString(false); // Only required scopes for now
    const scopes = parseScopeString(scopeString);

    const config = c.get('config');
    const authUrlResult = generateAuthUrl(
      config.spotifyClientId,
      config.redirectUri,
      pkce,
      scopes,
      state,
    );
    if (authUrlResult.isErr()) {
      return c.json({ error: 'Failed to generate auth URL' }, 500);
    }

    return c.redirect(authUrlResult.value);
  } catch (error) {
    console.error('Authentication error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

oauthRoutes.get('/callback', async (c): Promise<Response> => {
  const code = c.req.query('code');
  const error = c.req.query('error');
  const state = c.req.query('state');

  if (error || !code) {
    return c.json({ error: error || 'No authorization code received' }, 400);
  }

  if (!state) {
    return c.json({ error: 'No state parameter received' }, 400);
  }

  try {
    const storage = c.get('codeChallengeStorage');
    const pkceResult = await storage.get(state);

    if (pkceResult.isErr()) {
      return c.json({ error: 'Failed to retrieve PKCE challenge' }, 500);
    }

    const pkce = pkceResult.value;
    if (!pkce) {
      return c.json({ error: 'PKCE challenge not found or expired' }, 400);
    }

    const config = c.get('config');
    // Use handleOAuthCallback with state validation
    const tokenResult = await handleOAuthCallback(
      code,
      state,
      config.spotifyClientId,
      config.spotifyClientSecret,
      config.redirectUri,
      pkce.codeVerifier,
      state, // Expected state for validation
    );

    if (tokenResult.isErr()) {
      return c.json({ error: tokenResult.error.message }, 400);
    }

    const tokens = tokenResult.value;
    
    // Validate that we have all required scopes
    const grantedScopes = parseScopeString(tokens.scope || '');
    if (!hasRequiredScopes(grantedScopes)) {
      return c.json({ 
        error: 'Authorization did not grant all required scopes',
        missing_scopes: grantedScopes,
      }, 400);
    }
    
    const tokenStorage = c.get('tokenStorage');
    const userId = c.get('userId');

    // Store tokens for the user (already in StoredToken format)
    const storeResult = await tokenStorage.store(userId, tokens);

    if (storeResult.isErr()) {
      return c.json({ error: 'Failed to store tokens' }, 500);
    }

    // Clear PKCE challenge after successful exchange
    await storage.clear(state);

    return c.html(`
      <html>
        <body>
          <h1>Authentication Successful!</h1>
          <p>You can now close this window and use the Spotify MCP server.</p>
          <script>window.close();</script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Token exchange error:', error);
    return c.json({ error: 'Failed to exchange code for token' }, 500);
  }
});
