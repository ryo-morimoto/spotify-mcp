import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createPausePlaybackTool } from "@mcp/tools/player/pausePlayback.ts";

describe("pause-playback tool", () => {
  it("should pause playback with no parameters", async () => {
    const mockClient = {
      player: {
        pausePlayback: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as SpotifyApi;

    const tool = createPausePlaybackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback paused successfully");
    expect(mockClient.player.pausePlayback).toHaveBeenCalledWith("");
  });

  it("should pause playback on specific device", async () => {
    const mockClient = {
      player: {
        pausePlayback: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as SpotifyApi;

    const tool = createPausePlaybackTool(mockClient);
    const result = await tool.handler({ deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback paused successfully");
    expect(mockClient.player.pausePlayback).toHaveBeenCalledWith("device123");
  });

  it("should validate empty device ID", async () => {
    const mockClient = {
      player: {
        pausePlayback: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createPausePlaybackTool(mockClient);
    const result = await tool.handler({ deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
    expect(mockClient.player.pausePlayback).not.toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    const mockClient = {
      player: {
        pausePlayback: vi.fn().mockRejectedValue(new Error("API request failed")),
      },
    } as unknown as SpotifyApi;

    const tool = createPausePlaybackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to pause playback: API request failed",
    );
  });

  it("should handle network errors", async () => {
    const mockClient = {
      player: {
        pausePlayback: vi.fn().mockRejectedValue(new Error("Network error")),
      },
    } as unknown as SpotifyApi;

    const tool = createPausePlaybackTool(mockClient);
    const result = await tool.handler({ deviceId: "device456" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to pause playback: Network error");
  });
});
