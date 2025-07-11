import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyPlaylistResult, ToolDefinition } from "../../types.ts";
import { z } from "zod";

const searchPlaylistsSchema = {
  query: z.string().describe("Search query for playlists"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchPlaylistsInput = z.infer<z.ZodObject<typeof searchPlaylistsSchema>>;

const mapPlaylistToResult = (playlist: any): SpotifyPlaylistResult => ({
  id: playlist.id,
  name: playlist.name,
  description: playlist.description,
  owner: playlist.owner.display_name,
  public: playlist.public,
  collaborative: playlist.collaborative,
  total_tracks: playlist.tracks.total,
  external_url: playlist.external_urls.spotify,
  images: playlist.images.map((img: any) => ({
    url: img.url,
    height: img.height,
    width: img.width,
  })),
});

export const createSearchPlaylistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchPlaylistsSchema> => ({
  name: "search-playlists",
  title: "Search Playlists",
  description: "Search for playlists on Spotify",
  inputSchema: searchPlaylistsSchema,
  handler: async (input: SearchPlaylistsInput): Promise<CallToolResult> => {
    try {
      const limit = input.limit ?? 20;
      const results = await spotifyClient.search(input.query, ["playlist"], "JP", limit as any);

      const playlists: SpotifyPlaylistResult[] = results.playlists.items.map(mapPlaylistToResult);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(playlists, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching playlists: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
});
