import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveTracks } from "./saveTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("saveTracks", () => {
  const mockSaveTracks = vi.fn();
  const mockClient = {
    currentUser: {
      tracks: {
        saveTracks: mockSaveTracks,
      },
    },
  } as unknown as SpotifyApi;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should save tracks successfully", async () => {
    mockSaveTracks.mockResolvedValueOnce(undefined);

    const result = await saveTracks(mockClient, ["track1", "track2"]);

    expect(result.isOk()).toBe(true);
    expect(mockSaveTracks).toHaveBeenCalledWith(["track1", "track2"]);
  });

  it("should handle API errors", async () => {
    mockSaveTracks.mockRejectedValueOnce(new Error("API error"));

    const result = await saveTracks(mockClient, ["track1"]);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("Failed to save tracks: API error");
  });

  it("should validate empty array", async () => {
    const result = await saveTracks(mockClient, []);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("At least one track ID is required");
    expect(mockSaveTracks).not.toHaveBeenCalled();
  });

  it("should validate maximum array size", async () => {
    const ids = Array(51).fill("track");
    const result = await saveTracks(mockClient, ids);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe("Maximum 50 track IDs allowed");
    expect(mockSaveTracks).not.toHaveBeenCalled();
  });

  it("should handle exactly 50 tracks", async () => {
    mockSaveTracks.mockResolvedValueOnce(undefined);
    const ids = Array(50).fill("track");

    const result = await saveTracks(mockClient, ids);

    expect(result.isOk()).toBe(true);
    expect(mockSaveTracks).toHaveBeenCalledWith(ids);
  });
});
