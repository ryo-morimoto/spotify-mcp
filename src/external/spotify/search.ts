import { SpotifyApi, type Track, type MaxInt } from '@spotify/web-api-ts-sdk';
import { Result, ok, err } from 'neverthrow';
import type { NetworkError, AuthError, SpotifyError } from '../../result.ts';
import { mapSpotifyError } from './errorMapper.ts';

/**
 * Search tracks using official SDK with Result error handling
 *
 * @param limit - Must be between 1 and 50 (validated by caller)
 */
export async function searchTracks(
  client: SpotifyApi,
  query: string,
  limit: number = 10,
): Promise<Result<Track[], NetworkError | AuthError | SpotifyError>> {
  try {
    // SDK requires MaxInt<50> type, cast the validated number
    const searchResults = await client.search(query, ['track'], 'US', limit as MaxInt<50>);

    // Empty arrays are valid responses - let consumers decide how to handle
    return ok(searchResults.tracks.items);
  } catch (error) {
    return err(mapSpotifyError(error));
  }
}
