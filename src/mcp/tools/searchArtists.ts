import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyArtistResult, ToolDefinition } from "../../types.ts";
import { z } from "zod";

const searchArtistsSchema = {
  query: z.string().describe("Search query for artists"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchArtistsInput = z.infer<z.ZodObject<typeof searchArtistsSchema>>;

const mapArtistToResult = (artist: any): SpotifyArtistResult => ({
  id: artist.id,
  name: artist.name,
  genres: artist.genres || [],
  popularity: artist.popularity,
  followers: artist.followers?.total || 0,
  external_url: artist.external_urls.spotify,
  images: artist.images.map((img: any) => ({
    url: img.url,
    height: img.height,
    width: img.width,
  })),
});

export const createSearchArtistsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchArtistsSchema> => ({
  name: "search-artists",
  title: "Search Artists",
  description: "Search for artists on Spotify",
  inputSchema: searchArtistsSchema,
  handler: async (input: SearchArtistsInput): Promise<CallToolResult> => {
    try {
      const limit = input.limit ?? 20;
      const results = await spotifyClient.search(input.query, ["artist"], "JP", limit as any);

      const artists: SpotifyArtistResult[] = results.artists.items.map(mapArtistToResult);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(artists, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching artists: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
});
