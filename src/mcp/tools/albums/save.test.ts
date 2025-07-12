import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSaveAlbumsTool } from "./save.ts";

describe("save-albums tool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        saveAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should save albums successfully", async () => {
    vi.mocked(mockClient.currentUser.albums.saveAlbums).mockResolvedValue(undefined);

    const tool = createSaveAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1", "album2"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully saved 2 album(s) to library");
    expect(mockClient.currentUser.albums.saveAlbums).toHaveBeenCalledWith(["album1", "album2"]);
  });

  it("should validate empty array", async () => {
    const tool = createSaveAlbumsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one album ID is required");
  });

  it("should validate maximum 50 albums", async () => {
    const ids = Array(51).fill("album");
    const tool = createSaveAlbumsTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 50 album IDs allowed");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.saveAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createSaveAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to save albums: API request failed",
    );
  });

  describe("tool metadata", () => {
    it("should have correct tool definition", () => {
      const tool = createSaveAlbumsTool(mockClient);

      expect(tool.name).toBe("save_albums");
      expect(tool.title).toBe("Save Albums to Library");
      expect(tool.description).toBe("Save one or more albums to the current user's library");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.ids).toBeDefined();
    });
  });
});
