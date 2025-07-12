import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const saveAlbumsSchema = {
  ids: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Array of Spotify album IDs to save (maximum 50)"),
} as const;

type SaveAlbumsInput = z.infer<z.ZodObject<typeof saveAlbumsSchema>>;

// Export for testing
export async function saveAlbums(client: SpotifyApi, ids: string[]): Promise<Result<void, string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one album ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 album IDs allowed");
  }

  try {
    await client.currentUser.albums.saveAlbums(ids);
    return ok(undefined);
  } catch (error) {
    return err(`Failed to save albums: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const createSaveAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof saveAlbumsSchema> => ({
  name: "save_albums",
  title: "Save Albums to Library",
  description: "Save one or more albums to the current user's library",
  inputSchema: saveAlbumsSchema,
  handler: async (input: SaveAlbumsInput): Promise<CallToolResult> => {
    const result = await saveAlbums(spotifyClient, input.ids);

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
          text: `Successfully saved ${input.ids.length} album(s) to library`,
        },
      ],
    };
  },
});
