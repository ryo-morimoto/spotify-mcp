import { describe, it, expect, vi } from "vitest";
import { createSearchAudiobooksTool } from "@mcp/tools/search/audiobooks.ts";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";

describe("createSearchAudiobooksTool", () => {
  it("should validate input schema correctly", () => {
    const mockClient = {} as SpotifyApi;
    const tool = createSearchAudiobooksTool(mockClient);

    // Test valid input
    const validInput = { query: "Harry Potter", limit: 10 };
    expect(() => tool.inputSchema.query.parse(validInput.query)).not.toThrow();
    expect(() => tool.inputSchema.limit?.parse(validInput.limit)).not.toThrow();

    // Test invalid limit
    expect(() => tool.inputSchema.limit?.parse(0)).toThrow();
    expect(() => tool.inputSchema.limit?.parse(51)).toThrow();
  });

  it("should search audiobooks successfully", async () => {
    const mockSearchResult = {
      audiobooks: {
        items: [
          {
            id: "audiobook1",
            name: "Harry Potter and the Philosopher's Stone",
            description: "The first book in the Harry Potter series.",
            authors: [{ name: "J.K. Rowling" }],
            narrators: [{ name: "Stephen Fry" }],
            publisher: "Pottermore Publishing",
            total_chapters: 17,
            explicit: false,
            external_urls: { spotify: "https://open.spotify.com/audiobook/audiobook1" },
            images: [{ url: "https://example.com/image.jpg", height: 300, width: 300 }],
          },
        ],
      },
    };

    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchAudiobooksTool(mockClient);
    const result = await tool.handler({ query: "Harry Potter", limit: 10 });

    expect(mockClient.search).toHaveBeenCalledWith("Harry Potter", ["audiobook"], "JP", 10);
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as EmbeddedResource;
    const parsedContent = JSON.parse(resource.resource.text as string);
    expect(parsedContent).toHaveLength(1);
    expect(parsedContent[0].name).toBe("Harry Potter and the Philosopher's Stone");
    expect(parsedContent[0].authors).toEqual(["J.K. Rowling"]);
    expect(parsedContent[0].narrators).toEqual(["Stephen Fry"]);
    expect(parsedContent[0].publisher).toBe("Pottermore Publishing");
    expect(parsedContent[0].total_chapters).toBe(17);
  });

  it("should handle search errors", async () => {
    const mockClient = {
      search: vi.fn().mockRejectedValue(new Error("API Error")),
    } as unknown as SpotifyApi;

    const tool = createSearchAudiobooksTool(mockClient);
    const result = await tool.handler({ query: "test", limit: 20 });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain(
      "Error searching audiobooks: Error: API Error",
    );
  });

  it("should use default limit when not provided", async () => {
    const mockSearchResult = { audiobooks: { items: [] } };
    const mockClient = {
      search: vi.fn().mockResolvedValue(mockSearchResult),
    } as unknown as SpotifyApi;

    const tool = createSearchAudiobooksTool(mockClient);
    await tool.handler({ query: "test", limit: undefined as any });

    expect(mockClient.search).toHaveBeenCalledWith("test", ["audiobook"], "JP", 20);
  });
});
