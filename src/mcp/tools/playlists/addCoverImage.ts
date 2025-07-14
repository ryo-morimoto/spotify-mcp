import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, SuccessResult } from "../../../types.ts";
import { z } from "zod";

async function addPlaylistCoverImage(
  client: SpotifyApi,
  playlistId: string,
  imageBase64: string,
): Promise<Result<SuccessResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  // Validate image data
  if (!imageBase64.trim()) {
    return err("Image data must not be empty");
  }

  // Basic validation of base64 format
  // Check for invalid base64 characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(imageBase64)) {
    return err("Invalid base64 image data");
  }

  try {
    // Attempt to decode to check if it's valid base64
    const decoded = Buffer.from(imageBase64, "base64");

    // Check size limit (256KB)
    if (decoded.length > 256 * 1024) {
      return err("Image size must not exceed 256KB");
    }
  } catch {
    return err("Invalid base64 image data");
  }

  try {
    await client.playlists.addCustomPlaylistCoverImage(playlistId, imageBase64);

    return ok({
      success: true,
      message: "Successfully uploaded playlist cover image",
    });
  } catch (error) {
    return err(
      `Failed to upload playlist cover image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const addPlaylistCoverImageSchema = {
  playlistId: z.string().describe("The Spotify ID of the playlist"),
  imageBase64: z
    .string()
    .describe(
      "Base64 encoded JPEG image data. Must be exactly 640x640 pixels and not exceed 256KB.",
    ),
} as const;

type AddPlaylistCoverImageInput = z.infer<z.ZodObject<typeof addPlaylistCoverImageSchema>>;

export const createAddPlaylistCoverImageTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof addPlaylistCoverImageSchema> => ({
  name: "add_custom_playlist_cover_image",
  title: "Add Custom Playlist Cover Image",
  description:
    "Upload a custom image to be the playlist cover. Image must be a JPEG, exactly 640x640 pixels, and not exceed 256KB.",
  inputSchema: addPlaylistCoverImageSchema,
  handler: async (input: AddPlaylistCoverImageInput): Promise<CallToolResult> => {
    const result = await addPlaylistCoverImage(spotifyClient, input.playlistId, input.imageBase64);

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
