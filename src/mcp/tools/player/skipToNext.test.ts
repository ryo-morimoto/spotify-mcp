import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { skipToNext } from "./skipToNext.ts";

describe("skipToNext", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        skipToNext: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should skip to next track with no parameters", async () => {
    vi.mocked(mockClient.player.skipToNext).mockResolvedValue(undefined);

    const result = await skipToNext(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Skipped to next track successfully");
    }
    expect(mockClient.player.skipToNext).toHaveBeenCalledWith("");
  });

  it("should skip to next track on specific device", async () => {
    vi.mocked(mockClient.player.skipToNext).mockResolvedValue(undefined);

    const result = await skipToNext(mockClient, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Skipped to next track successfully");
    }
    expect(mockClient.player.skipToNext).toHaveBeenCalledWith("device123");
  });

  it("should validate empty device ID", async () => {
    const result = await skipToNext(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.skipToNext).mockRejectedValue(new Error("API request failed"));

    const result = await skipToNext(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to skip to next track: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.skipToNext).mockRejectedValue(new Error("Network error"));

    const result = await skipToNext(mockClient, "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to skip to next track: Network error");
    }
  });
});
