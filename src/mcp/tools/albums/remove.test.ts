import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createRemoveSavedAlbumsTool } from "@mcp/tools/albums/remove.ts";

describe("remove-saved-albums tool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        removeSavedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should remove albums successfully", async () => {
    vi.mocked(mockClient.currentUser.albums.removeSavedAlbums).mockResolvedValue(undefined);

    const tool = createRemoveSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1", "album2"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully removed 2 album(s) from library");
    expect(mockClient.currentUser.albums.removeSavedAlbums).toHaveBeenCalledWith([
      "album1",
      "album2",
    ]);
  });

  it("should validate empty array", async () => {
    const tool = createRemoveSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one album ID is required");
  });

  it("should validate maximum 50 albums", async () => {
    const ids = Array(51).fill("album");
    const tool = createRemoveSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Maximum 50 album IDs allowed");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.removeSavedAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createRemoveSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1"] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to remove albums: API request failed",
    );
  });
});
