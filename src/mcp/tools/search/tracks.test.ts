import { describe, it, expect, beforeEach, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "./tracks.ts";
import { expectToolResult } from "../../../../test/helpers/assertions.ts";

describe("searchTracks", () => {
  let mockSpotifyClient: SpotifyApi;
  let searchTracksTool: ReturnType<typeof createSearchTracksTool>;

  beforeEach(() => {
    mockSpotifyClient = {
      search: vi.fn(),
    } as unknown as SpotifyApi;

    searchTracksTool = createSearchTracksTool(mockSpotifyClient);
  });

  describe("createSearchTracksTool", () => {
    it("ツール定義が正しく作成される", () => {
      expect(searchTracksTool.name).toBe("search-tracks");
      expect(searchTracksTool.title).toBe("Search Tracks");
      expect(searchTracksTool.description).toBe("Search for tracks on Spotify");
      expect(searchTracksTool.inputSchema).toBeDefined();
      expect(searchTracksTool.handler).toBeInstanceOf(Function);
    });
  });

  describe("handler - エラーハンドリング", () => {
    it("Spotify APIがエラーを返した場合はエラーレスポンスを返す", async () => {
      // Arrange
      const apiError = new Error("Invalid authentication token");
      vi.mocked(mockSpotifyClient.search).mockRejectedValue(apiError);

      // Act
      const result = await searchTracksTool.handler({
        query: "test query",
        limit: 10,
      });

      // Assert
      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent(
        "Error searching tracks: Error: Invalid authentication token",
      );
    });

    it("ネットワークエラーが発生した場合はエラーレスポンスを返す", async () => {
      // Arrange
      const networkError = new Error("Network request failed");
      vi.mocked(mockSpotifyClient.search).mockRejectedValue(networkError);

      // Act
      const result = await searchTracksTool.handler({
        query: "artist:Radiohead",
        limit: 5,
      });

      // Assert
      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent(
        "Error searching tracks: Error: Network request failed",
      );
    });

    it("Spotify APIが予期しない形式のエラーを返した場合もエラーレスポンスを返す", async () => {
      // Arrange
      const unexpectedError = {
        status: 500,
        message: "Internal Server Error",
      };
      vi.mocked(mockSpotifyClient.search).mockRejectedValue(unexpectedError);

      // Act
      const result = await searchTracksTool.handler({
        query: "test",
        limit: 20,
      });

      // Assert
      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent("Error searching tracks: [object Object]");
    });

    it("検索結果の処理中にエラーが発生した場合もエラーレスポンスを返す", async () => {
      // Arrange
      // mapTrackToResultでエラーが発生するような不正なデータ
      const malformedResponse = {
        tracks: {
          items: [
            {
              id: "123",
              name: "Test Track",
              // artists が undefined でエラーになる
              artists: undefined,
              album: { name: "Test Album" },
              duration_ms: 180000,
              preview_url: null,
              external_urls: { spotify: "https://spotify.com/track/123" },
            },
          ],
        },
      };
      vi.mocked(mockSpotifyClient.search).mockResolvedValue(malformedResponse as any);

      // Act
      const result = await searchTracksTool.handler({
        query: "test",
        limit: 1,
      });

      // Assert
      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Error searching tracks:");
    });

    it("空の検索クエリでもエラーハンドリングが機能する", async () => {
      // Arrange
      const error = new Error("Query cannot be empty");
      vi.mocked(mockSpotifyClient.search).mockRejectedValue(error);

      // Act
      const result = await searchTracksTool.handler({
        query: "",
        limit: 10,
      });

      // Assert
      expect(result.isError).toBe(true);
      expectToolResult(result).toHaveTextContent(
        "Error searching tracks: Error: Query cannot be empty",
      );
    });
  });

  describe("handler - 正常系（参考）", () => {
    it("正常に検索結果を返す", async () => {
      // Arrange
      const mockSearchResponse = {
        tracks: {
          items: [
            {
              id: "1",
              name: "Test Track",
              artists: [{ name: "Test Artist" }],
              album: { name: "Test Album" },
              duration_ms: 180000,
              preview_url: "https://preview.url",
              external_urls: { spotify: "https://spotify.com/track/1" },
            },
          ],
        },
      };
      vi.mocked(mockSpotifyClient.search).mockResolvedValue(mockSearchResponse as any);

      // Act
      const result = await searchTracksTool.handler({
        query: "test",
        limit: 10,
      });

      // Assert
      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe("text");
      const parsedData = JSON.parse((result.content[0] as any).text);
      expect(parsedData[0].name).toBe("Test Track");
      expect(parsedData[0].artists).toBe("Test Artist");
      expect(parsedData[0].album).toBe("Test Album");
    });
  });
});
