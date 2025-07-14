import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, RecentlyPlayedTracksPage } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

async function getRecentlyPlayedTracks(
  client: SpotifyApi,
  limit?: number,
  before?: number,
  after?: number,
): Promise<Result<RecentlyPlayedTracksPage, string>> {
  // Validate limit if provided
  if (limit !== undefined && (limit < 1 || limit > 50)) {
    return err("Limit must be between 1 and 50");
  }

  try {
    // SDK expects a QueryRange object with timestamp and type
    let queryRange: { timestamp: number; type: "before" | "after" } | undefined;

    if (before !== undefined) {
      queryRange = { timestamp: before, type: "before" };
    } else if (after !== undefined) {
      queryRange = { timestamp: after, type: "after" };
    }

    const recentlyPlayed = await client.player.getRecentlyPlayedTracks(limit as any, queryRange);

    return ok(recentlyPlayed);
  } catch (error) {
    return err(
      `Failed to get recently played tracks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getRecentlyPlayedTracksSchema = {
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .describe("The maximum number of items to return. Default: 20. Minimum: 1. Maximum: 50"),
  before: z
    .number()
    .optional()
    .describe("Unix timestamp in milliseconds. Returns all items before this cursor position"),
  after: z
    .number()
    .optional()
    .describe("Unix timestamp in milliseconds. Returns all items after this cursor position"),
} as const;

type GetRecentlyPlayedTracksInput = z.infer<z.ZodObject<typeof getRecentlyPlayedTracksSchema>>;

export const createGetRecentlyPlayedTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getRecentlyPlayedTracksSchema> => ({
  name: "get_recently_played_tracks",
  title: "Get Recently Played Tracks",
  description: "Get tracks from the current user's recently played tracks",
  inputSchema: getRecentlyPlayedTracksSchema,
  handler: async (input: GetRecentlyPlayedTracksInput): Promise<CallToolResult> => {
    const result = await getRecentlyPlayedTracks(
      spotifyClient,
      input.limit,
      input.before,
      input.after,
    );

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

    const uri = createResourceUri("player", undefined, undefined, "recently-played");
    return createResourceResponse(uri, result.value);
  },
});
