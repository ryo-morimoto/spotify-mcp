import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";
import { createGetRelatedArtistsTool } from "@mcp/tools/artists/getRelated.ts";

describe("get_related_artists tool", () => {
  const mockClient = {
    artists: {
      relatedArtists: vi.fn(),
    },
  } as unknown as SpotifyApi;
  it("should get related artists successfully", async () => {
    const mockRelatedArtists = {
      artists: [
        {
          id: "related1",
          name: "Related Artist 1",
          type: "artist",
          uri: "spotify:artist:related1",
          href: "https://api.spotify.com/v1/artists/related1",
          external_urls: { spotify: "https://open.spotify.com/artist/related1" },
          followers: { href: null, total: 10000 },
          genres: ["rock"],
          images: [],
          popularity: 65,
        },
      ],
    };
    vi.mocked(mockClient.artists.relatedArtists).mockResolvedValue(mockRelatedArtists as any);

    const tool = createGetRelatedArtistsTool(mockClient);
    const result = await tool.handler({ id: "artist123" });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resourceContent = result.content[0] as EmbeddedResource;
    expect(resourceContent.resource.uri).toBe("spotify:artist:artist123:related");
    expect(resourceContent.resource.mimeType).toBe("application/json");

    const content = JSON.parse(resourceContent.resource.text as string);
    expect(content).toEqual(mockRelatedArtists.artists);
  });

  it("should handle empty related artists", async () => {
    const mockResponse = { artists: [] };
    vi.mocked(mockClient.artists.relatedArtists).mockResolvedValue(mockResponse as any);

    const tool = createGetRelatedArtistsTool(mockClient);
    const result = await tool.handler({ id: "artist123" });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resourceContent = result.content[0] as EmbeddedResource;
    const content = JSON.parse(resourceContent.resource.text as string);
    expect(content).toEqual([]);
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.artists.relatedArtists).mockRejectedValue(new Error("Not found"));

    const tool = createGetRelatedArtistsTool(mockClient);
    const result = await tool.handler({ id: "invalid" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
