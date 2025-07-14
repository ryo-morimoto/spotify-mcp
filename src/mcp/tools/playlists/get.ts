import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyPlaylistResult, ToolDefinition } from "@types";
import { z } from "zod";

async function getPlaylist(
  client: SpotifyApi,
  playlistId: string,
): Promise<Result<SpotifyPlaylistResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  try {
    const playlist = await client.playlists.getPlaylist(playlistId);
    return ok({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      owner: playlist.owner.display_name || playlist.owner.id,
      public: playlist.public,
      collaborative: playlist.collaborative,
      total_tracks: playlist.tracks.total,
      external_url: playlist.external_urls.spotify,
      images: playlist.images.map((image) => ({
        url: image.url,
        height: image.height,
        width: image.width,
      })),
    });
  } catch (error) {
    return err(`Failed to get playlist: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const getPlaylistSchema = {
  playlistId: z.string().describe("Spotify playlist ID"),
} as const;

type GetPlaylistInput = z.infer<z.ZodObject<typeof getPlaylistSchema>>;

export const createGetPlaylistTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getPlaylistSchema> => ({
  name: "get_playlist",
  title: "Get Playlist",
  description: "Get a single playlist by ID from Spotify",
  inputSchema: getPlaylistSchema,
  handler: async (input: GetPlaylistInput): Promise<CallToolResult> => {
    const result = await getPlaylist(spotifyClient, input.playlistId);

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
