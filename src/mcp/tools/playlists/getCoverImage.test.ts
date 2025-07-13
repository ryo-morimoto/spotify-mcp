import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetPlaylistCoverImageTool } from "./getCoverImage.ts";

describe("get-playlist-cover-image", () => {
  const mockClient = {
    playlists: {
      getPlaylistCoverImage: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const getPlaylistCoverImageTool = createGetPlaylistCoverImageTool(mockClient);

  it("should get playlist cover images", async () => {
    const mockImages = [
      {
        url: "https://image.spotify.com/image/640",
        height: 640,
        width: 640,
      },
      {
        url: "https://image.spotify.com/image/300",
        height: 300,
        width: 300,
      },
      {
        url: "https://image.spotify.com/image/60",
        height: 60,
        width: 60,
      },
    ];

    vi.mocked(mockClient.playlists.getPlaylistCoverImage).mockResolvedValueOnce(mockImages as any);

    const result = await getPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.images).toHaveLength(3);
    expect(response.images[0]).toEqual({
      url: "https://image.spotify.com/image/640",
      height: 640,
      width: 640,
    });
    expect(response.images[1]).toEqual({
      url: "https://image.spotify.com/image/300",
      height: 300,
      width: 300,
    });
    expect(response.images[2]).toEqual({
      url: "https://image.spotify.com/image/60",
      height: 60,
      width: 60,
    });

    expect(mockClient.playlists.getPlaylistCoverImage).toHaveBeenCalledWith(
      "37i9dQZF1DXcBWIGoYBM5M",
    );
  });

  it("should handle playlist with no cover images", async () => {
    vi.mocked(mockClient.playlists.getPlaylistCoverImage).mockResolvedValueOnce([]);

    const result = await getPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.images).toEqual([]);
  });

  it("should handle playlist with null dimensions", async () => {
    const mockImages = [
      {
        url: "https://mosaic.scdn.co/640/image1",
        height: null,
        width: null,
      },
    ];

    vi.mocked(mockClient.playlists.getPlaylistCoverImage).mockResolvedValueOnce(mockImages as any);

    const result = await getPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.images[0]).toEqual({
      url: "https://mosaic.scdn.co/640/image1",
      height: null,
      width: null,
    });
  });

  it("should handle empty playlist ID", async () => {
    const result = await getPlaylistCoverImageTool.handler({
      playlistId: "",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.getPlaylistCoverImage).mockRejectedValueOnce(
      new Error("Playlist not found"),
    );

    const result = await getPlaylistCoverImageTool.handler({
      playlistId: "invalid-playlist-id",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to get playlist cover image: Playlist not found",
    );
  });
});
