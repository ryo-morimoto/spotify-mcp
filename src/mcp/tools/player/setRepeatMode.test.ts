import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSetRepeatModeTool } from "./setRepeatMode.ts";

describe("set-repeat-mode tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        setRepeatMode: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should set repeat mode to track", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "track" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Repeat mode set to 'track' successfully");
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("track", undefined);
  });

  it("should set repeat mode to context", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "context" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Repeat mode set to 'context' successfully");
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("context", undefined);
  });

  it("should set repeat mode to off", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "off" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Repeat mode set to 'off' successfully");
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("off", undefined);
  });

  it("should set repeat mode on specific device", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockResolvedValue(undefined);

    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "track", deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Repeat mode set to 'track' successfully");
    expect(mockClient.player.setRepeatMode).toHaveBeenCalledWith("track", "device123");
  });

  it("should validate empty device ID", async () => {
    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "track", deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockRejectedValue(new Error("API request failed"));

    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "track" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to set repeat mode: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.setRepeatMode).mockRejectedValue(new Error("Network error"));

    const tool = createSetRepeatModeTool(mockClient);
    const result = await tool.handler({ state: "track" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Failed to set repeat mode: Network error");
  });
});
