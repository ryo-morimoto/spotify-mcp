import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { searchTracks } from './search.ts';
import { createNetworkError, createAuthError, createSpotifyError } from '../../result.ts';

// Mock the errorMapper
vi.mock('./errorMapper.ts', () => ({
  mapSpotifyError: vi.fn((error) => {
    if (error.message === 'Network error') {
      return createNetworkError('Network error', undefined, error);
    } else if (error.message === 'Unauthorized') {
      return createAuthError('Unauthorized', 'unauthorized');
    } else if (error.message === 'Bad request') {
      return createSpotifyError('Bad request', 'bad_request', 400);
    }
    return createNetworkError('Unknown error', undefined, error);
  }),
}));

describe('searchTracks', () => {
  let mockClient: Partial<SpotifyApi>;
  const mockTracks = [
    {
      id: 'track1',
      name: 'Test Track 1',
      artists: [{ name: 'Artist 1' }],
      album: { name: 'Album 1' },
      uri: 'spotify:track:track1',
    },
    {
      id: 'track2',
      name: 'Test Track 2',
      artists: [{ name: 'Artist 2' }],
      album: { name: 'Album 2' },
      uri: 'spotify:track:track2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      search: vi.fn(),
    };
  });

  it('should search tracks successfully', async () => {
    mockClient.search = vi.fn().mockResolvedValue({
      tracks: {
        items: mockTracks,
        href: 'https://api.spotify.com/v1/search',
        limit: 10,
        next: null,
        offset: 0,
        previous: null,
        total: 2,
      },
    });

    const result = await searchTracks(mockClient as SpotifyApi, 'test query', 10);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockTracks);
    }
    expect(mockClient.search).toHaveBeenCalledWith('test query', ['track'], 'US', 10);
  });

  it('should use default limit when not provided', async () => {
    mockClient.search = vi.fn().mockResolvedValue({
      tracks: { items: [] },
    });

    await searchTracks(mockClient as SpotifyApi, 'test query');

    expect(mockClient.search).toHaveBeenCalledWith('test query', ['track'], 'US', 10);
  });

  it('should handle empty search results', async () => {
    mockClient.search = vi.fn().mockResolvedValue({
      tracks: {
        items: [],
        href: 'https://api.spotify.com/v1/search',
        limit: 10,
        next: null,
        offset: 0,
        previous: null,
        total: 0,
      },
    });

    const result = await searchTracks(mockClient as SpotifyApi, 'no results', 5);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it('should handle network errors', async () => {
    mockClient.search = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await searchTracks(mockClient as SpotifyApi, 'test query', 20);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('NetworkError');
      expect(result.error.message).toBe('Network error');
    }
  });

  it('should handle auth errors', async () => {
    mockClient.search = vi.fn().mockRejectedValue(new Error('Unauthorized'));

    const result = await searchTracks(mockClient as SpotifyApi, 'test query', 15);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('AuthError');
      expect(result.error.message).toBe('Unauthorized');
    }
  });

  it('should handle Spotify API errors', async () => {
    mockClient.search = vi.fn().mockRejectedValue(new Error('Bad request'));

    const result = await searchTracks(mockClient as SpotifyApi, 'invalid query', 50);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.type).toBe('SpotifyError');
      expect(result.error.message).toBe('Bad request');
    }
  });

  it('should handle different limit values', async () => {
    mockClient.search = vi.fn().mockResolvedValue({
      tracks: { items: mockTracks },
    });

    // Test with minimum limit
    await searchTracks(mockClient as SpotifyApi, 'test', 1);
    expect(mockClient.search).toHaveBeenCalledWith('test', ['track'], 'US', 1);

    // Test with maximum limit
    await searchTracks(mockClient as SpotifyApi, 'test', 50);
    expect(mockClient.search).toHaveBeenCalledWith('test', ['track'], 'US', 50);
  });
});
