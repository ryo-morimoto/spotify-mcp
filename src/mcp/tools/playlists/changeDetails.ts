import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

async function changePlaylistDetails(
  client: SpotifyApi,
  playlistId: string,
  name?: string,
  isPublic?: boolean,
  collaborative?: boolean,
  description?: string,
): Promise<Result<void, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  // Check if at least one field is provided
  if (
    name === undefined &&
    isPublic === undefined &&
    collaborative === undefined &&
    description === undefined
  ) {
    return err("At least one field must be provided to update");
  }

  // Validate collaborative playlists must be private
  if (collaborative === true && isPublic === true) {
    return err("Collaborative playlists must be private");
  }

  try {
    await client.playlists.changePlaylistDetails(playlistId, {
      name,
      public: isPublic,
      collaborative,
      description,
    });

    return ok(undefined);
  } catch (error) {
    return err(
      `Failed to update playlist details: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const changePlaylistDetailsSchema = {
  playlistId: z.string().describe("The Spotify ID of the playlist"),
  name: z.string().optional().describe("New name for the playlist"),
  public: z.boolean().optional().describe("Whether the playlist should be public"),
  collaborative: z.boolean().optional().describe("Whether the playlist should be collaborative"),
  description: z.string().optional().describe("New description for the playlist"),
} as const;

type ChangePlaylistDetailsInput = z.infer<z.ZodObject<typeof changePlaylistDetailsSchema>>;

export const createChangePlaylistDetailsTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof changePlaylistDetailsSchema> => ({
  name: "change_playlist_details",
  title: "Change Playlist Details",
  description:
    "Change a playlist's name, public/private state, collaborative state, and description",
  inputSchema: changePlaylistDetailsSchema,
  handler: async (input: ChangePlaylistDetailsInput): Promise<CallToolResult> => {
    const result = await changePlaylistDetails(
      spotifyClient,
      input.playlistId,
      input.name,
      input.public,
      input.collaborative,
      input.description,
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

    return {
      content: [
        {
          type: "text",
          text: "Playlist details updated successfully",
        },
      ],
    };
  },
});
