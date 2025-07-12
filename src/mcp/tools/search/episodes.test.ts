import { describe, it, expect, vi } from "vitest";
import { createSearchEpisodesTool } from "./episodes.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("createSearchEpisodesTool", () => {
  it("should return a tool definition with correct metadata", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchEpisodesTool(mockClient);

    expect(tool.name).toBe("search-episodes");
    expect(tool.title).toBe("Search Episodes");
    expect(tool.description).toBe("Search for podcast episodes on Spotify");
    expect(tool.inputSchema).toBeDefined();
    expect(tool.handler).toBeDefined();
  });

  it("should validate input schema correctly", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchEpisodesTool(mockClient);

    // Test valid input
    const validInput = { query: "machine learning", limit: 10 };
    expect(() => tool.inputSchema.query.parse(validInput.query)).not.toThrow();
    expect(() => tool.inputSchema.limit?.parse(validInput.limit)).not.toThrow();

    // Test invalid limit
    expect(() => tool.inputSchema.limit?.parse(0)).toThrow();
    expect(() => tool.inputSchema.limit?.parse(51)).toThrow();
  });

  it("should search episodes successfully", async () => {
    const mockSearchResult = {
      episodes: {
        items: [
          {
            id: "episode1",
            name: "Introduction to Machine Learning",
            description: "A comprehensive introduction to ML concepts",
            duration_ms: 3600000,
            release_date: "2024-01-15",
            explicit: false,
            external_urls: { spotify: "https://open.spotify.com/episode/episode1" },
            images: [{ url: "https://example.com/episode.jpg", height: 300, width: 300 }],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchEpisodesTool(mockClient);
    const result = await tool.handler({ query: "machine learning", limit: 10 });

    expect(mockClient.search).toHaveBeenCalledWith("machine learning", ["episode"], "JP", 10);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsedContent = JSON.parse((result.content[0] as any).text);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].name).toBe("Introduction to Machine Learning");
    expect(parsedContent[0].duration_ms).toBe(3600000);
    expect(parsedContent[0].release_date).toBe("2024-01-15");
  });

  it("should handle search errors", async () => {
    const mockClient = {
      search: vi.fn().mockRejectedValue(new Error("API Error")),
    } as unknown as SpotifyApi;

    const tool = createSearchEpisodesTool(mockClient);
    const result = await tool.handler({ query: "test", limit: 20 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error searching episodes: Error: API Error");
  });

  it("should use default limit when not provided", async () => {
    const mockSearchResult = { episodes: { items: [] } };
    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchEpisodesTool(mockClient);
    await tool.handler({ query: "test", limit: undefined as any });

    expect(mockClient.search).toHaveBeenCalledWith("test", ["episode"], "JP", 20);
  });
});
