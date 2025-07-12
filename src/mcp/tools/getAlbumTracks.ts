import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyTrackResult, ToolDefinition } from "../../types.ts";
import { z } from "zod";

async function getAlbumTracks(
  client: SpotifyApi,
  albumId: string,
): Promise<Result<SpotifyTrackResult[], string>> {
  // Validate album ID
  if (!albumId.trim()) {
    return err("Album ID must not be empty");
  }

  try {
    const tracks = await client.albums.tracks(albumId);
    return ok(
      tracks.items.map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((artist) => artist.name).join(", "),
        album: "Unknown Album", // Album name is not included in the tracks endpoint response
        duration_ms: track.duration_ms,
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
      })),
    );
  } catch (error) {
    return err(
      `Failed to get album tracks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getAlbumTracksSchema = {
  albumId: z.string().describe("Spotify album ID"),
} as const;

type GetAlbumTracksInput = z.infer<z.ZodObject<typeof getAlbumTracksSchema>>;

// Export for testing only
export { getAlbumTracks };

export const createGetAlbumTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getAlbumTracksSchema> => ({
  name: "get-album-tracks",
  title: "Get Album Tracks",
  description: "Get all tracks from a Spotify album",
  inputSchema: getAlbumTracksSchema,
  handler: async (input: GetAlbumTracksInput): Promise<CallToolResult> => {
    const result = await getAlbumTracks(spotifyClient, input.albumId);

    if (result.isErr()) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${result.error}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result.value, null, 2),
        },
      ],
    };
  },
});
