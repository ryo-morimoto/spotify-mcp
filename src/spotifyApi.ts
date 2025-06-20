import { Result, ok, err } from 'neverthrow';
import type { NetworkError, AuthError, SpotifyError } from './result.ts';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  uri: string;
}

export interface PlayerState {
  is_playing: boolean;
  item: SpotifyTrack | null;
  device: {
    id: string;
    name: string;
    type: string;
    volume_percent: number;
  } | null;
  progress_ms?: number;
  duration_ms?: number;
}

export type PlaybackCommand = 'play' | 'pause' | 'next' | 'previous';

function createNetworkError(message: string, statusCode?: number): NetworkError {
  return {
    type: 'NetworkError',
    message: `Network request failed: ${message}`,
    statusCode
  };
}

function createAuthError(message: string, reason: AuthError['reason'] = 'invalid'): AuthError {
  return {
    type: 'AuthError',
    message: `Authentication failed: ${message}`,
    reason
  };
}

function createSpotifyError(message: string, spotifyErrorCode?: string): SpotifyError {
  return {
    type: 'SpotifyError',
    message,
    spotifyErrorCode
  };
}

export async function searchTracks(
  query: string,
  accessToken: string,
  limit: number = 10
): Promise<Result<SpotifyTrack[], NetworkError | AuthError | SpotifyError>> {
  try {
    const url = `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return err(createAuthError('Invalid or expired access token'));
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return err(createSpotifyError(`Rate limit exceeded. Retry after ${retryAfter} seconds`));
      }
      return err(createSpotifyError(`Request failed: ${response.status} ${response.statusText}`));
    }

    const data = await response.json() as { tracks: { items: SpotifyTrack[] } };
    return ok(data.tracks.items);
  } catch (error) {
    return err(createNetworkError(error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function getCurrentPlayback(
  accessToken: string
): Promise<Result<PlayerState | null, NetworkError | AuthError | SpotifyError>> {
  try {
    const url = `${SPOTIFY_API_BASE}/me/player`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 204) {
      return ok(null);
    }

    if (!response.ok) {
      if (response.status === 401) {
        return err(createAuthError('Invalid or expired access token'));
      }
      return err(createSpotifyError(`Request failed: ${response.status} ${response.statusText}`));
    }

    const data = await response.json();
    return ok(data as PlayerState);
  } catch (error) {
    return err(createNetworkError(error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function controlPlayback(
  command: PlaybackCommand,
  accessToken: string
): Promise<Result<void, NetworkError | AuthError | SpotifyError>> {
  try {
    const endpoints: Record<PlaybackCommand, { path: string; method: string }> = {
      play: { path: 'play', method: 'PUT' },
      pause: { path: 'pause', method: 'PUT' },
      next: { path: 'next', method: 'POST' },
      previous: { path: 'previous', method: 'POST' }
    };

    const { path, method } = endpoints[command];
    const url = `${SPOTIFY_API_BASE}/me/player/${path}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return err(createAuthError('Invalid or expired access token'));
      }
      if (response.status === 404) {
        const errorData = await response.json() as { error?: { message?: string } };
        return err(createSpotifyError(errorData.error?.message || 'No active device found'));
      }
      return err(createSpotifyError(`Request failed: ${response.status} ${response.statusText}`));
    }

    return ok(undefined);
  } catch (error) {
    return err(createNetworkError(error instanceof Error ? error.message : 'Unknown error'));
  }
}