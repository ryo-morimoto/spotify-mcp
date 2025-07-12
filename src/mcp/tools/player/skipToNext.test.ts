import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSkipToNextTool } from "./skipToNext.ts";

describe("skip-to-next tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        skipToNext: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should skip to next track with no parameters", async () => {
    vi.mocked(mockClient.player.skipToNext).mockResolvedValue(undefined);

    const tool = createSkipToNextTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Skipped to next track successfully");
    expect(mockClient.player.skipToNext).toHaveBeenCalledWith("");
  });

  it("should skip to next track on specific device", async () => {
    vi.mocked(mockClient.player.skipToNext).mockResolvedValue(undefined);

    const tool = createSkipToNextTool(mockClient);
    const result = await tool.handler({ deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Skipped to next track successfully");
    expect(mockClient.player.skipToNext).toHaveBeenCalledWith("device123");
  });

  it("should validate empty device ID", async () => {
    const tool = createSkipToNextTool(mockClient);
    const result = await tool.handler({ deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.skipToNext).mockRejectedValue(new Error("API request failed"));

    const tool = createSkipToNextTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to skip to next track: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.skipToNext).mockRejectedValue(new Error("Network error"));

    const tool = createSkipToNextTool(mockClient);
    const result = await tool.handler({ deviceId: "device456" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to skip to next track: Network error",
    );
  });

  describe("tool metadata", () => {
    it("should have correct tool definition", () => {
      const tool = createSkipToNextTool(mockClient);

      expect(tool.name).toBe("skip_to_next");
      expect(tool.title).toBe("Skip To Next");
      expect(tool.description).toBe("Skips to next track in the user's queue");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.deviceId).toBeDefined();
    });
  });
});
