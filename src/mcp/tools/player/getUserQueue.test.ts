import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getUserQueue } from "./getUserQueue.ts";

describe("getUserQueue", () => {
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

    const result = await getUserQueue(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockQueue);
    }
    expect(mockClient.player.getUsersQueue).toHaveBeenCalledWith();
  });

  it("should handle empty queue", async () => {
    const emptyQueue = {
      currently_playing: null,
      queue: [],
    } as any;

    vi.mocked(mockClient.player.getUsersQueue).mockResolvedValue(emptyQueue);

    const result = await getUserQueue(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(emptyQueue);
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getUsersQueue).mockRejectedValue(new Error("API request failed"));

    const result = await getUserQueue(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get user queue: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.getUsersQueue).mockRejectedValue(new Error("Network error"));

    const result = await getUserQueue(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get user queue: Network error");
    }
  });
});
