import { Context, Next } from 'hono';

// Import centralized type augmentations
import '../types/hono.d.ts';

interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  status?: number;
  duration?: number;
  userId?: string;
  sessionId?: string;
  error?: string;
  userAgent?: string;
  ip?: string;
}

export function createLogger(): (c: Context, next: Next) => Promise<void> {
  return async function logger(c: Context, next: Next): Promise<void> {
    const config = c.get('config');
    const format = config?.logFormat || 'text';
    const start = Date.now();
    const path = c.req.path;

    // Log request
    const requestLog: LogEntry = {
      timestamp: new Date().toISOString(),
      method: c.req.method,
      path,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
    };

    if (format === 'json') {
      console.log(JSON.stringify({ ...requestLog, type: 'request' }));
    } else {
      console.log(`--> ${requestLog.method} ${requestLog.path}`);
    }

    try {
      await next();

      // Log response
      const duration = Date.now() - start;
      const responseLog: LogEntry = {
        ...requestLog,
        status: c.res.status,
        duration,
        userId: c.get('userId'),
        sessionId: c.get('sessionId'),
      };

      if (format === 'json') {
        console.log(JSON.stringify({ ...responseLog, type: 'response' }));
      } else {
        const statusColor = responseLog.status! >= 400 ? '\x1b[31m' : '\x1b[32m'; // red for errors, green for success
        const reset = '\x1b[0m';
        console.log(
          `<-- ${responseLog.method} ${responseLog.path} ${statusColor}${responseLog.status}${reset} ${responseLog.duration}ms`,
        );
      }
    } catch (error) {
      // Log error
      const duration = Date.now() - start;
      const errorLog: LogEntry = {
        ...requestLog,
        status: 500,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      if (format === 'json') {
        console.error(JSON.stringify({ ...errorLog, type: 'error' }));
      } else {
        console.error(
          `<-- ${errorLog.method} ${errorLog.path} \x1b[31m500\x1b[0m ${errorLog.duration}ms - ${errorLog.error}`,
        );
      }

      throw error;
    }
  };
}
