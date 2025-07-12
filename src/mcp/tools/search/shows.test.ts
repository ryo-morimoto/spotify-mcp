import { describe, it, expect, vi } from "vitest";
import { createSearchShowsTool } from "./shows.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";

describe("createSearchShowsTool", () => {
  it("should return a tool definition with correct metadata", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchShowsTool(mockClient);

    expect(tool.name).toBe("search-shows");
    expect(tool.title).toBe("Search Shows");
    expect(tool.description).toBe("Search for podcast shows on Spotify");
    expect(tool.inputSchema).toBeDefined();
    expect(tool.handler).toBeDefined();
  });

  it("should validate input schema correctly", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchShowsTool(mockClient);

    // Test valid input
    const validInput = { query: "Joe Rogan", limit: 10 };
    expect(() => tool.inputSchema.query.parse(validInput.query)).not.toThrow();
    expect(() => tool.inputSchema.limit?.parse(validInput.limit)).not.toThrow();

    // Test invalid limit
    expect(() => tool.inputSchema.limit?.parse(0)).toThrow();
    expect(() => tool.inputSchema.limit?.parse(51)).toThrow();
  });

  it("should search shows successfully", async () => {
    const mockSearchResult = {
      shows: {
        items: [
          {
            id: "show1",
            name: "The Joe Rogan Experience",
            description: "The official podcast of comedian Joe Rogan.",
            publisher: "Joe Rogan",
            total_episodes: 2000,
            explicit: true,
            external_urls: { spotify: "https://open.spotify.com/show/show1" },
            images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchShowsTool(mockClient);
    const result = await tool.handler({ query: "Joe Rogan", limit: 10 });

    expect(mockClient.search).toHaveBeenCalledWith("Joe Rogan", ["show"], "JP", 10);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsedContent = JSON.parse((result.content[0] as any).text);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].name).toBe("The Joe Rogan Experience");
    expect(parsedContent[0].publisher).toBe("Joe Rogan");
    expect(parsedContent[0].total_episodes).toBe(2000);
  });

  it("should handle search errors", async () => {
    const mockClient = {
      search: vi.fn().mockRejectedValue(new Error("API Error")),
    } as unknown as SpotifyApi;

    const tool = createSearchShowsTool(mockClient);
    const result = await tool.handler({ query: "test", limit: 20 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error searching shows: Error: API Error");
  });

  it("should use default limit when not provided", async () => {
    const mockSearchResult = { shows: { items: [] } };
    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchShowsTool(mockClient);
    await tool.handler({ query: "test", limit: undefined as any });

    expect(mockClient.search).toHaveBeenCalledWith("test", ["show"], "JP", 20);
  });
});
