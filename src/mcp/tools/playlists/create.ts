import { Result, ok, err } from "neverthrow";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";

type CreatePlaylistResult = {
  id: string;
  name: string;
  description: string | null;
  public: boolean;
  collaborative: boolean;
  owner: string;
  total_tracks: number;
  external_url: string;
};

async function createPlaylist(
  client: SpotifyApi,
  name: string,
  isPublic: boolean = true,
  collaborative: boolean = false,
  description?: string,
): Promise<Result<CreatePlaylistResult, string>> {
  // Validate playlist name
  if (!name.trim()) {
    return err("Playlist name must not be empty");
  }

  try {
    // Get current user's ID
    const user = await client.currentUser.profile();
    const userId = user.id;

    // Collaborative playlists must be private
    const actualPublic = collaborative ? false : isPublic;

    // Create the playlist
    const playlist = await client.playlists.createPlaylist(userId, {
      name,
      public: actualPublic,
      collaborative,
      description,
    });

    return ok({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      public: playlist.public,
      collaborative: playlist.collaborative,
      owner: playlist.owner.display_name || playlist.owner.id,
      total_tracks: playlist.tracks.total,
      external_url: playlist.external_urls.spotify,
    });
  } catch (error) {
    return err(
      `Failed to create playlist: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const createPlaylistSchema = {
  name: z.string().describe("The name for the new playlist"),
  public: z.boolean().optional().describe("Whether the playlist should be public (default: true)"),
  collaborative: z
    .boolean()
    .optional()
    .describe("Whether the playlist should be collaborative (default: false)"),
  description: z.string().optional().describe("Description of the playlist"),
} as const;

type CreatePlaylistInput = z.infer<z.ZodObject<typeof createPlaylistSchema>>;

export const createCreatePlaylistTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof createPlaylistSchema> => ({
  name: "create_playlist",
  title: "Create Playlist",
  description: "Create a new playlist for the current user",
  inputSchema: createPlaylistSchema,
  handler: async (input: CreatePlaylistInput): Promise<CallToolResult> => {
    const result = await createPlaylist(
      spotifyClient,
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
          text: JSON.stringify(result.value, null, 2),
        },
      ],
    };
  },
});
