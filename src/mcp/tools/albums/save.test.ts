import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { saveAlbums, createSaveAlbumsTool } from "./save.ts";

describe("saveAlbums", () => {
  const mockClient = {
    currentUser: {
      albums: {
        saveAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should save albums successfully", async () => {
    vi.mocked(mockClient.currentUser.albums.saveAlbums).mockResolvedValue(undefined);

    const result = await saveAlbums(mockClient, ["album1", "album2"]);
    expect(result.isOk()).toBe(true);
    expect(mockClient.currentUser.albums.saveAlbums).toHaveBeenCalledWith(["album1", "album2"]);
  });

  it("should validate empty array", async () => {
    const result = await saveAlbums(mockClient, []);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("At least one album ID is required");
    }
  });

  it("should validate maximum 50 albums", async () => {
    const ids = Array(51).fill("album");
    const result = await saveAlbums(mockClient, ids);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 50 album IDs allowed");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.saveAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await saveAlbums(mockClient, ["album1"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to save albums: API request failed");
    }
  });
});

describe("createSaveAlbumsTool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        saveAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createSaveAlbumsTool(mockClient);
    expect(tool.name).toBe("save-albums");
    expect(tool.title).toBe("Save Albums to Library");
    expect(tool.description).toContain("Save one or more albums to the current user's library");
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful save", async () => {
    vi.mocked(mockClient.currentUser.albums.saveAlbums).mockResolvedValue(undefined);

    const tool = createSaveAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1", "album2"] });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Successfully saved 2 album(s) to library");
  });

  it("should handle errors", async () => {
    const tool = createSaveAlbumsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
