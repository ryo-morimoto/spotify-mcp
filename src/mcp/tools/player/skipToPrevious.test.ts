import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { skipToPrevious } from "./skipToPrevious.ts";

describe("skipToPrevious", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        skipToPrevious: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should skip to previous track with no parameters", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockResolvedValue(undefined);

    const result = await skipToPrevious(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Skipped to previous track successfully");
    }
    expect(mockClient.player.skipToPrevious).toHaveBeenCalledWith("");
  });

  it("should skip to previous track on specific device", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockResolvedValue(undefined);

    const result = await skipToPrevious(mockClient, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Skipped to previous track successfully");
    }
    expect(mockClient.player.skipToPrevious).toHaveBeenCalledWith("device123");
  });

  it("should validate empty device ID", async () => {
    const result = await skipToPrevious(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockRejectedValue(new Error("API request failed"));

    const result = await skipToPrevious(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to skip to previous track: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockRejectedValue(new Error("Network error"));

    const result = await skipToPrevious(mockClient, "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to skip to previous track: Network error");
    }
  });
});
