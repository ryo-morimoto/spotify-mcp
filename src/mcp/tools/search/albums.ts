import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyAlbumResult, ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const searchAlbumsSchema = {
  query: z.string().describe("Search query for albums"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchAlbumsInput = z.infer<z.ZodObject<typeof searchAlbumsSchema>>;

const mapAlbumToResult = (album: any): SpotifyAlbumResult => ({
  id: album.id,
  name: album.name,
  artists: album.artists.map((a: { name: string }) => a.name).join(", "),
  release_date: album.release_date,
  total_tracks: album.total_tracks,
  album_type: album.album_type,
  external_url: album.external_urls.spotify,
  images: album.images.map((img: any) => ({
    url: img.url,
    height: img.height,
    width: img.width,
  })),
});

export const createSearchAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchAlbumsSchema> => ({
  name: "search_albums",
  title: "Search Albums",
  description: "Search for albums on Spotify",
  inputSchema: searchAlbumsSchema,
  handler: async (input: SearchAlbumsInput): Promise<CallToolResult> => {
    try {
      const limit = input.limit ?? 20;
      const results = await spotifyClient.search(input.query, ["album"], "JP", limit as any);

      const albums: SpotifyAlbumResult[] = results.albums.items.map(mapAlbumToResult);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(albums, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching albums: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
});
