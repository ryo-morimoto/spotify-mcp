import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetSeveralArtistsTool } from "./getSeveral.ts";

describe("get_several_artists tool", () => {
  const mockClient = {
    artists: {
      get: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should have correct metadata", () => {
    const tool = createGetSeveralArtistsTool(mockClient);
    expect(tool.name).toBe("get_several_artists");
    expect(tool.title).toBe("Get Several Artists");
    expect(tool.description).toContain("Get Spotify catalog information for several artists");
    expect(tool.inputSchema).toBeDefined();
    expect(tool.inputSchema.ids).toBeDefined();
  });

  it("should get multiple artists successfully", async () => {
    const mockArtists = [
      {
        id: "artist1",
        name: "Artist 1",
        type: "artist",
        uri: "spotify:artist:artist1",
        href: "https://api.spotify.com/v1/artists/artist1",
        external_urls: { spotify: "https://open.spotify.com/artist/artist1" },
        followers: { href: null, total: 1000 },
        genres: ["rock"],
        images: [],
        popularity: 70,
      },
    ];
    vi.mocked(mockClient.artists.get).mockResolvedValue(mockArtists as any);

    const tool = createGetSeveralArtistsTool(mockClient);
    const result = await tool.handler({ ids: ["artist1"] });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual(mockArtists);
  });

  it("should validate empty array", async () => {
    const tool = createGetSeveralArtistsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });

  it("should validate maximum 50 artists", async () => {
    const ids = Array(51).fill("artist");
    const tool = createGetSeveralArtistsTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });

  it("should filter out null values from response", async () => {
    const mockResponse = [
      {
        id: "artist1",
        name: "Artist 1",
        type: "artist",
        uri: "spotify:artist:artist1",
        href: "https://api.spotify.com/v1/artists/artist1",
        external_urls: { spotify: "https://open.spotify.com/artist/artist1" },
        followers: { href: null, total: 1000 },
        genres: ["rock"],
        images: [],
        popularity: 70,
      },
      null,
      {
        id: "artist3",
        name: "Artist 3",
        type: "artist",
        uri: "spotify:artist:artist3",
        href: "https://api.spotify.com/v1/artists/artist3",
        external_urls: { spotify: "https://open.spotify.com/artist/artist3" },
        followers: { href: null, total: 2000 },
        genres: ["pop"],
        images: [],
        popularity: 80,
      },
    ];
    vi.mocked(mockClient.artists.get).mockResolvedValue(mockResponse as any);

    const tool = createGetSeveralArtistsTool(mockClient);
    const result = await tool.handler({ ids: ["artist1", "invalid", "artist3"] });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toHaveLength(2);
    expect(content[0].id).toBe("artist1");
    expect(content[1].id).toBe("artist3");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.artists.get).mockRejectedValue(new Error("API request failed"));

    const tool = createGetSeveralArtistsTool(mockClient);
    const result = await tool.handler({ ids: ["artist1"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
