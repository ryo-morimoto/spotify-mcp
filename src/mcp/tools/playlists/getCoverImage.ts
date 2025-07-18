import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition, SpotifyImageObject, ImageResult } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

async function getPlaylistCoverImage(
  client: SpotifyApi,
  playlistId: string,
): Promise<Result<ImageResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  try {
    const images = await client.playlists.getPlaylistCoverImage(playlistId);

    const mappedImages: SpotifyImageObject[] = images.map((image) => ({
      url: image.url,
      height: image.height ?? null,
      width: image.width ?? null,
    }));

    return ok({
      images: mappedImages,
    });
  } catch (error) {
    return err(
      `Failed to get playlist cover image: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getPlaylistCoverImageSchema = {
  playlistId: z.string().describe("The Spotify ID of the playlist"),
} as const;

type GetPlaylistCoverImageInput = z.infer<z.ZodObject<typeof getPlaylistCoverImageSchema>>;

export const createGetPlaylistCoverImageTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getPlaylistCoverImageSchema> => ({
  name: "get_playlist_cover_image",
  title: "Get Playlist Cover Image",
  description: "Get the current image associated with a specific playlist",
  inputSchema: getPlaylistCoverImageSchema,
  handler: async (input: GetPlaylistCoverImageInput): Promise<CallToolResult> => {
    const result = await getPlaylistCoverImage(spotifyClient, input.playlistId);

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

    const uri = createResourceUri("playlist", input.playlistId, undefined, "images");
    return createResourceResponse(uri, result.value);
  },
});
