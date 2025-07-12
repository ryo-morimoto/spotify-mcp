import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { togglePlaybackShuffle } from "./togglePlaybackShuffle.ts";

describe("togglePlaybackShuffle", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        togglePlaybackShuffle: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should enable shuffle", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockResolvedValue(undefined);

    const result = await togglePlaybackShuffle(mockClient, true);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Shuffle enabled successfully");
    }
    expect(mockClient.player.togglePlaybackShuffle).toHaveBeenCalledWith(true, undefined);
  });

  it("should disable shuffle", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockResolvedValue(undefined);

    const result = await togglePlaybackShuffle(mockClient, false);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Shuffle disabled successfully");
    }
    expect(mockClient.player.togglePlaybackShuffle).toHaveBeenCalledWith(false, undefined);
  });

  it("should toggle shuffle on specific device", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockResolvedValue(undefined);

    const result = await togglePlaybackShuffle(mockClient, true, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Shuffle enabled successfully");
    }
    expect(mockClient.player.togglePlaybackShuffle).toHaveBeenCalledWith(true, "device123");
  });

  it("should validate empty device ID", async () => {
    const result = await togglePlaybackShuffle(mockClient, true, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await togglePlaybackShuffle(mockClient, true);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to toggle shuffle: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockRejectedValue(
      new Error("Network error"),
    );

    const result = await togglePlaybackShuffle(mockClient, false, "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to toggle shuffle: Network error");
    }
  });
});
