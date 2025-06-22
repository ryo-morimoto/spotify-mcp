import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SpotifyApi, PlaybackState } from '@spotify/web-api-ts-sdk';
import { getCurrentPlayback, controlPlayback } from './player.ts';
import { createNetworkError, createAuthError, createSpotifyError } from '../../result.ts';

// Mock the errorMapper
vi.mock('./errorMapper.ts', () => ({
  mapSpotifyError: vi.fn((error) => {
    if (error.message === 'Network error') {
      return createNetworkError('Network error', undefined, error);
    } else if (error.message === 'Unauthorized') {
      return createAuthError('Unauthorized', 'unauthorized');
    } else if (error.message === 'No active device') {
      return createSpotifyError('No active device', 'no_active_device', 404);
    }
    return createNetworkError('Unknown error', undefined, error);
  }),
}));

describe('Player Functions', () => {
  let mockClient: { player: any };
  const mockPlaybackState: PlaybackState = {
    device: {
      id: 'device123',
      is_active: true,
      is_private_session: false,
      is_restricted: false,
      name: 'Test Device',
      type: 'Computer',
      volume_percent: 50,
      supports_volume: true,
    },
    repeat_state: 'off',
    shuffle_state: false,
    context: null,
    timestamp: 1234567890,
    progress_ms: 30000,
    is_playing: true,
    item: {
      id: 'track123',
      name: 'Test Track',
      artists: [{ name: 'Test Artist', id: 'artist123' }],
      album: { name: 'Test Album', id: 'album123' },
      duration_ms: 180000,
      uri: 'spotify:track:track123',
      type: 'track',
    },
    currently_playing_type: 'track',
    actions: {
      interrupting_playback: false,
      pausing: true,
      resuming: false,
      seeking: true,
      skipping_next: true,
      skipping_prev: true,
      toggling_repeat_context: true,
      toggling_shuffle: true,
      toggling_repeat_track: true,
      transferring_playback: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      player: {
        getPlaybackState: vi.fn(),
        startResumePlayback: vi.fn(),
        pausePlayback: vi.fn(),
        skipToNext: vi.fn(),
        skipToPrevious: vi.fn(),
      },
    };
  });

  describe('getCurrentPlayback', () => {
    it('should get current playback state successfully', async () => {
      mockClient.player.getPlaybackState.mockResolvedValue(mockPlaybackState);

      const result = await getCurrentPlayback(mockClient as unknown as SpotifyApi);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockPlaybackState);
      }
      expect(mockClient.player.getPlaybackState).toHaveBeenCalled();
    });

    it('should return null for 204 No Content (no active device)', async () => {
      const error = new Error('No content');
      (error as any).status = 204;
      mockClient.player.getPlaybackState.mockRejectedValue(error);

      const result = await getCurrentPlayback(mockClient as unknown as SpotifyApi);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it('should handle network errors', async () => {
      mockClient.player.getPlaybackState.mockRejectedValue(new Error('Network error'));

      const result = await getCurrentPlayback(mockClient as unknown as SpotifyApi);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Network error');
      }
    });

    it('should handle auth errors', async () => {
      mockClient.player.getPlaybackState.mockRejectedValue(new Error('Unauthorized'));

      const result = await getCurrentPlayback(mockClient as unknown as SpotifyApi);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toBe('Unauthorized');
      }
    });

    it('should handle Spotify API errors', async () => {
      mockClient.player.getPlaybackState.mockRejectedValue(new Error('No active device'));

      const result = await getCurrentPlayback(mockClient as unknown as SpotifyApi);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('SpotifyError');
        expect(result.error.message).toBe('No active device');
      }
    });
  });

  describe('controlPlayback', () => {
    describe('play command', () => {
      it('should start playback successfully', async () => {
        mockClient.player.startResumePlayback.mockResolvedValue(undefined);

        const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'play');

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith('');
      });

      it('should start playback on specific device', async () => {
        mockClient.player.startResumePlayback.mockResolvedValue(undefined);

        const result = await controlPlayback(
          mockClient as unknown as SpotifyApi,
          'play',
          'device123',
        );

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith('device123');
      });

      it('should handle play errors', async () => {
        mockClient.player.startResumePlayback.mockRejectedValue(new Error('No active device'));

        const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'play');

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.type).toBe('SpotifyError');
        }
      });
    });

    describe('pause command', () => {
      it('should pause playback successfully', async () => {
        mockClient.player.pausePlayback.mockResolvedValue(undefined);

        const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'pause');

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.pausePlayback).toHaveBeenCalledWith('');
      });

      it('should pause playback on specific device', async () => {
        mockClient.player.pausePlayback.mockResolvedValue(undefined);

        const result = await controlPlayback(
          mockClient as unknown as SpotifyApi,
          'pause',
          'device123',
        );

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.pausePlayback).toHaveBeenCalledWith('device123');
      });
    });

    describe('next command', () => {
      it('should skip to next track successfully', async () => {
        mockClient.player.skipToNext.mockResolvedValue(undefined);

        const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'next');

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.skipToNext).toHaveBeenCalledWith('');
      });

      it('should skip to next on specific device', async () => {
        mockClient.player.skipToNext.mockResolvedValue(undefined);

        const result = await controlPlayback(
          mockClient as unknown as SpotifyApi,
          'next',
          'device123',
        );

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.skipToNext).toHaveBeenCalledWith('device123');
      });
    });

    describe('previous command', () => {
      it('should skip to previous track successfully', async () => {
        mockClient.player.skipToPrevious.mockResolvedValue(undefined);

        const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'previous');

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.skipToPrevious).toHaveBeenCalledWith('');
      });

      it('should skip to previous on specific device', async () => {
        mockClient.player.skipToPrevious.mockResolvedValue(undefined);

        const result = await controlPlayback(
          mockClient as unknown as SpotifyApi,
          'previous',
          'device123',
        );

        expect(result.isOk()).toBe(true);
        expect(mockClient.player.skipToPrevious).toHaveBeenCalledWith('device123');
      });
    });

    it('should handle network errors during control', async () => {
      mockClient.player.startResumePlayback.mockRejectedValue(new Error('Network error'));

      const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'play');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('NetworkError');
        expect(result.error.message).toBe('Network error');
      }
    });

    it('should handle auth errors during control', async () => {
      mockClient.player.pausePlayback.mockRejectedValue(new Error('Unauthorized'));

      const result = await controlPlayback(mockClient as unknown as SpotifyApi, 'pause');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('AuthError');
        expect(result.error.message).toBe('Unauthorized');
      }
    });
  });
});
