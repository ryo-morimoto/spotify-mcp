import { Context, Next } from 'hono';

export async function timingMiddleware(c: Context, next: Next): Promise<void> {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  c.header('X-Response-Time', `${duration}ms`);
}
