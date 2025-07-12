import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createCheckSavedAlbumsTool } from "./check.ts";

describe("check-saved-albums tool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        hasSavedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should check albums successfully", async () => {
    vi.mocked(mockClient.currentUser.albums.hasSavedAlbums).mockResolvedValue([true, false, true]);

    const tool = createCheckSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1", "album2", "album3"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual([
      { id: "album1", saved: true },
      { id: "album2", saved: false },
      { id: "album3", saved: true },
    ]);

    expect(mockClient.currentUser.albums.hasSavedAlbums).toHaveBeenCalledWith([
      "album1",
      "album2",
      "album3",
    ]);
  });

  it("should validate empty array", async () => {
    const tool = createCheckSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one album ID is required");
  });

  it("should validate maximum 50 albums", async () => {
    const ids = Array(51).fill("album");
    const tool = createCheckSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 50 album IDs allowed");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.hasSavedAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createCheckSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to check albums: API request failed",
    );
  });

  describe("tool metadata", () => {
    it("should have correct tool definition", () => {
      const tool = createCheckSavedAlbumsTool(mockClient);

      expect(tool.name).toBe("check_saved_albums");
      expect(tool.title).toBe("Check if Albums are Saved");
      expect(tool.description).toBe(
        "Check if one or more albums are already saved in the current user's library",
      );
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.ids).toBeDefined();
    });
  });
});
