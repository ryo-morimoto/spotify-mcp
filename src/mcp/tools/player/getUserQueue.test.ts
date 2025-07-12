import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetUserQueueTool } from "./getUserQueue.ts";

describe("get-user-queue tool", () => {
  let mockClient: SpotifyApi;
  const mockQueue = {
    currently_playing: {
      id: "current_track",
      name: "Currently Playing",
      artists: [{ name: "Current Artist" }],
      album: { name: "Current Album" },
      duration_ms: 200000,
    },
    queue: [
      {
        id: "queue_track_1",
        name: "Next Song",
        artists: [{ name: "Next Artist" }],
        album: { name: "Next Album" },
        duration_ms: 180000,
      },
      {
        id: "queue_track_2",
        name: "Second Song",
        artists: [{ name: "Second Artist" }],
        album: { name: "Second Album" },
        duration_ms: 240000,
      },
    ],
  } as any;

  beforeEach(() => {
    mockClient = {
      player: {
        getUsersQueue: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should get user queue", async () => {
    vi.mocked(mockClient.player.getUsersQueue).mockResolvedValue(mockQueue);

    const tool = createGetUserQueueTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(mockQueue);
    expect(mockClient.player.getUsersQueue).toHaveBeenCalledWith();
  });

  it("should handle empty queue", async () => {
    const emptyQueue = {
      currently_playing: null,
      queue: [],
    } as any;

    vi.mocked(mockClient.player.getUsersQueue).mockResolvedValue(emptyQueue);

    const tool = createGetUserQueueTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(emptyQueue);
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getUsersQueue).mockRejectedValue(new Error("API request failed"));

    const tool = createGetUserQueueTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get user queue: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.getUsersQueue).mockRejectedValue(new Error("Network error"));

    const tool = createGetUserQueueTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to get user queue: Network error");
  });
});
