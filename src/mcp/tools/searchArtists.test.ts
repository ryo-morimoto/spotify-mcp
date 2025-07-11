import { describe, it, expect, vi } from "vitest";
import { createSearchArtistsTool } from "./searchArtists.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("createSearchArtistsTool", () => {
  it("should return a tool definition with correct metadata", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchArtistsTool(mockClient);

    expect(tool.name).toBe("search-artists");
    expect(tool.title).toBe("Search Artists");
    expect(tool.description).toBe("Search for artists on Spotify");
    expect(tool.inputSchema).toBeDefined();
    expect(tool.handler).toBeDefined();
  });

  it("should validate input schema correctly", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchArtistsTool(mockClient);

    // Test valid input
    const validInput = { query: "The Beatles", limit: 10 };
    expect(() => tool.inputSchema.query.parse(validInput.query)).not.toThrow();
    expect(() => tool.inputSchema.limit?.parse(validInput.limit)).not.toThrow();

    // Test invalid limit
    expect(() => tool.inputSchema.limit?.parse(0)).toThrow();
    expect(() => tool.inputSchema.limit?.parse(51)).toThrow();
  });

  it("should search artists successfully", async () => {
    const mockSearchResult = {
      artists: {
        items: [
          {
            id: "artist1",
            name: "The Beatles",
            genres: ["rock", "pop"],
            popularity: 85,
            followers: { total: 25000000 },
            external_urls: { spotify: "https://open.spotify.com/artist/artist1" },
            images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchArtistsTool(mockClient);
    const result = await tool.handler({ query: "The Beatles", limit: 10 });

    expect(mockClient.search).toHaveBeenCalledWith("The Beatles", ["artist"], "JP", 10);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsedContent = JSON.parse((result.content[0] as any).text);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].name).toBe("The Beatles");
    expect(parsedContent[0].followers).toBe(25000000);
    expect(parsedContent[0].genres).toEqual(["rock", "pop"]);
  });

  it("should handle search errors", async () => {
    const mockClient = {
      search: vi.fn().mockRejectedValue(new Error("API Error")),
    } as unknown as SpotifyApi;

    const tool = createSearchArtistsTool(mockClient);
    const result = await tool.handler({ query: "test", limit: 20 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error searching artists: Error: API Error");
  });

  it("should use default limit when not provided", async () => {
    const mockSearchResult = { artists: { items: [] } };
    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchArtistsTool(mockClient);
    await tool.handler({ query: "test", limit: undefined as any });

    expect(mockClient.search).toHaveBeenCalledWith("test", ["artist"], "JP", 20);
  });
});
