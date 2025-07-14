import { describe, it, expect, vi } from "vitest";
import { createSearchPlaylistsTool } from "@mcp/tools/search/playlists.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("createSearchPlaylistsTool", () => {
  it("should validate input schema correctly", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchPlaylistsTool(mockClient);

    // Test valid input
    const validInput = { query: "Lo-Fi Study", limit: 10 };
    expect(() => tool.inputSchema.query.parse(validInput.query)).not.toThrow();
    expect(() => tool.inputSchema.limit?.parse(validInput.limit)).not.toThrow();

    // Test invalid limit
    expect(() => tool.inputSchema.limit?.parse(0)).toThrow();
    expect(() => tool.inputSchema.limit?.parse(51)).toThrow();
  });

  it("should search playlists successfully", async () => {
    const mockSearchResult = {
      playlists: {
        items: [
          {
            id: "playlist1",
            name: "Lo-Fi Study Beats",
            description: "Relaxing beats for studying",
            owner: { display_name: "Spotify" },
            public: true,
            collaborative: false,
            tracks: { total: 50 },
            external_urls: { spotify: "https://open.spotify.com/playlist/playlist1" },
            images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchPlaylistsTool(mockClient);
    const result = await tool.handler({ query: "Lo-Fi Study", limit: 10 });

    expect(mockClient.search).toHaveBeenCalledWith("Lo-Fi Study", ["playlist"], "JP", 10);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsedContent = JSON.parse((result.content[0] as any).text);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].name).toBe("Lo-Fi Study Beats");
    expect(parsedContent[0].owner).toBe("Spotify");
    expect(parsedContent[0].total_tracks).toBe(50);
  });

  it("should handle search errors", async () => {
    const mockClient = {
      search: vi.fn().mockRejectedValue(new Error("API Error")),
    } as unknown as SpotifyApi;

    const tool = createSearchPlaylistsTool(mockClient);
    const result = await tool.handler({ query: "test", limit: 20 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain(
      "Error searching playlists: Error: API Error",
    );
  });

  it("should use default limit when not provided", async () => {
    const mockSearchResult = { playlists: { items: [] } };
    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchPlaylistsTool(mockClient);
    await tool.handler({ query: "test", limit: undefined as any });

    expect(mockClient.search).toHaveBeenCalledWith("test", ["playlist"], "JP", 20);
  });

  it("should handle playlists with null values", async () => {
    const mockSearchResult = {
      playlists: {
        items: [
          {
            id: "playlist2",
            name: "Private Playlist",
            description: null,
            owner: { display_name: "User123" },
            public: null,
            collaborative: false,
            tracks: { total: 10 },
            external_urls: { spotify: "https://open.spotify.com/playlist/playlist2" },
            images: [],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchPlaylistsTool(mockClient);
    const result = await tool.handler({ query: "Private", limit: 5 });

    const parsedContent = JSON.parse((result.content[0] as any).text);
    expect(parsedContent[0].description).toBeNull();
    expect(parsedContent[0].public).toBeNull();
    expect(parsedContent[0].images).toEqual([]);
  });
});
