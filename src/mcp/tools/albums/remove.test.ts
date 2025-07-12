import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { removeSavedAlbums, createRemoveSavedAlbumsTool } from "./remove.ts";

describe("removeSavedAlbums", () => {
  const mockClient = {
    currentUser: {
      albums: {
        removeSavedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should remove albums successfully", async () => {
    vi.mocked(mockClient.currentUser.albums.removeSavedAlbums).mockResolvedValue(undefined);

    const result = await removeSavedAlbums(mockClient, ["album1", "album2"]);
    expect(result.isOk()).toBe(true);
    expect(mockClient.currentUser.albums.removeSavedAlbums).toHaveBeenCalledWith([
      "album1",
      "album2",
    ]);
  });

  it("should validate empty array", async () => {
    const result = await removeSavedAlbums(mockClient, []);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("At least one album ID is required");
    }
  });

  it("should validate maximum 50 albums", async () => {
    const ids = Array(51).fill("album");
    const result = await removeSavedAlbums(mockClient, ids);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 50 album IDs allowed");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.removeSavedAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await removeSavedAlbums(mockClient, ["album1"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to remove albums: API request failed");
    }
  });
});

describe("createRemoveSavedAlbumsTool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        removeSavedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createRemoveSavedAlbumsTool(mockClient);
    expect(tool.name).toBe("remove_saved_albums");
    expect(tool.title).toBe("Remove Albums from Library");
    expect(tool.description).toContain("Remove one or more albums from the current user's library");
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful removal", async () => {
    vi.mocked(mockClient.currentUser.albums.removeSavedAlbums).mockResolvedValue(undefined);

    const tool = createRemoveSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1", "album2"] });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully removed 2 album(s) from library");
  });

  it("should handle errors", async () => {
    const tool = createRemoveSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
