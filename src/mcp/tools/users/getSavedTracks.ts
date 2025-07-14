import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market, Page, SavedTrack } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, GetSavedItemsOptions } from "@types";
import { z } from "zod";

const getSavedTracksSchema = {
  limit: z
    .number()
    .min(1)
    .max(50)
    .optional()
    .describe("Maximum number of items to return (1-50, default 20)"),
  offset: z
    .number()
    .min(0)
    .optional()
    .describe("The index of the first item to return (default 0)"),
  market: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .describe("ISO 3166-1 alpha-2 country code (e.g., 'US', 'JP')"),
} as const;

type GetSavedTracksInput = z.infer<z.ZodObject<typeof getSavedTracksSchema>>;

async function getSavedTracks(
  client: SpotifyApi,
  options?: GetSavedItemsOptions,
): Promise<Result<Page<SavedTrack>, string>> {
  // Validate limit parameter
  if (options?.limit !== undefined) {
    if (options.limit < 1 || options.limit > 50) {
      return err("Limit must be between 1 and 50");
    }
  }

  // Validate offset parameter
  if (options?.offset !== undefined) {
    if (options.offset < 0) {
      return err("Offset must be non-negative");
    }
  }

  // Validate market parameter if provided
  if (options?.market !== undefined) {
    if (!/^[A-Z]{2}$/.test(options.market)) {
      return err("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  }

  try {
    const savedTracks = await client.currentUser.tracks.savedTracks(
      options?.limit as any,
      options?.offset,
      options?.market as Market,
    );
    return ok(savedTracks);
  } catch (error) {
    return err(
      `Failed to get saved tracks: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createGetSavedTracksTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSavedTracksSchema> => ({
  name: "get_saved_tracks",
  title: "Get User's Saved Tracks",
  description: "Get a list of the songs saved in the current Spotify user's library",
  inputSchema: getSavedTracksSchema,
  handler: async (input: GetSavedTracksInput): Promise<CallToolResult> => {
    const result = await getSavedTracks(spotifyClient, {
      limit: input.limit,
      offset: input.offset,
      market: input.market,
    });

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
