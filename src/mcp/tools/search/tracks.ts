import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { SpotifyTrackResult, ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

const searchTracksSchema = {
  query: z.string().describe("Search query for tracks"),
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .default(20)
    .describe("Maximum number of results (1-50)"),
} as const;

type SearchTracksInput = z.infer<z.ZodObject<typeof searchTracksSchema>>;

export const createSearchTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof searchTracksSchema> => {
  const mapTrackToResult = (track: any): SpotifyTrackResult => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((a: { name: string }) => a.name).join(", "),
    album: track.album.name,
    duration_ms: track.duration_ms,
    preview_url: track.preview_url,
    external_url: track.external_urls.spotify,
  });

  return {
    name: "search_tracks",
    title: "Search Tracks",
    description: "Search for tracks on Spotify",
    inputSchema: searchTracksSchema,
    handler: async (input: SearchTracksInput): Promise<CallToolResult> => {
      try {
        const results = await spotifyClient.search(
          input.query,
          ["track"],
          "JP",
          input.limit as any,
        );

        const tracks: SpotifyTrackResult[] = results.tracks.items.map(mapTrackToResult);

        const uri = createResourceUri("search:tracks", undefined, { q: input.query });
        return createResourceResponse(uri, tracks);
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching tracks: ${error}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
};
