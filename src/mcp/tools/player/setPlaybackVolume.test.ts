import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSetPlaybackVolumeTool } from "./setPlaybackVolume.ts";

describe("set-playback-volume tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        setPlaybackVolume: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should set volume to 0", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 0 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Volume set to 0% successfully");
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(0, undefined);
  });

  it("should set volume to 50", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 50 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Volume set to 50% successfully");
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(50, undefined);
  });

  it("should set volume to 100", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 100 });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Volume set to 100% successfully");
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(100, undefined);
  });

  it("should set volume on specific device", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockResolvedValue(undefined);

    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 75, deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Volume set to 75% successfully");
    expect(mockClient.player.setPlaybackVolume).toHaveBeenCalledWith(75, "device123");
  });

  it("should validate negative volume", async () => {
    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: -1 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Volume must be between 0 and 100");
  });

  it("should validate volume over 100", async () => {
    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 101 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Volume must be between 0 and 100");
  });

  it("should validate empty device ID", async () => {
    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 50, deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 50 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to set playback volume: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.setPlaybackVolume).mockRejectedValue(new Error("Network error"));

    const tool = createSetPlaybackVolumeTool(mockClient);
    const result = await tool.handler({ volumePercent: 80, deviceId: "device456" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to set playback volume: Network error",
    );
  });

  describe("tool metadata", () => {
    it("should have correct tool definition", () => {
      const tool = createSetPlaybackVolumeTool(mockClient);

      expect(tool.name).toBe("set_playback_volume");
      expect(tool.title).toBe("Set Playback Volume");
      expect(tool.description).toBe("Set the volume for the user's current playback device");
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.volumePercent).toBeDefined();
      expect(tool.inputSchema.deviceId).toBeDefined();
    });
  });
});
