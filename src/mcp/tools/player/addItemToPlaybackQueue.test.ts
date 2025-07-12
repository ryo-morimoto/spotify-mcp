import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { addItemToPlaybackQueue } from "./addItemToPlaybackQueue.ts";

describe("addItemToPlaybackQueue", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        addItemToPlaybackQueue: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should add track to queue", async () => {
    vi.mocked(mockClient.player.addItemToPlaybackQueue).mockResolvedValue(undefined);

    const result = await addItemToPlaybackQueue(mockClient, "spotify:track:4iV5W9uYEdYUVa79Axb7Rh");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Item added to queue successfully");
    }
    expect(mockClient.player.addItemToPlaybackQueue).toHaveBeenCalledWith(
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "",
    );
  });

  it("should add episode to queue", async () => {
    vi.mocked(mockClient.player.addItemToPlaybackQueue).mockResolvedValue(undefined);

    const result = await addItemToPlaybackQueue(
      mockClient,
      "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Item added to queue successfully");
    }
    expect(mockClient.player.addItemToPlaybackQueue).toHaveBeenCalledWith(
      "spotify:episode:512ojhOuo1ktJprKbVcKyQ",
      "",
    );
  });

  it("should add item to queue on specific device", async () => {
    vi.mocked(mockClient.player.addItemToPlaybackQueue).mockResolvedValue(undefined);

    const result = await addItemToPlaybackQueue(
      mockClient,
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "device123",
    );

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Item added to queue successfully");
    }
    expect(mockClient.player.addItemToPlaybackQueue).toHaveBeenCalledWith(
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "device123",
    );
  });

  it("should validate empty URI", async () => {
    const result = await addItemToPlaybackQueue(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("URI must not be empty");
    }
  });

  it("should validate whitespace-only URI", async () => {
    const result = await addItemToPlaybackQueue(mockClient, "  ");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("URI must not be empty");
    }
  });

  it("should validate empty device ID", async () => {
    const result = await addItemToPlaybackQueue(
      mockClient,
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "",
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.addItemToPlaybackQueue).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await addItemToPlaybackQueue(mockClient, "spotify:track:4iV5W9uYEdYUVa79Axb7Rh");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to add item to queue: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.addItemToPlaybackQueue).mockRejectedValue(
      new Error("Network error"),
    );

    const result = await addItemToPlaybackQueue(
      mockClient,
      "spotify:track:4iV5W9uYEdYUVa79Axb7Rh",
      "device456",
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to add item to queue: Network error");
    }
  });
});
