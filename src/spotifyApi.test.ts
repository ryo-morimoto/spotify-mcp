import { describe, expect, it, vi } from 'vitest';
import {
  searchTracks,
  getCurrentPlayback,
  controlPlayback,
  type SpotifyTrack,
  type PlayerState,
} from './spotifyApi.ts';

describe('spotifyApi', () => {
  const mockAccessToken = 'mock-access-token';

  describe('searchTracks', () => {
    it('should return tracks on success', async () => {
      const mockTracks: SpotifyTrack[] = [
        {
          id: '1',
          name: 'Test Track',
          artists: [{ name: 'Test Artist' }],
          album: { name: 'Test Album' },
          uri: 'spotify:track:1',
        },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracks: {
            items: mockTracks,
          },
        }),
      });

      const result = await searchTracks('test query', mockAccessToken);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockTracks);
      }

      expect(fetch).toHaveBeenCalledWith(
        'https://api.spotify.com/v1/search?q=test%20query&type=track&limit=10',
        {
          headers: {
            Authorization: `Bearer ${mockAccessToken}`,
          },
        },
      );
    });

    it('should handle auth errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      const result = await searchTracks('test query', mockAccessToken);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toContain('Authentication failed');
      }
    });

    it('should handle rate limits', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 'Retry-After': '60' }),
      });

      const result = await searchTracks('test query', mockAccessToken);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('SpotifyError');
        expect(result.error.message).toContain('Rate limit exceeded');
      }
    });

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network failure'));

      const result = await searchTracks('test query', mockAccessToken);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toContain('Network request failed');
      }
    });
  });

  describe('getCurrentPlayback', () => {
    it('should return player state', async () => {
      const mockPlayerState: PlayerState = {
        is_playing: true,
        item: {
          id: '1',
          name: 'Current Track',
          artists: [{ name: 'Current Artist' }],
          album: { name: 'Current Album' },
          uri: 'spotify:track:1',
        },
        device: {
          id: 'device1',
          name: 'My Device',
          type: 'Computer',
          volume_percent: 50,
        },
        progress_ms: 30000,
        duration_ms: 180000,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockPlayerState,
      });

      const result = await getCurrentPlayback(mockAccessToken);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockPlayerState);
      }

      expect(fetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('should handle no active device', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
      });

      const result = await getCurrentPlayback(mockAccessToken);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe('controlPlayback', () => {
    it('should execute play command', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await controlPlayback('play', mockAccessToken);

      expect(result.isOk()).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/player/play', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('should execute pause command', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await controlPlayback('pause', mockAccessToken);

      expect(result.isOk()).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('should execute next command', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await controlPlayback('next', mockAccessToken);

      expect(result.isOk()).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/player/next', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('should execute previous command', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await controlPlayback('previous', mockAccessToken);

      expect(result.isOk()).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://api.spotify.com/v1/me/player/previous', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockAccessToken}`,
        },
      });
    });

    it('should handle no active device error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: 'No active device' } }),
      });

      const result = await controlPlayback('play', mockAccessToken);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('SpotifyError');
        expect(result.error.message).toContain('No active device');
      }
    });
  });
});
