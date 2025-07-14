import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetPlaylistTool } from "@mcp/tools/playlists/get.ts";
import { expectToolResult } from "../../../../test/helpers/assertions.ts";

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

  let mockSpotifyClient: SpotifyApi;
  let getPlaylistTool: ReturnType<typeof createGetPlaylistTool>;

  beforeEach(() => {
    mockSpotifyClient = {
      playlists: {
        getPlaylist: vi.fn(),
      },
    } as unknown as SpotifyApi;

    getPlaylistTool = createGetPlaylistTool(mockSpotifyClient);
  });

  describe("createGetPlaylistTool", () => {
    it("should create tool definition with correct properties", () => {
      expect(getPlaylistTool.name).toBe("get_playlist");
      expect(getPlaylistTool.title).toBe("Get Playlist");
      expect(getPlaylistTool.description).toBe("Get a single playlist by ID from Spotify");
      expect(getPlaylistTool.inputSchema).toBeDefined();
      expect(getPlaylistTool.handler).toBeInstanceOf(Function);
    });
  });

  describe("handler - success cases", () => {
    it("should return playlist when API call succeeds", async () => {
      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockResolvedValue(mockPlaylist as any);

      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("resource");

      const resource = result.content[0] as any;
      expect(resource.resource.uri).toBe("spotify:playlist:37i9dQZF1DXcBWIGoYBM5M");
      expect(resource.resource.mimeType).toBe("application/json");

      const parsedData = JSON.parse(resource.resource.text);
      expect(parsedData.id).toBe("37i9dQZF1DXcBWIGoYBM5M");
      expect(parsedData.name).toBe("Today's Top Hits");
      expect(parsedData.description).toBe("The most played tracks right now.");
      expect(parsedData.owner).toBe("Spotify");
      expect(parsedData.public).toBe(true);
      expect(parsedData.collaborative).toBe(false);
      expect(parsedData.total_tracks).toBe(50);
      expect(parsedData.external_url).toBe(
        "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
      );
      expect(parsedData.images).toHaveLength(1);
      expect(parsedData.images[0].url).toBe("https://i.scdn.co/image/ab67616d00001e02");
      expect(parsedData.images[0].height).toBe(300);
      expect(parsedData.images[0].width).toBe(300);

      expect(mockSpotifyClient.playlists.getPlaylist).toHaveBeenCalledWith(
        "37i9dQZF1DXcBWIGoYBM5M",
      );
    });

    it("should handle playlists with null public field", async () => {
      const mockPlaylistWithNullPublic = {
        ...mockPlaylist,
        public: null,
      };

      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockResolvedValue(
        mockPlaylistWithNullPublic as any,
      );

      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      expect(result.isError).toBeUndefined();
      const resource = result.content[0] as any;
      const parsedData = JSON.parse(resource.resource.text);
      expect(parsedData.public).toBe(null);
    });

    it("should handle playlists with null description", async () => {
      const mockPlaylistWithNullDescription = {
        ...mockPlaylist,
        description: null,
      };

      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockResolvedValue(
        mockPlaylistWithNullDescription as any,
      );

      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      expect(result.isError).toBeUndefined();
      const resource = result.content[0] as any;
      const parsedData = JSON.parse(resource.resource.text);
      expect(parsedData.description).toBe(null);
    });
  });

  describe("handler - error cases", () => {
    it("should return error when API call fails", async () => {
      const apiError = new Error("Invalid authentication token");
      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockRejectedValue(apiError);

      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent(
        "Error: Failed to get playlist: Invalid authentication token",
      );
    });

    it("should validate empty playlist ID", async () => {
      const result = await getPlaylistTool.handler({
        playlistId: "",
      });

      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent("Error: Playlist ID must not be empty");
      expect(mockSpotifyClient.playlists.getPlaylist).not.toHaveBeenCalled();
    });

    it("should handle API errors without message", async () => {
      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockRejectedValue("Some error");

      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent("Error: Failed to get playlist: Some error");
    });
  });
});
