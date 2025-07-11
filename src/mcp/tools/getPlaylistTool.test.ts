import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetPlaylistTool } from "./getPlaylistTool.ts";
import { expectToolResult } from "../../../test/helpers/assertions.ts";

describe("getPlaylistTool", () => {
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
    it("ツール定義が正しく作成される", () => {
      expect(getPlaylistTool.name).toBe("get-playlist");
      expect(getPlaylistTool.title).toBe("Get Playlist");
      expect(getPlaylistTool.description).toBe("Get a single playlist by ID from Spotify");
      expect(getPlaylistTool.inputSchema).toBeDefined();
      expect(getPlaylistTool.handler).toBeInstanceOf(Function);
    });
  });

  describe("handler - エラーハンドリング", () => {
    it("Spotify APIがエラーを返した場合はエラーレスポンスを返す", async () => {
      // Arrange
      const apiError = new Error("Invalid authentication token");
      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockRejectedValue(apiError);

      // Act
      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      // Assert
      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent(
        "Error: Failed to get playlist: Invalid authentication token",
      );
    });

    it("空のプレイリストIDでエラーハンドリングが機能する", async () => {
      // Act
      const result = await getPlaylistTool.handler({
        playlistId: "",
      });

      // Assert
      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent("Error: Playlist ID must not be empty");
    });
  });

  describe("handler - 正常系（参考）", () => {
    it("正常にプレイリスト情報を返す", async () => {
      // Arrange
      const mockPlaylistResponse = {
        id: "37i9dQZF1DXcBWIGoYBM5M",
        name: "Today's Top Hits",
        description: "The most played tracks right now.",
        owner: {
          id: "spotify",
          display_name: "Spotify",
        },
        public: true,
        collaborative: false,
        tracks: {
          total: 50,
        },
        external_urls: {
          spotify: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        },
        images: [
          {
            url: "https://i.scdn.co/image/ab67616d00001e02",
            height: 300,
            width: 300,
          },
        ],
      };
      vi.mocked(mockSpotifyClient.playlists.getPlaylist).mockResolvedValue(
        mockPlaylistResponse as any,
      );

      // Act
      const result = await getPlaylistTool.handler({
        playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      });

      // Assert
      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");
      const parsedData = JSON.parse((result.content[0] as any).text);
      expect(parsedData.id).toBe("37i9dQZF1DXcBWIGoYBM5M");
      expect(parsedData.name).toBe("Today's Top Hits");
      expect(parsedData.description).toBe("The most played tracks right now.");
      expect(parsedData.owner).toBe("Spotify");
      expect(parsedData.public).toBe(true);
      expect(parsedData.collaborative).toBe(false);
      expect(parsedData.total_tracks).toBe(50);
    });
  });
});
