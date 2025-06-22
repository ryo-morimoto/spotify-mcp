import { Context, Next } from 'hono';
import { getCodeChallengeStorage } from '../storage/index.ts';

// Import centralized type augmentations
import '../types/hono.d.ts';

export async function codeChallengeMiddleware(c: Context, next: Next): Promise<void> {
  const codeChallengeStorage = getCodeChallengeStorage();
  c.set('codeChallengeStorage', codeChallengeStorage);
  await next();
}
