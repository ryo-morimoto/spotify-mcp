import { Result, ok, err } from 'neverthrow';
import { z } from 'zod';
import type { AppError } from '../../result.ts';
import type { TokenManager } from '../../types/index.ts';
import {
  createSpotifyClient,
  searchTracks,
} from '../../external/spotify/index.ts';

// TODO: Implement advanced search features [MID]
// - [ ] Support filtering by genre, year, popularity
// - [ ] Add pagination for large result sets
// - [ ] Cache search results for performance
// See: Spotify API docs for advanced search parameters

export const searchSchema = z.object({
  query: z.string().describe('Search query for tracks'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Maximum number of results (1-50)'),
});

export type SearchArgs = z.infer<typeof searchSchema>;

export async function handleSearch(
  args: SearchArgs,
  tokenManager: TokenManager
): Promise<Result<string, AppError>> {
  // Get access token
  const tokenResult = await tokenManager.refreshTokenIfNeeded();
  if (tokenResult.isErr()) {
    return err(tokenResult.error);
  }

  // Create Spotify client and search tracks
  const client = createSpotifyClient(tokenResult.value);
  // Zod validates limit is 1-50 at runtime
  const searchResult = await searchTracks(client, args.query, args.limit || 10);
  if (searchResult.isErr()) {
    return err(searchResult.error);
  }

  // Format results
  const tracks = searchResult.value;
  if (tracks.length === 0) {
    return ok('No tracks found');
  }

  const trackList = tracks
    .map(
      (track) =>
        `• ${track.name} by ${track.artists.map((a) => a.name).join(', ')} (${track.album.name})`,
    )
    .join('\n');

  return ok(`Found ${tracks.length} tracks:\n${trackList}`);
}