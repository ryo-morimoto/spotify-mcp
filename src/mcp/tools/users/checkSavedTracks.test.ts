import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCheckSavedTracksTool } from "./checkSavedTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("check-saved-tracks tool", () => {
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

    const tool = createCheckSavedTracksTool(mockClient);
    const result = await tool.handler({ ids: ["track1", "track2", "track3"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual([
      { id: "track1", saved: true },
      { id: "track2", saved: false },
      { id: "track3", saved: true },
    ]);
    expect(mockHasSavedTracks).toHaveBeenCalledWith(["track1", "track2", "track3"]);
  });

  it("should handle API errors", async () => {
    mockHasSavedTracks.mockRejectedValueOnce(new Error("API error"));

    const tool = createCheckSavedTracksTool(mockClient);
    const result = await tool.handler({ ids: ["track1", "track2"] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to check tracks: API error");
  });

  it("should validate empty array", async () => {
    const tool = createCheckSavedTracksTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one track ID is required");
    expect(mockHasSavedTracks).not.toHaveBeenCalled();
  });

  it("should validate maximum array size", async () => {
    const ids = Array(51).fill("track");
    const tool = createCheckSavedTracksTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 50 track IDs allowed");
    expect(mockHasSavedTracks).not.toHaveBeenCalled();
  });

  it("should handle exactly 50 tracks", async () => {
    const ids = Array(50)
      .fill("track")
      .map((_, i) => `track${i}`);
    const expectedResult = Array(50).fill(true);
    mockHasSavedTracks.mockResolvedValueOnce(expectedResult);

    const tool = createCheckSavedTracksTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toHaveLength(50);
    expect(content[0]).toEqual({ id: "track0", saved: true });
    expect(mockHasSavedTracks).toHaveBeenCalledWith(ids);
  });

  it("should have correct metadata", () => {
    const tool = createCheckSavedTracksTool(mockClient);

    expect(tool.name).toBe("check_saved_tracks");
    expect(tool.title).toBe("Check if Tracks are Saved");
    expect(tool.description).toBe(
      "Check if one or more tracks are already saved in the current user's library",
    );
    expect(tool.inputSchema).toBeDefined();
    expect(tool.inputSchema.ids).toBeDefined();
  });
});
