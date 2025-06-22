import { Context, Next } from 'hono';

// Import centralized type augmentations
import '../types/hono.d.ts';

import type { AppConfig } from '../types/config.ts';

interface ExtendedAppConfig extends AppConfig {
  redirectUri: string;
  environment: 'development' | 'production';
  logFormat: 'json' | 'text';
}

export function createConfig(): ExtendedAppConfig {
  const port = parseInt(process.env['PORT'] || '8000', 10);

  return {
    spotifyClientId: process.env['SPOTIFY_CLIENT_ID'] || '',
    spotifyClientSecret: process.env['SPOTIFY_CLIENT_SECRET'],
    port,
    redirectUri: `http://127.0.0.1:${port}/callback`,
    environment: process.env['NODE_ENV'] === 'production' ? 'production' : 'development',
    logFormat: process.env['LOG_FORMAT'] === 'json' ? 'json' : 'text',
  };
}

export async function configMiddleware(c: Context, next: Next): Promise<void> {
  const config = createConfig();
  c.set('config', config);
  await next();
}
