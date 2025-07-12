import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkSavedTracks } from "./checkSavedTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("checkSavedTracks", () => {
  const mockHasSavedTracks = vi.fn();
  const mockClient = {
    currentUser: {
      tracks: {
        hasSavedTracks: mockHasSavedTracks,
      },
    },
  } as unknown as SpotifyApi;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should check tracks successfully", async () => {
    mockHasSavedTracks.mockResolvedValueOnce([true, false, true]);

    const result = await checkSavedTracks(mockClient, ["track1", "track2", "track3"]);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([true, false, true]);
    expect(mockHasSavedTracks).toHaveBeenCalledWith(["track1", "track2", "track3"]);
  });

  it("should handle API errors", async () => {
    mockHasSavedTracks.mockRejectedValueOnce(new Error("API error"));

    const result = await checkSavedTracks(mockClient, ["track1"]);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("Failed to check tracks: API error");
  });

  it("should validate empty array", async () => {
    const result = await checkSavedTracks(mockClient, []);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("At least one track ID is required");
    expect(mockHasSavedTracks).not.toHaveBeenCalled();
  });

  it("should validate maximum array size", async () => {
    const ids = Array(51).fill("track");
    const result = await checkSavedTracks(mockClient, ids);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("Maximum 50 track IDs allowed");
    expect(mockHasSavedTracks).not.toHaveBeenCalled();
  });

  it("should handle exactly 50 tracks", async () => {
    const ids = Array(50).fill("track");
    const expectedResult = Array(50).fill(true);
    mockHasSavedTracks.mockResolvedValueOnce(expectedResult);

    const result = await checkSavedTracks(mockClient, ids);

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(expectedResult);
    expect(mockHasSavedTracks).toHaveBeenCalledWith(ids);
  });
});
