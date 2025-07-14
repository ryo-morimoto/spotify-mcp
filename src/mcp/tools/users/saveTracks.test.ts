import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSaveTracksTool } from "@mcp/tools/users/saveTracks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("save-tracks tool", () => {
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

    const tool = createSaveTracksTool(mockClient);
    const result = await tool.handler({ ids: ["track1", "track2"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully saved 2 track(s) to library");
    expect(mockSaveTracks).toHaveBeenCalledWith(["track1", "track2"]);
  });

  it("should handle API errors", async () => {
    mockSaveTracks.mockRejectedValueOnce(new Error("API error"));

    const tool = createSaveTracksTool(mockClient);
    const result = await tool.handler({ ids: ["track1", "track2"] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to save tracks: API error");
  });

  it("should validate empty array", async () => {
    const tool = createSaveTracksTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one track ID is required");
    expect(mockSaveTracks).not.toHaveBeenCalled();
  });

  it("should validate maximum array size", async () => {
    const ids = Array(51).fill("track");
    const tool = createSaveTracksTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 50 track IDs allowed");
    expect(mockSaveTracks).not.toHaveBeenCalled();
  });

  it("should handle exactly 50 tracks", async () => {
    mockSaveTracks.mockResolvedValueOnce(undefined);
    const ids = Array(50).fill("track");

    const tool = createSaveTracksTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully saved 50 track(s) to library");
    expect(mockSaveTracks).toHaveBeenCalledWith(ids);
  });
});
