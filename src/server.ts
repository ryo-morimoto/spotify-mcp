import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import { oauthRoutes, healthRoutes, mcpRoutes } from './routes/index.ts';
import {
  authMiddleware,
  codeChallengeMiddleware,
  errorHandler,
  timingMiddleware,
  createLogger,
  configMiddleware,
  createConfig,
} from './middleware/index.ts';

// Import centralized type augmentations
import './types/hono.d.ts';

dotenv.config();

const app = new Hono();

// Error handling
app.onError(errorHandler);

// Global middleware
app.use('*', configMiddleware);
app.use('*', timingMiddleware);
app.use('*', createLogger());

// CORS configuration
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Accept'],
    credentials: true,
  }),
);

// Authentication middleware
app.use('*', authMiddleware);

// Code challenge middleware for OAuth routes
app.use('/auth', codeChallengeMiddleware);
app.use('/callback', codeChallengeMiddleware);

// Mount routes
app.route('/', oauthRoutes);
app.route('/', healthRoutes);
app.route('/', mcpRoutes);

// Root endpoint
app.get('/', (c): Response => {
  return c.json({
    name: 'spotify-mcp-server',
    version: '0.2.0',
    description: 'MCP server for controlling Spotify',
  });
});

// Export for both environments
export default app;

// Node.js startup
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = createConfig();
  console.log(`Starting Hono server on http://127.0.0.1:${config.port}`);

  serve({
    fetch: app.fetch,
    port: config.port,
    hostname: '127.0.0.1',
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });
}
