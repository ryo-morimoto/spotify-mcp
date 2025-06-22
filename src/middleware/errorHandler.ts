import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

export function errorHandler(err: Error, c: Context): Response {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message,
        status: err.status,
      },
      err.status,
    );
  }

  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500,
  );
}
