import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { seekToPosition } from "./seekToPosition.ts";

describe("seekToPosition", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        seekToPosition: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should seek to position with only position_ms", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockResolvedValue(undefined);

    const result = await seekToPosition(mockClient, 30000);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Seeked to position 30000ms successfully");
    }
    expect(mockClient.player.seekToPosition).toHaveBeenCalledWith(30000, undefined);
  });

  it("should seek to position on specific device", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockResolvedValue(undefined);

    const result = await seekToPosition(mockClient, 45000, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Seeked to position 45000ms successfully");
    }
    expect(mockClient.player.seekToPosition).toHaveBeenCalledWith(45000, "device123");
  });

  it("should validate negative position", async () => {
    const result = await seekToPosition(mockClient, -1000);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Position must be non-negative");
    }
  });

  it("should validate empty device ID", async () => {
    const result = await seekToPosition(mockClient, 30000, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockRejectedValue(new Error("API request failed"));

    const result = await seekToPosition(mockClient, 30000);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to seek to position: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockRejectedValue(new Error("Network error"));

    const result = await seekToPosition(mockClient, 60000, "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to seek to position: Network error");
    }
  });
});
