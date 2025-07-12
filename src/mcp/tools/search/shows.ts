import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyShowResult, ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const searchShowsSchema = {
  query: z.string().describe("Search query for shows"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchShowsInput = z.infer<z.ZodObject<typeof searchShowsSchema>>;

const mapShowToResult = (show: any): SpotifyShowResult => ({
  id: show.id,
  name: show.name,
  description: show.description,
  publisher: show.publisher,
  total_episodes: show.total_episodes,
  explicit: show.explicit,
  external_url: show.external_urls.spotify,
  images: show.images.map((img: any) => ({
    url: img.url,
    height: img.height,
    width: img.width,
  })),
});

export const createSearchShowsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchShowsSchema> => ({
  name: "search-shows",
  title: "Search Shows",
  description: "Search for podcast shows on Spotify",
  inputSchema: searchShowsSchema,
  handler: async (input: SearchShowsInput): Promise<CallToolResult> => {
    try {
      const limit = input.limit ?? 20;
      const results = await spotifyClient.search(input.query, ["show"], "JP", limit as any);

      const shows: SpotifyShowResult[] = results.shows.items.map(mapShowToResult);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(shows, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching shows: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
});
