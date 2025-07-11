import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getPlaylist } from "./getPlaylist.ts";

describe("getPlaylist", () => {
  const mockPlaylist = {
    id: "37i9dQZF1DXcBWIGoYBM5M",
    name: "Today's Top Hits",
    description: "The most played tracks right now.",
    owner: {
      id: "spotify",
      display_name: "Spotify",
      type: "user",
      uri: "spotify:user:spotify",
      href: "https://api.spotify.com/v1/users/spotify",
      external_urls: {
        spotify: "https://open.spotify.com/user/spotify",
      },
    },
    public: true,
    collaborative: false,
    tracks: {
      total: 50,
      href: "https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M/tracks",
      items: [],
    },
    images: [
      {
        url: "https://i.scdn.co/image/ab67616d00001e02",
        height: 300,
        width: 300,
      },
    ],
    type: "playlist",
    uri: "spotify:playlist:37i9dQZF1DXcBWIGoYBM5M",
    href: "https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M",
    external_urls: {
      spotify: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    },
    followers: {
      total: 32000000,
      href: null,
    },
    snapshot_id: "MTY5MDU2NzIwMCwwMDAwMDAwMGQ0MWQ4Y2Q5OGYwMGIyMDRlOTgwMDk5OGVjZjg0Mjdl",
  };

  it("should return playlist when API call succeeds", async () => {
    const mockClient = {
      playlists: {
        getPlaylist: vi.fn().mockResolvedValue(mockPlaylist),
      },
    } as unknown as SpotifyApi;

    const result = await getPlaylist(mockClient, "37i9dQZF1DXcBWIGoYBM5M");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const playlist = result.value;
      expect(playlist.id).toBe("37i9dQZF1DXcBWIGoYBM5M");
      expect(playlist.name).toBe("Today's Top Hits");
      expect(playlist.description).toBe("The most played tracks right now.");
      expect(playlist.owner).toBe("Spotify");
      expect(playlist.public).toBe(true);
      expect(playlist.collaborative).toBe(false);
      expect(playlist.total_tracks).toBe(50);
      expect(playlist.external_url).toBe(
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      );
      expect(playlist.images).toHaveLength(1);
      expect(playlist.images[0].url).toBe("https://i.scdn.co/image/ab67616d00001e02");
      expect(playlist.images[0].height).toBe(300);
      expect(playlist.images[0].width).toBe(300);
    }

    expect(mockClient.playlists.getPlaylist).toHaveBeenCalledWith("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("should handle playlists with null public field", async () => {
    const mockPlaylistWithNullPublic = {
      ...mockPlaylist,
      public: null,
    };

    const mockClient = {
      playlists: {
        getPlaylist: vi.fn().mockResolvedValue(mockPlaylistWithNullPublic),
      },
    } as unknown as SpotifyApi;

    const result = await getPlaylist(mockClient, "37i9dQZF1DXcBWIGoYBM5M");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.public).toBe(null);
    }
  });

  it("should handle playlists with null description", async () => {
    const mockPlaylistWithNullDescription = {
      ...mockPlaylist,
      description: null,
    };

    const mockClient = {
      playlists: {
        getPlaylist: vi.fn().mockResolvedValue(mockPlaylistWithNullDescription),
      },
    } as unknown as SpotifyApi;

    const result = await getPlaylist(mockClient, "37i9dQZF1DXcBWIGoYBM5M");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.description).toBe(null);
    }
  });

  it("should return error when API call fails", async () => {
    const mockClient = {
      playlists: {
        getPlaylist: vi.fn().mockRejectedValue(new Error("Playlist not found")),
      },
    } as unknown as SpotifyApi;

    const result = await getPlaylist(mockClient, "invalid-playlist-id");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get playlist: Playlist not found");
    }
  });

  it("should validate playlist ID format", async () => {
    const mockClient = {
      playlists: {
        getPlaylist: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const result = await getPlaylist(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Playlist ID must not be empty");
    }
    expect(mockClient.playlists.getPlaylist).not.toHaveBeenCalled();
  });

  it("should handle API errors without message", async () => {
    const mockClient = {
      playlists: {
        getPlaylist: vi.fn().mockRejectedValue("Some error"),
      },
    } as unknown as SpotifyApi;

    const result = await getPlaylist(mockClient, "37i9dQZF1DXcBWIGoYBM5M");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get playlist: Some error");
    }
  });
});
