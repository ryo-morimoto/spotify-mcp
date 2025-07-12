import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { setPlaybackVolume } from "./setPlaybackVolume.ts";

describe("setPlaybackVolume", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        setPlaybackVolume: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should set volume to 0", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const result = await setPlaybackVolume(mockClient, 0);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Volume set to 0% successfully");
    }
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(0, undefined);
  });

  it("should set volume to 50", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const result = await setPlaybackVolume(mockClient, 50);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Volume set to 50% successfully");
    }
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(50, undefined);
  });

  it("should set volume to 100", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const result = await setPlaybackVolume(mockClient, 100);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Volume set to 100% successfully");
    }
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(100, undefined);
  });

  it("should set volume on specific device", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const result = await setPlaybackVolume(mockClient, 75, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Volume set to 75% successfully");
    }
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(75, "device123");
  });

  it("should validate negative volume", async () => {
    const result = await setPlaybackVolume(mockClient, -1);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Volume must be between 0 and 100");
    }
  });

  it("should validate volume over 100", async () => {
    const result = await setPlaybackVolume(mockClient, 101);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Volume must be between 0 and 100");
    }
  });

  it("should validate empty device ID", async () => {
    const result = await setPlaybackVolume(mockClient, 50, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await setPlaybackVolume(mockClient, 50);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to set playback volume: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockRejectedValue(new Error("Network error"));

    const result = await setPlaybackVolume(mockClient, 25, "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to set playback volume: Network error");
    }
  });
});
