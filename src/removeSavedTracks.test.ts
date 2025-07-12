import { describe, it, expect, vi } from "vitest";
import { removeSavedTracks } from "./removeSavedTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("removeSavedTracks", () => {
  it("should remove saved tracks successfully", async () => {
    const mockClient: SpotifyApi = {
      currentUser: {
        tracks: {
          removeSavedTracks: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as unknown as SpotifyApi;

    const ids = ["track1", "track2", "track3"];
    const result = await removeSavedTracks(mockClient, ids);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        success: true,
        removed: 3,
      });
    }
    expect(mockClient.currentUser.tracks.removeSavedTracks).toHaveBeenCalledWith(ids);
  });

  it("should handle empty array", async () => {
    const mockClient: SpotifyApi = {
      currentUser: {
        tracks: {
          removeSavedTracks: vi.fn(),
        },
      },
    } as unknown as SpotifyApi;

    const result = await removeSavedTracks(mockClient, []);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({
        success: true,
        removed: 0,
      });
    }
    expect(mockClient.currentUser.tracks.removeSavedTracks).not.toHaveBeenCalled();
  });

  it("should enforce maximum of 50 track IDs", async () => {
    const mockClient: SpotifyApi = {} as SpotifyApi;
    const ids = Array.from({ length: 51 }, (_, i) => `track${i}`);

    const result = await removeSavedTracks(mockClient, ids);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Cannot remove more than 50 tracks at once");
    }
  });

  it("should handle API errors", async () => {
    const mockClient: SpotifyApi = {
      currentUser: {
        tracks: {
          removeSavedTracks: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      },
    } as unknown as SpotifyApi;

    const ids = ["track1"];
    const result = await removeSavedTracks(mockClient, ids);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to remove tracks: API Error");
    }
  });

  it("should handle non-Error objects thrown by API", async () => {
    const mockClient: SpotifyApi = {
      currentUser: {
        tracks: {
          removeSavedTracks: vi.fn().mockRejectedValue("String error"),
        },
      },
    } as unknown as SpotifyApi;

    const ids = ["track1"];
    const result = await removeSavedTracks(mockClient, ids);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to remove tracks: String error");
    }
  });
});
