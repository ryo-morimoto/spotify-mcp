import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { setRepeatMode } from "./setRepeatMode.ts";

describe("setRepeatMode", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        setRepeatMode: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should set repeat mode to track", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const result = await setRepeatMode(mockClient, "track");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Repeat mode set to 'track' successfully");
    }
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("track", undefined);
  });

  it("should set repeat mode to context", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const result = await setRepeatMode(mockClient, "context");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Repeat mode set to 'context' successfully");
    }
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("context", undefined);
  });

  it("should set repeat mode to off", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const result = await setRepeatMode(mockClient, "off");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Repeat mode set to 'off' successfully");
    }
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("off", undefined);
  });

  it("should set repeat mode on specific device", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const result = await setRepeatMode(mockClient, "track", "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Repeat mode set to 'track' successfully");
    }
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("track", "device123");
  });

  it("should validate empty device ID", async () => {
    const result = await setRepeatMode(mockClient, "track", "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockRejectedValue(new Error("API request failed"));

    const result = await setRepeatMode(mockClient, "context");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to set repeat mode: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockRejectedValue(new Error("Network error"));

    const result = await setRepeatMode(mockClient, "off", "device456");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to set repeat mode: Network error");
    }
  });
});
