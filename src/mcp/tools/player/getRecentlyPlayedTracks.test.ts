import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getRecentlyPlayedTracks } from "./getRecentlyPlayedTracks.ts";

describe("getRecentlyPlayedTracks", () => {
  let mockClient: SpotifyApi;
  const mockRecentlyPlayed = {
    items: [],
  } as any;

  beforeEach(() => {
    mockClient = {
      player: {
        getRecentlyPlayedTracks: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should get recently played tracks with default limit", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const result = await getRecentlyPlayedTracks(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockRecentlyPlayed);
    }
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(undefined, undefined);
  });

  it("should get recently played tracks with custom limit", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const result = await getRecentlyPlayedTracks(mockClient, 10);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockRecentlyPlayed);
    }
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(10, undefined);
  });

  it("should get recently played tracks with before timestamp", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const result = await getRecentlyPlayedTracks(mockClient, undefined, 1704110400000);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockRecentlyPlayed);
    }
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(undefined, {
      timestamp: 1704110400000,
      type: "before",
    });
  });

  it("should get recently played tracks with after timestamp", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const result = await getRecentlyPlayedTracks(mockClient, undefined, undefined, 1704110400000);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockRecentlyPlayed);
    }
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(undefined, {
      timestamp: 1704110400000,
      type: "after",
    });
  });

  it("should only use before when both timestamps provided", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const result = await getRecentlyPlayedTracks(mockClient, 5, 1704110400000, 1704096000000);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockRecentlyPlayed);
    }
    // When both before and after are provided, before takes precedence
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(5, {
      timestamp: 1704110400000,
      type: "before",
    });
  });

  it("should validate limit range", async () => {
    const result = await getRecentlyPlayedTracks(mockClient, 0);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Limit must be between 1 and 50");
    }
  });

  it("should validate limit maximum", async () => {
    const result = await getRecentlyPlayedTracks(mockClient, 51);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Limit must be between 1 and 50");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await getRecentlyPlayedTracks(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get recently played tracks: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockRejectedValue(
      new Error("Network error"),
    );

    const result = await getRecentlyPlayedTracks(mockClient, 20);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get recently played tracks: Network error");
    }
  });
});
