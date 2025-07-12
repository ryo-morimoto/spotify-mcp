import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const removeSavedAlbumsSchema = {
  ids: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Array of Spotify album IDs to remove (maximum 50)"),
} as const;

type RemoveSavedAlbumsInput = z.infer<z.ZodObject<typeof removeSavedAlbumsSchema>>;

async function removeSavedAlbums(client: SpotifyApi, ids: string[]): Promise<Result<void, string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one album ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 album IDs allowed");
  }

  try {
    await client.currentUser.albums.removeSavedAlbums(ids);
    return ok(undefined);
  } catch (error) {
    return err(
      `Failed to remove albums: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const createRemoveSavedAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof removeSavedAlbumsSchema> => ({
  name: "remove_saved_albums",
  title: "Remove Albums from Library",
  description: "Remove one or more albums from the current user's library",
  inputSchema: removeSavedAlbumsSchema,
  handler: async (input: RemoveSavedAlbumsInput): Promise<CallToolResult> => {
    const result = await removeSavedAlbums(spotifyClient, input.ids);

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
          text: `Successfully removed ${input.ids.length} album(s) from library`,
        },
      ],
    };
  },
});
