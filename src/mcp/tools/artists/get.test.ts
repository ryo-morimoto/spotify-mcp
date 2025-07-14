import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import type { EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";
import { createGetArtistTool } from "@mcp/tools/artists/get.ts";

describe("getArtist", () => {
  const mockArtist = {
    id: "0OdUWJ0sBjDrqHygGUXeCF",
    name: "Band of Horses",
    type: "artist",
    uri: "spotify:artist:0OdUWJ0sBjDrqHygGUXeCF",
    href: "https://api.spotify.com/v1/artists/0OdUWJ0sBjDrqHygGUXeCF",
    external_urls: {
      spotify: "https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF",
    },
    followers: {
      href: null,
      total: 1234567,
    },
    genres: ["indie rock", "modern rock", "stomp and holler"],
    images: [
      {
        url: "https://i.scdn.co/image/0a74c",
        height: 640,
        width: 640,
      },
      {
        url: "https://i.scdn.co/image/ac426c",
        height: 320,
        width: 320,
      },
    ],
    popularity: 65,
  };

  it("should return artist when API call succeeds", async () => {
    const mockClient = {
      artists: {
        get: vi.fn().mockResolvedValue(mockArtist),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBe(undefined);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resourceContent = result.content[0] as EmbeddedResource;
    expect(resourceContent.resource.uri).toBe("spotify:artist:0OdUWJ0sBjDrqHygGUXeCF");
    expect(resourceContent.resource.mimeType).toBe("application/json");

    const content = JSON.parse(resourceContent.resource.text as string);
    expect(content.id).toBe("0OdUWJ0sBjDrqHygGUXeCF");
    expect(content.name).toBe("Band of Horses");
    expect(content.genres).toEqual(["indie rock", "modern rock", "stomp and holler"]);
    expect(content.popularity).toBe(65);
    expect(content.followers).toBe(1234567);
    expect(content.external_url).toBe("https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF");
    expect(content.images).toHaveLength(2);
    expect(content.images[0]).toEqual({
      url: "https://i.scdn.co/image/0a74c",
      height: 640,
      width: 640,
    });

    expect(mockClient.artists.get).toHaveBeenCalledWith("0OdUWJ0sBjDrqHygGUXeCF");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      artists: {
        get: vi.fn().mockRejectedValue(new Error("Artist not found")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistTool(mockClient);
    const result = await tool.handler({ artistId: "invalid-artist-id" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to get artist: Artist not found");
  });

  it("should validate artist ID format", async () => {
    const mockClient = {
      artists: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistTool(mockClient);
    const result = await tool.handler({ artistId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Artist ID must not be empty");
    expect(mockClient.artists.get).not.toHaveBeenCalled();
  });

  it("should handle artist with no images", async () => {
    const mockArtistNoImages = {
      ...mockArtist,
      images: [],
    };

    const mockClient = {
      artists: {
        get: vi.fn().mockResolvedValue(mockArtistNoImages),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBe(undefined);
    const resourceContent = result.content[0] as EmbeddedResource;
    const content = JSON.parse(resourceContent.resource.text as string);
    expect(content.images).toEqual([]);
  });

  it("should handle artist with empty genres", async () => {
    const mockArtistNoGenres = {
      ...mockArtist,
      genres: [],
    };

    const mockClient = {
      artists: {
        get: vi.fn().mockResolvedValue(mockArtistNoGenres),
      },
    } as unknown as SpotifyApi;

    const tool = createGetArtistTool(mockClient);
    const result = await tool.handler({ artistId: "0OdUWJ0sBjDrqHygGUXeCF" });

    expect(result.isError).toBe(undefined);
    const resourceContent = result.content[0] as EmbeddedResource;
    const content = JSON.parse(resourceContent.resource.text as string);
    expect(content.genres).toEqual([]);
  });
});
