import { describe, expect, it, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createAddPlaylistCoverImageTool } from "./addCoverImage.ts";

describe("add-playlist-cover-image", () => {
  const mockClient = {
    playlists: {
      addCustomPlaylistCoverImage: vi.fn(),
    },
  } as unknown as SpotifyApi;

  const addPlaylistCoverImageTool = createAddPlaylistCoverImageTool(mockClient);

  it("should upload a custom playlist cover image", async () => {
    vi.mocked(mockClient.playlists.addCustomPlaylistCoverImage).mockResolvedValueOnce(undefined);

    const result = await addPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      imageBase64:
        "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwkHBgoJCAkLCwoMDxkQDw4ODx4WFxIZJCAmJSMgIyIoLTkwKCo2KyIjMkQyNjs9QEBAJjBGS0U+Sjk/QD3/2wBDAQsLCw8NDx0QEB09KSMpPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT3/wAARCAAgACADASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAUGBAMH/8QAJRABAAIBAwQBBQAAAAAAAAAAAAECAwQREgUhMUFRBhQyYZH/xAAWAQEBAQAAAAAAAAAAAAAAAAADAgT/xAAYEQEBAQEBAAAAAAAAAAAAAAABABECEv/aAAwDAQACEQMRAD8A9gAYXQh",
    });

    expect(result.isError).not.toBe(true);
    const response = JSON.parse((result.content[0] as any).text);

    expect(response.success).toBe(true);
    expect(response.message).toBe("Successfully uploaded playlist cover image");

    expect(mockClient.playlists.addCustomPlaylistCoverImage).toHaveBeenCalledWith(
      "37i9dQZF1DXcBWIGoYBM5M",
      "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwkHBgoJCAkLCwoMDxkQDw4ODx4WFxIZJCAmJSMgIyIoLTkwKCo2KyIjMkQyNjs9QEBAJjBGS0U+Sjk/QD3/2wBDAQsLCw8NDx0QEB09KSMpPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT3/wAARCAAgACADASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAUGBAMH/8QAJRABAAIBAwQBBQAAAAAAAAAAAAECAwQREgUhMUFRBhQyYZH/xAAWAQEBAQAAAAAAAAAAAAAAAAADAgT/xAAYEQEBAQEBAAAAAAAAAAAAAAABABECEv/aAAwDAQACEQMRAD8A9gAYXQh",
    );
  });

  it("should handle empty playlist ID", async () => {
    const result = await addPlaylistCoverImageTool.handler({
      playlistId: "",
      imageBase64: "base64data",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Playlist ID must not be empty");
  });

  it("should handle empty image data", async () => {
    const result = await addPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      imageBase64: "",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Image data must not be empty");
  });

  it("should handle invalid base64 data", async () => {
    const result = await addPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      imageBase64: "not-valid-base64!!!",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Invalid base64 image data");
  });

  it("should handle image size too large", async () => {
    // Create a base64 string that's larger than 256KB when decoded
    // Base64 encoding increases size by ~33%, so we need ~192KB of actual data
    const largeBase64 = "A".repeat(350000); // ~350KB of base64 data

    const result = await addPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      imageBase64: largeBase64,
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain("Image size must not exceed 256KB");
  });

  it("should handle API error", async () => {
    vi.mocked(mockClient.playlists.addCustomPlaylistCoverImage).mockRejectedValueOnce(
      new Error("User does not own this playlist"),
    );

    const result = await addPlaylistCoverImageTool.handler({
      playlistId: "37i9dQZF1DXcBWIGoYBM5M",
      imageBase64:
        "/9j/4AAQSkZJRgABAQEAAAAAAAD/2wBDAAoHBwkHBgoJCAkLCwoMDxkQDw4ODx4WFxIZJCAmJSMgIyIoLTkwKCo2KyIjMkQyNjs9QEBAJjBGS0U+Sjk/QD3/2wBDAQsLCw8NDx0QEB09KSMpPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT3/wAARCAAgACADASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAUGBAMH/8QAJRABAAIBAwQBBQAAAAAAAAAAAAECAwQREgUhMUFRBhQyYZH/xAAWAQEBAQAAAAAAAAAAAAAAAAADAgT/xAAYEQEBAQEBAAAAAAAAAAAAAAABABECEv/aAAwDAQACEQMRAD8A9gAYXQh",
    });

    expect(result.isError).toBe(true);
    expect((result.content[0] as any).text).toContain(
      "Failed to upload playlist cover image: User does not own this playlist",
    );
  });
});
