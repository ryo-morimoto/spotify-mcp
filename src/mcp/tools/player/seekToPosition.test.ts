import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSeekToPositionTool } from "@mcp/tools/player/seekToPosition.ts";

describe("seek-to-position tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        seekToPosition: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should seek to position with only position_ms", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockResolvedValue(undefined);

    const tool = createSeekToPositionTool(mockClient);
    const result = await tool.handler({ positionMs: 30000 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Seeked to position 30000ms successfully");
    expect(mockClient.player.seekToPosition).toHaveBeenCalledWith(30000, undefined);
  });

  it("should seek to position on specific device", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockResolvedValue(undefined);

    const tool = createSeekToPositionTool(mockClient);
    const result = await tool.handler({ positionMs: 45000, deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Seeked to position 45000ms successfully");
    expect(mockClient.player.seekToPosition).toHaveBeenCalledWith(45000, "device123");
  });

  it("should validate negative position", async () => {
    const tool = createSeekToPositionTool(mockClient);
    const result = await tool.handler({ positionMs: -1000 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Position must be non-negative");
  });

  it("should validate empty device ID", async () => {
    const tool = createSeekToPositionTool(mockClient);
    const result = await tool.handler({ positionMs: 5000, deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockRejectedValue(new Error("API request failed"));

    const tool = createSeekToPositionTool(mockClient);
    const result = await tool.handler({ positionMs: 10000 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to seek to position: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.seekToPosition).mockRejectedValue(new Error("Network error"));

    const tool = createSeekToPositionTool(mockClient);
    const result = await tool.handler({ positionMs: 15000, deviceId: "device456" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to seek to position: Network error",
    );
  });
});
