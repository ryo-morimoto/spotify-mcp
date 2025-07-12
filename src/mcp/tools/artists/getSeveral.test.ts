import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getSeveralArtists, createGetSeveralArtistsTool } from "./getSeveral.ts";

describe("getSeveralArtists", () => {
  const mockClient = {
    artists: {
      get: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should get multiple artists successfully", async () => {
    const mockArtists = [
      {
        id: "artist1",
        name: "Artist 1",
        type: "artist",
        uri: "spotify:artist:artist1",
        href: "https://api.spotify.com/v1/artists/artist1",
        external_urls: { spotify: "https://open.spotify.com/artist/artist1" },
      },
      {
        id: "artist2",
        name: "Artist 2",
        type: "artist",
        uri: "spotify:artist:artist2",
        href: "https://api.spotify.com/v1/artists/artist2",
        external_urls: { spotify: "https://open.spotify.com/artist/artist2" },
      },
    ];
    vi.mocked(mockClient.artists.get).mockResolvedValue(mockArtists as any);

    const result = await getSeveralArtists(mockClient, ["artist1", "artist2"]);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual(mockArtists);
    }
    expect(mockClient.artists.get).toHaveBeenCalledWith(["artist1", "artist2"]);
  });

  it("should validate empty array", async () => {
    const result = await getSeveralArtists(mockClient, []);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("At least one artist ID is required");
    }
  });

  it("should validate maximum 50 artists", async () => {
    const ids = Array(51).fill("artist");
    const result = await getSeveralArtists(mockClient, ids);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 50 artist IDs allowed");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.artists.get).mockRejectedValue(new Error("API request failed"));

    const result = await getSeveralArtists(mockClient, ["artist1"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to get artists: API request failed");
    }
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
      },
      null,
      {
        id: "artist3",
        name: "Artist 3",
        type: "artist",
        uri: "spotify:artist:artist3",
        href: "https://api.spotify.com/v1/artists/artist3",
        external_urls: { spotify: "https://open.spotify.com/artist/artist3" },
      },
    ];
    vi.mocked(mockClient.artists.get).mockResolvedValue(mockResponse as any);

    const result = await getSeveralArtists(mockClient, ["artist1", "invalid", "artist3"]);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].id).toBe("artist1");
      expect(result.value[1].id).toBe("artist3");
    }
  });
});

describe("createGetSeveralArtistsTool", () => {
  const mockClient = {
    artists: {
      get: vi.fn(),
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createGetSeveralArtistsTool(mockClient);
    expect(tool.name).toBe("get-several-artists");
    expect(tool.title).toBe("Get Several Artists");
    expect(tool.description).toContain("Get Spotify catalog information for several artists");
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful request", async () => {
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

  it("should handle errors", async () => {
    const tool = createGetSeveralArtistsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
