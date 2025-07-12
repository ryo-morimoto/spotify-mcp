import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getRelatedArtists, createGetRelatedArtistsTool } from "./getRelated.ts";

describe("getRelatedArtists", () => {
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
          genres: ["rock", "indie"],
          images: [{ url: "https://example.com/image1.jpg", height: 640, width: 640 }],
          popularity: 65,
        },
        {
          id: "related2",
          name: "Related Artist 2",
          type: "artist",
          uri: "spotify:artist:related2",
          href: "https://api.spotify.com/v1/artists/related2",
          external_urls: { spotify: "https://open.spotify.com/artist/related2" },
          followers: { href: null, total: 20000 },
          genres: ["rock", "alternative"],
          images: [{ url: "https://example.com/image2.jpg", height: 640, width: 640 }],
          popularity: 70,
        },
      ],
    };
    vi.mocked(mockClient.artists.relatedArtists).mockResolvedValue(mockRelatedArtists as any);

    const result = await getRelatedArtists(mockClient, "artist123");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockRelatedArtists.artists);
    }
    expect(mockClient.artists.relatedArtists).toHaveBeenCalledWith("artist123");
  });

  it("should handle empty related artists", async () => {
    const mockResponse = { artists: [] };
    vi.mocked(mockClient.artists.relatedArtists).mockResolvedValue(mockResponse as any);

    const result = await getRelatedArtists(mockClient, "artist123");
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([]);
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.artists.relatedArtists).mockRejectedValue(new Error("API request failed"));

    const result = await getRelatedArtists(mockClient, "artist123");
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to get related artists: API request failed");
    }
  });
});

describe("createGetRelatedArtistsTool", () => {
  const mockClient = {
    artists: {
      relatedArtists: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createGetRelatedArtistsTool(mockClient);
    expect(tool.name).toBe("get-related-artists");
    expect(tool.title).toBe("Get Artist's Related Artists");
    expect(tool.description).toContain("Get Spotify catalog information about artists similar");
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful request", async () => {
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
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockRelatedArtists.artists);
  });

  it("should handle errors", async () => {
    vi.mocked(mockClient.artists.relatedArtists).mockRejectedValue(new Error("Not found"));

    const tool = createGetRelatedArtistsTool(mockClient);
    const result = await tool.handler({ id: "invalid" });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
