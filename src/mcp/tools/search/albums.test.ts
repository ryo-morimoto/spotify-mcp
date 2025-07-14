import { describe, it, expect, vi } from "vitest";
import { createSearchAlbumsTool } from "@mcp/tools/search/albums.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("createSearchAlbumsTool", () => {
  it("should validate input schema correctly", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchAlbumsTool(mockClient);

    // Test valid input
    const validInput = { query: "Dark Side of the Moon", limit: 10 };
    expect(() => tool.inputSchema.query.parse(validInput.query)).not.toThrow();
    expect(() => tool.inputSchema.limit?.parse(validInput.limit)).not.toThrow();

    // Test invalid limit
    expect(() => tool.inputSchema.limit?.parse(0)).toThrow();
    expect(() => tool.inputSchema.limit?.parse(51)).toThrow();
  });

  it("should search albums successfully", async () => {
    const mockSearchResult = {
      albums: {
        items: [
          {
            id: "album1",
            name: "Dark Side of the Moon",
            artists: [{ name: "Pink Floyd" }],
            release_date: "1973-03-01",
            total_tracks: 10,
            album_type: "album",
            external_urls: { spotify: "https://open.spotify.com/album/album1" },
            images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchAlbumsTool(mockClient);
    const result = await tool.handler({ query: "Dark Side of the Moon", limit: 10 });

    expect(mockClient.search).toHaveBeenCalledWith("Dark Side of the Moon", ["album"], "JP", 10);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsedContent = JSON.parse((result.content[0] as any).text);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].name).toBe("Dark Side of the Moon");
    expect(parsedContent[0].artists).toBe("Pink Floyd");
  });

  it("should handle search errors", async () => {
    const mockClient = {
      search: vi.fn().mockRejectedValue(new Error("API Error")),
    } as unknown as SpotifyApi;

    const tool = createSearchAlbumsTool(mockClient);
    const result = await tool.handler({ query: "test", limit: 20 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error searching albums: Error: API Error");
  });

  it("should use default limit when not provided", async () => {
    const mockSearchResult = { albums: { items: [] } };
    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchAlbumsTool(mockClient);
    await tool.handler({ query: "test", limit: undefined as any });

    expect(mockClient.search).toHaveBeenCalledWith("test", ["album"], "JP", 20);
  });
});
