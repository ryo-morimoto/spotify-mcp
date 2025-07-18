import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createTogglePlaybackShuffleTool } from "@mcp/tools/player/togglePlaybackShuffle.ts";

describe("toggle-playback-shuffle tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        togglePlaybackShuffle: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should enable shuffle", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockResolvedValue(undefined);

    const tool = createTogglePlaybackShuffleTool(mockClient);
    const result = await tool.handler({ state: true });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Shuffle enabled successfully");
    expect(mockClient.player.togglePlaybackShuffle).toHaveBeenCalledWith(true, undefined);
  });

  it("should disable shuffle", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockResolvedValue(undefined);

    const tool = createTogglePlaybackShuffleTool(mockClient);
    const result = await tool.handler({ state: false });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Shuffle disabled successfully");
    expect(mockClient.player.togglePlaybackShuffle).toHaveBeenCalledWith(false, undefined);
  });

  it("should toggle shuffle on specific device", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockResolvedValue(undefined);

    const tool = createTogglePlaybackShuffleTool(mockClient);
    const result = await tool.handler({ state: true, deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Shuffle enabled successfully");
    expect(mockClient.player.togglePlaybackShuffle).toHaveBeenCalledWith(true, "device123");
  });

  it("should validate empty device ID", async () => {
    const tool = createTogglePlaybackShuffleTool(mockClient);
    const result = await tool.handler({ state: true, deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createTogglePlaybackShuffleTool(mockClient);
    const result = await tool.handler({ state: true });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to toggle shuffle: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.togglePlaybackShuffle).mockRejectedValue(
      new Error("Network error"),
    );

    const tool = createTogglePlaybackShuffleTool(mockClient);
    const result = await tool.handler({ state: false });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to toggle shuffle: Network error");
  });
});
