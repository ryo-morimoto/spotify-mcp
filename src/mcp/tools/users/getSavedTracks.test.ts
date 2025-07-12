import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getSavedTracks } from "./getSavedTracks.ts";

describe("getSavedTracks", () => {
  const mockClient = {
    currentUser: {
      tracks: {
        savedTracks: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should get user's saved tracks successfully", async () => {
    const mockSavedTracks = {
      href: "https://api.spotify.com/v1/me/tracks",
      items: [
        {
          added_at: "2024-01-01T00:00:00Z",
          track: {
            id: "track1",
            name: "Test Track",
            artists: [{ name: "Test Artist" }],
            album: { name: "Test Album" },
          },
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
      next: null,
      previous: null,
    };

    vi.mocked(mockClient.currentUser.tracks.savedTracks).mockResolvedValue(mockSavedTracks as any);

    const result = await getSavedTracks(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockSavedTracks);
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.tracks.savedTracks).mockRejectedValue(new Error("API Error"));

    const result = await getSavedTracks(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to get saved tracks: API Error");
    }
  });

  it("should validate limit parameter", async () => {
    const result = await getSavedTracks(mockClient, { limit: 100 });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Limit must be between 1 and 50");
    }
  });

  it("should validate offset parameter", async () => {
    const result = await getSavedTracks(mockClient, { offset: -1 });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Offset must be non-negative");
    }
  });
});
