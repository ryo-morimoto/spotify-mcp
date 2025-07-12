import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSkipToPreviousTool } from "./skipToPrevious.ts";

describe("skip-to-previous tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        skipToPrevious: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should skip to previous track with no parameters", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockResolvedValue(undefined);

    const tool = createSkipToPreviousTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Skipped to previous track successfully");
    expect(mockClient.player.skipToPrevious).toHaveBeenCalledWith("");
  });

  it("should skip to previous track on specific device", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockResolvedValue(undefined);

    const tool = createSkipToPreviousTool(mockClient);
    const result = await tool.handler({ deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Skipped to previous track successfully");
    expect(mockClient.player.skipToPrevious).toHaveBeenCalledWith("device123");
  });

  it("should validate empty device ID", async () => {
    const tool = createSkipToPreviousTool(mockClient);
    const result = await tool.handler({ deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockRejectedValue(new Error("API request failed"));

    const tool = createSkipToPreviousTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to skip to previous track: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.skipToPrevious).mockRejectedValue(new Error("Network error"));

    const tool = createSkipToPreviousTool(mockClient);
    const result = await tool.handler({ deviceId: "device456" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to skip to previous track: Network error",
    );
  });
});
