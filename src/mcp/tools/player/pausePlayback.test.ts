import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { pausePlayback } from "./pausePlayback.ts";

describe("pausePlayback", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        pausePlayback: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should pause playback with no parameters", async () => {
    vi.mocked(mockClient.player.pausePlayback).mockResolvedValue(undefined);

    const result = await pausePlayback(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback paused successfully");
    }
    expect(mockClient.player.pausePlayback).toHaveBeenCalledWith("");
  });

  it("should pause playback on specific device", async () => {
    vi.mocked(mockClient.player.pausePlayback).mockResolvedValue(undefined);

    const result = await pausePlayback(mockClient, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback paused successfully");
    }
    expect(mockClient.player.pausePlayback).toHaveBeenCalledWith("device123");
  });

  it("should validate empty device ID", async () => {
    const result = await pausePlayback(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.pausePlayback).mockRejectedValue(new Error("API request failed"));

    const result = await pausePlayback(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to pause playback: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.pausePlayback).mockRejectedValue(new Error("Network error"));

    const result = await pausePlayback(mockClient, "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to pause playback: Network error");
    }
  });
});
