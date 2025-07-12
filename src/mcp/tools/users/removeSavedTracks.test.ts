import { describe, it, expect, vi, beforeEach } from "vitest";
import { removeSavedTracks } from "./removeSavedTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("removeSavedTracks", () => {
  const mockRemoveSavedTracks = vi.fn();
  const mockClient = {
    currentUser: {
      tracks: {
        removeSavedTracks: mockRemoveSavedTracks,
      },
    },
  } as unknown as SpotifyApi;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should remove tracks successfully", async () => {
    mockRemoveSavedTracks.mockResolvedValueOnce(undefined);

    const result = await removeSavedTracks(mockClient, ["track1", "track2"]);

    expect(result.isOk()).toBe(true);
    expect(mockRemoveSavedTracks).toHaveBeenCalledWith(["track1", "track2"]);
  });

  it("should handle API errors", async () => {
    mockRemoveSavedTracks.mockRejectedValueOnce(new Error("API error"));

    const result = await removeSavedTracks(mockClient, ["track1"]);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("Failed to remove tracks: API error");
  });

  it("should validate empty array", async () => {
    const result = await removeSavedTracks(mockClient, []);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("At least one track ID is required");
    expect(mockRemoveSavedTracks).not.toHaveBeenCalled();
  });

  it("should validate maximum array size", async () => {
    const ids = Array(51).fill("track");
    const result = await removeSavedTracks(mockClient, ids);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("Maximum 50 track IDs allowed");
    expect(mockRemoveSavedTracks).not.toHaveBeenCalled();
  });

  it("should handle exactly 50 tracks", async () => {
    mockRemoveSavedTracks.mockResolvedValueOnce(undefined);
    const ids = Array(50).fill("track");

    const result = await removeSavedTracks(mockClient, ids);

    expect(result.isOk()).toBe(true);
    expect(mockRemoveSavedTracks).toHaveBeenCalledWith(ids);
  });
});
