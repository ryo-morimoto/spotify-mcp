import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getArtist } from "./getArtist.ts";

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

    const result = await getArtist(mockClient, "0OdUWJ0sBjDrqHygGUXeCF");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const artist = result.value;
      expect(artist.id).toBe("0OdUWJ0sBjDrqHygGUXeCF");
      expect(artist.name).toBe("Band of Horses");
      expect(artist.genres).toEqual(["indie rock", "modern rock", "stomp and holler"]);
      expect(artist.popularity).toBe(65);
      expect(artist.followers).toBe(1234567);
      expect(artist.external_url).toBe("https://open.spotify.com/artist/0OdUWJ0sBjDrqHygGUXeCF");
      expect(artist.images).toHaveLength(2);
      expect(artist.images[0]).toEqual({
        url: "https://i.scdn.co/image/0a74c",
        height: 640,
        width: 640,
      });
    }

    expect(mockClient.artists.get).toHaveBeenCalledWith("0OdUWJ0sBjDrqHygGUXeCF");
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      artists: {
        get: vi.fn().mockRejectedValue(new Error("Artist not found")),
      },
    } as unknown as SpotifyApi;

    const result = await getArtist(mockClient, "invalid-artist-id");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get artist: Artist not found");
    }
  });

  it("should validate artist ID format", async () => {
    const mockClient = {
      artists: {
        get: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getArtist(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Artist ID must not be empty");
    }
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

    const result = await getArtist(mockClient, "0OdUWJ0sBjDrqHygGUXeCF");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.images).toEqual([]);
    }
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

    const result = await getArtist(mockClient, "0OdUWJ0sBjDrqHygGUXeCF");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.genres).toEqual([]);
    }
  });
});
