import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

const checkSavedAlbumsSchema = {
  ids: z
    .array(z.string())
    .min(1)
    .max(50)
    .describe("Array of Spotify album IDs to check (maximum 50)"),
} as const;

type CheckSavedAlbumsInput = z.infer<z.ZodObject<typeof checkSavedAlbumsSchema>>;

async function checkSavedAlbums(
  client: SpotifyApi,
  ids: string[],
): Promise<Result<boolean[], string>> {
  // Validate input
  if (ids.length === 0) {
    return err("At least one album ID is required");
  }
  if (ids.length > 50) {
    return err("Maximum 50 album IDs allowed");
  }

  try {
    const result = await client.currentUser.albums.hasSavedAlbums(ids);
    return ok(result);
  } catch (error) {
    return err(`Failed to check albums: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const createCheckSavedAlbumsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof checkSavedAlbumsSchema> => ({
  name: "check_saved_albums",
  title: "Check if Albums are Saved",
  description: "Check if one or more albums are already saved in the current user's library",
  inputSchema: checkSavedAlbumsSchema,
  handler: async (input: CheckSavedAlbumsInput): Promise<CallToolResult> => {
    const result = await checkSavedAlbums(spotifyClient, input.ids);

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

    // Create a mapping of album IDs to their saved status
    const albumStatus = input.ids.map((id, index) => ({
      id,
      saved: result.value[index],
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(albumStatus, null, 2),
        },
      ],
    };
  },
});
