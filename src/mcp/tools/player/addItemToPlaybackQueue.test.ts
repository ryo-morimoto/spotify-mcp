import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createAddItemToPlaybackQueueTool } from "./addItemToPlaybackQueue.ts";

describe("add-item-to-playback-queue tool", () => {
  it("should add track to queue", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({ uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Item added to queue successfully");
    expect(mockClient.player.addItemToPlaybackQueue).toHaveBeenCalledWith(
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "",
    );
  });

  it("should add episode to queue", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({ uri: "spotify:episode:512ojhOuo1ktJprKbVcKyQ" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Item added to queue successfully");
    expect(mockClient.player.addItemToPlaybackQueue).toHaveBeenCalledWith(
      "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
      "",
    );
  });

  it("should add item to queue on specific device", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({
      uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      deviceId: "device123",
    });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Item added to queue successfully");
    expect(mockClient.player.addItemToPlaybackQueue).toHaveBeenCalledWith(
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "device123",
    );
  });

  it("should validate empty URI", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({ uri: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: URI must not be empty");
    expect(mockClient.player.addItemToPlaybackQueue).not.toHaveBeenCalled();
  });

  it("should validate whitespace-only URI", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({ uri: "  " });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: URI must not be empty");
    expect(mockClient.player.addItemToPlaybackQueue).not.toHaveBeenCalled();
  });

  it("should validate empty device ID", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({
      uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      deviceId: "",
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
    expect(mockClient.player.addItemToPlaybackQueue).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn().mockRejectedValue(new Error("API request failed")),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({ uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to add item to queue: API request failed",
    );
  });

  it("should handle network errors", async () => {
    const mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn().mockRejectedValue(new Error("Network error")),
      },
    } as unknown as SpotifyApi;

    const tool = createAddItemToPlaybackQueueTool(mockClient);
    const result = await tool.handler({
      uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      deviceId: "device456",
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to add item to queue: Network error",
    );
  });
});
