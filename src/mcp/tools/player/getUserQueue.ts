import { Result, ok, err } from "neverthrow";
import type { SpotifyApi, Queue } from "@spotify/web-api-ts-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ToolDefinition } from "@types";
import { z } from "zod";
import { createResourceResponse, createResourceUri } from "../helpers/resourceHelpers.ts";

async function getUserQueue(client: SpotifyApi): Promise<Result<Queue, string>> {
  try {
    const queue = await client.player.getUsersQueue();

    return ok(queue);
  } catch (error) {
    return err(
      `Failed to get user queue: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

const getUserQueueSchema = {} as const;

type GetUserQueueInput = z.infer<z.ZodObject<typeof getUserQueueSchema>>;

export const createGetUserQueueTool = (
  spotifyClient: SpotifyApi,
): ToolDefinition<typeof getUserQueueSchema> => ({
  name: "get_user_queue",
  title: "Get the User's Queue",
  description: "Get the list of objects that make up the user's queue",
  inputSchema: getUserQueueSchema,
  handler: async (_input: GetUserQueueInput): Promise<CallToolResult> => {
    const result = await getUserQueue(spotifyClient);

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

    const uri = createResourceUri("player", undefined, undefined, "queue");
    return createResourceResponse(uri, result.value);
  },
});
