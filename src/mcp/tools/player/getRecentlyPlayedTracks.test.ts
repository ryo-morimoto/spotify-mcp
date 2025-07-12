import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetRecentlyPlayedTracksTool } from "./getRecentlyPlayedTracks.ts";

describe("get-recently-played-tracks tool", () => {
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

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(mockRecentlyPlayed);
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(undefined, undefined);
  });

  it("should get recently played tracks with custom limit", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({ limit: 10 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(mockRecentlyPlayed);
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(10, undefined);
  });

  it("should get recently played tracks with before timestamp", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({ before: 1704110400000 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(mockRecentlyPlayed);
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(undefined, {
      timestamp: 1704110400000,
      type: "before",
    });
  });

  it("should get recently played tracks with after timestamp", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({ after: 1704110400000 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(mockRecentlyPlayed);
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(undefined, {
      timestamp: 1704110400000,
      type: "after",
    });
  });

  it("should only use before when both timestamps provided", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockResolvedValue(mockRecentlyPlayed);

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({ limit: 5, before: 1704110400000, after: 1704024000000 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response).toEqual(mockRecentlyPlayed);
    // When both before and after are provided, before takes precedence
    expect(mockClient.player.getRecentlyPlayedTracks).toHaveBeenCalledWith(5, {
      timestamp: 1704110400000,
      type: "before",
    });
  });

  it("should validate limit range", async () => {
    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({ limit: 0 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Limit must be between 1 and 50");
  });

  it("should validate limit maximum", async () => {
    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({ limit: 51 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Limit must be between 1 and 50");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get recently played tracks: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.getRecentlyPlayedTracks).mockRejectedValue(
      new Error("Network error"),
    );

    const tool = createGetRecentlyPlayedTracksTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get recently played tracks: Network error",
    );
  });
});
