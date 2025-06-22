import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthRoutes } from './health.ts';

describe('Health Routes', () => {
  let app: typeof healthRoutes;

  beforeEach(() => {
    vi.clearAllMocks();
    app = healthRoutes;
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await app.request('/health');
      const json = (await response.json()) as any;

      expect(response.status).toBe(200);
      expect(json).toMatchObject({
        status: 'ok',
        service: 'spotify-mcp-server',
        version: '0.2.0',
      });
      expect(json.timestamp).toBeDefined();
      expect(new Date(json.timestamp).getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
    });

    it('should return valid ISO timestamp', async () => {
      const response = await app.request('/health');
      const json = (await response.json()) as any;

      // Check if timestamp is valid ISO string
      const timestamp = new Date(json.timestamp);
      expect(timestamp.toISOString()).toBe(json.timestamp);
    });

    it('should have correct content type', async () => {
      const response = await app.request('/health');

      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() => app.request('/health'));
      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      const jsons = await Promise.all(responses.map((r) => r.json()));
      jsons.forEach((json) => {
        expect((json as any).status).toBe('ok');
      });
    });
  });
});
