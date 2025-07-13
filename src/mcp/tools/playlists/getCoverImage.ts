import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "../../../types.ts";
import { z } from "zod";

type ImageObject = {
  url: string;
  height: number | null;
  width: number | null;
};

type GetPlaylistCoverImageResult = {
  images: ImageObject[];
};

async function getPlaylistCoverImage(
  client: SpotifyApi,
  playlistId: string,
): Promise<Result<GetPlaylistCoverImageResult, string>> {
  // Validate playlist ID
  if (!playlistId.trim()) {
    return err("Playlist ID must not be empty");
  }

  try {
    const images = await client.playlists.getPlaylistCoverImage(playlistId);

    const mappedImages: ImageObject[] = images.map((image) => ({
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
