import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyEpisodeResult, ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const searchEpisodesSchema = {
  query: z.string().describe("Search query for episodes"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchEpisodesInput = z.infer<z.ZodObject<typeof searchEpisodesSchema>>;

const mapEpisodeToResult = (episode: any): SpotifyEpisodeResult => ({
  id: episode.id,
  name: episode.name,
  description: episode.description,
  duration_ms: episode.duration_ms,
  release_date: episode.release_date,
  explicit: episode.explicit,
  external_url: episode.external_urls.spotify,
  images: episode.images.map((img: any) => ({
    url: img.url,
    height: img.height,
    width: img.width,
  })),
});

export const createSearchEpisodesTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchEpisodesSchema> => ({
  name: "search-episodes",
  title: "Search Episodes",
  description: "Search for podcast episodes on Spotify",
  inputSchema: searchEpisodesSchema,
  handler: async (input: SearchEpisodesInput): Promise<CallToolResult> => {
    try {
      const limit = input.limit ?? 20;
      const results = await spotifyClient.search(input.query, ["episode"], "JP", limit as any);

      const episodes: SpotifyEpisodeResult[] = results.episodes.items.map(mapEpisodeToResult);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(episodes, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error searching episodes: ${error}`,
          },
        ],
        isError: true,
      };
    }
  },
});
