import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetSavedTracksTool } from "@mcp/tools/users/getSavedTracks.ts";

describe("get-saved-tracks tool", () => {
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

    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockSavedTracks);
    expect(mockClient.currentUser.tracks.savedTracks).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
  });

  it("should get saved tracks with parameters", async () => {
    const mockSavedTracks = {
      href: "https://api.spotify.com/v1/me/tracks",
      items: [],
      total: 100,
      limit: 10,
      offset: 20,
      next: "https://api.spotify.com/v1/me/tracks?offset=30&limit=10",
      previous: "https://api.spotify.com/v1/me/tracks?offset=10&limit=10",
    };

    vi.mocked(mockClient.currentUser.tracks.savedTracks).mockResolvedValue(mockSavedTracks as any);

    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({ limit: 10, offset: 20, market: "US" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockSavedTracks);
    expect(mockClient.currentUser.tracks.savedTracks).toHaveBeenCalledWith(10, 20, "US");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.tracks.savedTracks).mockRejectedValue(new Error("API Error"));

    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to get saved tracks: API Error");
  });

  it("should validate limit parameter - too low", async () => {
    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({ limit: 0 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Limit must be between 1 and 50");
  });

  it("should validate limit parameter - too high", async () => {
    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({ limit: 51 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Limit must be between 1 and 50");
  });

  it("should validate offset parameter", async () => {
    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({ offset: -1 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Offset must be non-negative");
  });

  it("should validate market parameter", async () => {
    const tool = createGetSavedTracksTool(mockClient);
    const result = await tool.handler({ market: "USA" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Market must be a valid ISO 3166-1 alpha-2 country code",
    );
  });
});
