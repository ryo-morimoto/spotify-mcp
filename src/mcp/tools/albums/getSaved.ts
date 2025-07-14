import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Market, Page, SavedAlbum } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, GetSavedItemsOptions } from "@types";
import { z } from "zod";

const getSavedAlbumsSchema = {
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

type GetSavedAlbumsInput = z.infer<z.ZodObject<typeof getSavedAlbumsSchema>>;

async function getSavedAlbums(
  client: SpotifyApi,
  options?: GetSavedItemsOptions,
): Promise<Result<Page<SavedAlbum>, string>> {
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
    const savedAlbums = await client.currentUser.albums.savedAlbums(
      options?.limit as any,
      options?.offset,
      options?.market as Market,
    );
    return ok(savedAlbums);
  } catch (error) {
    return err(
      `Failed to get saved albums: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createGetSavedAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getSavedAlbumsSchema> => ({
  name: "get_saved_albums",
  title: "Get User's Saved Albums",
  description: "Get a list of the albums saved in the current Spotify user's library",
  inputSchema: getSavedAlbumsSchema,
  handler: async (input: GetSavedAlbumsInput): Promise<CallToolResult> => {
    const result = await getSavedAlbums(spotifyClient, {
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
