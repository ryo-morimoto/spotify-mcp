import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createTransferPlaybackTool } from "./transferPlayback.ts";

describe("transfer-playback tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        transferPlayback: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should transfer playback to a device", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockResolvedValue(undefined);

    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: ["device123"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback transferred successfully");
    expect(mockClient.player.transferPlayback).toHaveBeenCalledWith(["device123"], undefined);
  });

  it("should transfer playback to a device and start playing", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockResolvedValue(undefined);

    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: ["device456"], play: true });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback transferred and started successfully");
    expect(mockClient.player.transferPlayback).toHaveBeenCalledWith(["device456"], true);
  });

  it("should transfer playback to a device without starting", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockResolvedValue(undefined);

    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: ["device789"], play: false });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback transferred successfully");
    expect(mockClient.player.transferPlayback).toHaveBeenCalledWith(["device789"], false);
  });

  it("should validate empty device IDs array", async () => {
    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: [] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: At least one device ID must be provided");
  });

  it("should validate empty device ID string", async () => {
    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: [""] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device IDs must not be empty");
  });

  it("should validate whitespace-only device ID", async () => {
    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: ["  "] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device IDs must not be empty");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: ["device123"] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to transfer playback: API request failed",
    );
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockRejectedValue(new Error("Network error"));

    const tool = createTransferPlaybackTool(mockClient);
    const result = await tool.handler({ deviceIds: ["device123"], play: true });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to transfer playback: Network error",
    );
  });
});
