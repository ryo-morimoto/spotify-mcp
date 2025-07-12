import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createStartResumePlaybackTool } from "./startResumePlayback.ts";

describe("start-resume-playback tool", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        startResumePlayback: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should start playback with no parameters", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockResolvedValue(undefined);

    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback started successfully");
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "",
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it("should start playback on specific device", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockResolvedValue(undefined);

    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ deviceId: "device123" });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    const response = JSON.parse((result.content[0] as any).text);
    expect(response.message).toBe("Playback started successfully");
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "device123",
      undefined,
      undefined,
      undefined,
      undefined,
    );
  });

  it("should start playback with context URI", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockResolvedValue(undefined);

    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ contextUri: "spotify:album:1234567890abcdef" });

    expect(result.isError).toBeFalsy();
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "",
      "spotify:album:1234567890abcdef",
      undefined,
      undefined,
      undefined,
    );
  });

  it("should start playback with track URIs", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockResolvedValue(undefined);

    const uris = ["spotify:track:abc123", "spotify:track:def456"];
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ uris });

    expect(result.isError).toBeFalsy();
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "",
      undefined,
      uris,
      undefined,
      undefined,
    );
  });

  it("should start playback with offset position", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockResolvedValue(undefined);

    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({
      contextUri: "spotify:playlist:abc123",
      offset: { position: 5 },
    });

    expect(result.isError).toBeFalsy();
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "",
      "spotify:playlist:abc123",
      undefined,
      { position: 5 },
      undefined,
    );
  });

  it("should start playback with position in milliseconds", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockResolvedValue(undefined);

    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ positionMs: 30000 });

    expect(result.isError).toBeFalsy();
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "",
      undefined,
      undefined,
      undefined,
      30000,
    );
  });

  it("should validate empty device ID", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ deviceId: "" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Device ID must not be empty if provided");
  });

  it("should validate context URI format", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ contextUri: "invalid:uri" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Invalid context URI format");
  });

  it("should validate URIs format", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ uris: ["invalid:uri"] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Invalid URI format: invalid:uri");
  });

  it("should validate empty URIs array", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ uris: [] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: URIs array must not be empty if provided");
  });

  it("should prevent both context_uri and uris", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({
      contextUri: "spotify:album:abc123",
      uris: ["spotify:track:def456"],
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Cannot provide both context_uri and uris");
  });

  it("should validate offset with both position and uri", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({
      offset: { position: 5, uri: "spotify:track:abc123" },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Offset can only have either position or uri, not both",
    );
  });

  it("should validate negative offset position", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({
      offset: { position: -1 },
    });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Offset position must be non-negative");
  });

  it("should validate negative position_ms", async () => {
    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({ positionMs: -1000 });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe("Error: Position must be non-negative");
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockRejectedValue(
      new Error("API request failed"),
    );

    const tool = createStartResumePlaybackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to start/resume playback: API request failed",
    );
  });
});
