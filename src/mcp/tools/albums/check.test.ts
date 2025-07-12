import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { checkSavedAlbums, createCheckSavedAlbumsTool } from "./check.ts";

describe("checkSavedAlbums", () => {
  const mockClient = {
    currentUser: {
      albums: {
        hasSavedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should check albums successfully", async () => {
    vi.mocked(mockClient.currentUser.albums.hasSavedAlbums).mockResolvedValue([true, false, true]);

    const result = await checkSavedAlbums(mockClient, ["album1", "album2", "album3"]);
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([true, false, true]);
    }
    expect(mockClient.currentUser.albums.hasSavedAlbums).toHaveBeenCalledWith([
      "album1",
      "album2",
      "album3",
    ]);
  });

  it("should validate empty array", async () => {
    const result = await checkSavedAlbums(mockClient, []);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("At least one album ID is required");
    }
  });

  it("should validate maximum 50 albums", async () => {
    const ids = Array(51).fill("album");
    const result = await checkSavedAlbums(mockClient, ids);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Maximum 50 album IDs allowed");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.currentUser.albums.hasSavedAlbums).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await checkSavedAlbums(mockClient, ["album1"]);
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toContain("Failed to check albums: API request failed");
    }
  });
});

describe("createCheckSavedAlbumsTool", () => {
  const mockClient = {
    currentUser: {
      albums: {
        hasSavedAlbums: vi.fn(),
      },
    },
  } as unknown as SpotifyApi;

  it("should create a tool with correct metadata", () => {
    const tool = createCheckSavedAlbumsTool(mockClient);
    expect(tool.name).toBe("check_saved_albums");
    expect(tool.title).toBe("Check if Albums are Saved");
    expect(tool.description).toContain(
      "Check if one or more albums are already saved in the current user's library",
    );
    expect(tool.inputSchema).toBeDefined();
  });

  it("should handle successful check", async () => {
    vi.mocked(mockClient.currentUser.albums.hasSavedAlbums).mockResolvedValue([true, false]);

    const tool = createCheckSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: ["album1", "album2"] });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const content = JSON.parse((result.content[0] as any).text);
    expect(content).toEqual([
      { id: "album1", saved: true },
      { id: "album2", saved: false },
    ]);
  });

  it("should handle errors", async () => {
    const tool = createCheckSavedAlbumsTool(mockClient);
    const result = await tool.handler({ ids: [] });

    expect(result.isError).toBe(true);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toContain("Error:");
  });
});
