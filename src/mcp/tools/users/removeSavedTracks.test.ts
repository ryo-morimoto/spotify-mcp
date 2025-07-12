import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRemoveSavedTracksTool } from "./removeSavedTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("remove-saved-tracks tool", () => {
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

    const tool = createRemoveSavedTracksTool(mockClient);
    const result = await tool.handler({ ids: ["track1", "track2"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully removed 2 track(s) from library");
    expect(mockRemoveSavedTracks).toHaveBeenCalledWith(["track1", "track2"]);
  });

  it("should handle API errors", async () => {
    mockRemoveSavedTracks.mockRejectedValueOnce(new Error("API error"));

    const tool = createRemoveSavedTracksTool(mockClient);
    const result = await tool.handler({ ids: ["track1", "track2"] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to remove tracks: API error");
  });

  it("should validate empty array", async () => {
    const tool = createRemoveSavedTracksTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one track ID is required");
    expect(mockRemoveSavedTracks).not.toHaveBeenCalled();
  });

  it("should validate maximum array size", async () => {
    const ids = Array(51).fill("track");
    const tool = createRemoveSavedTracksTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 50 track IDs allowed");
    expect(mockRemoveSavedTracks).not.toHaveBeenCalled();
  });

  it("should handle exactly 50 tracks", async () => {
    mockRemoveSavedTracks.mockResolvedValueOnce(undefined);
    const ids = Array(50).fill("track");

    const tool = createRemoveSavedTracksTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully removed 50 track(s) from library");
    expect(mockRemoveSavedTracks).toHaveBeenCalledWith(ids);
  });

  it("should have correct metadata", () => {
    const tool = createRemoveSavedTracksTool(mockClient);

    expect(tool.name).toBe("remove_saved_tracks");
    expect(tool.title).toBe("Remove Tracks from Library");
    expect(tool.description).toBe("Remove one or more tracks from the current user's library");
    expect(tool.inputSchema).toBeDefined();
    expect(tool.inputSchema.ids).toBeDefined();
  });
});
