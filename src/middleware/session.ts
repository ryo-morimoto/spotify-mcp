import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

// Import centralized type augmentations
import '../types/hono.d.ts';

export async function sessionMiddleware(c: Context, next: Next): Promise<void> {
  let sessionId = getCookie(c, 'session_id');

  if (!sessionId) {
    // Generate new session ID
    sessionId = crypto.randomUUID();
    setCookie(c, 'session_id', sessionId, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  c.set('sessionId', sessionId);

  // In production, you would use sessionId to look up userId from a session store
  // For now, we'll continue using 'default-user' but this provides the foundation
  // for proper multi-user support

  await next();
}
