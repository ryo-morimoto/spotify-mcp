import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { startResumePlayback } from "./startResumePlayback.ts";

describe("startResumePlayback", () => {
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

    const result = await startResumePlayback(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback started successfully");
    }
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

    const result = await startResumePlayback(mockClient, "device123");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback started successfully");
    }
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

    const result = await startResumePlayback(
      mockClient,
      undefined,
      "spotify:album:1234567890abcdef",
    );

    expect(result.isOk()).toBe(true);
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
    const result = await startResumePlayback(mockClient, undefined, undefined, uris);

    expect(result.isOk()).toBe(true);
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

    const result = await startResumePlayback(
      mockClient,
      undefined,
      "spotify:playlist:abc123",
      undefined,
      { position: 5 },
    );

    expect(result.isOk()).toBe(true);
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

    const result = await startResumePlayback(
      mockClient,
      undefined,
      undefined,
      undefined,
      undefined,
      30000,
    );

    expect(result.isOk()).toBe(true);
    expect(mockClient.player.startResumePlayback).toHaveBeenCalledWith(
      "",
      undefined,
      undefined,
      undefined,
      30000,
    );
  });

  it("should validate empty device ID", async () => {
    const result = await startResumePlayback(mockClient, "");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device ID must not be empty if provided");
    }
  });

  it("should validate context URI format", async () => {
    const result = await startResumePlayback(mockClient, undefined, "invalid:uri");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Invalid context URI format");
    }
  });

  it("should validate URIs format", async () => {
    const result = await startResumePlayback(mockClient, undefined, undefined, [
      "spotify:track:abc123",
      "invalid:uri",
    ]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Invalid URI format: invalid:uri");
    }
  });

  it("should validate empty URIs array", async () => {
    const result = await startResumePlayback(mockClient, undefined, undefined, []);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("URIs array must not be empty if provided");
    }
  });

  it("should prevent both context_uri and uris", async () => {
    const result = await startResumePlayback(mockClient, undefined, "spotify:album:abc123", [
      "spotify:track:def456",
    ]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Cannot provide both context_uri and uris");
    }
  });

  it("should validate offset with both position and uri", async () => {
    const result = await startResumePlayback(mockClient, undefined, undefined, undefined, {
      position: 5,
      uri: "spotify:track:abc123",
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Offset can only have either position or uri, not both");
    }
  });

  it("should validate negative offset position", async () => {
    const result = await startResumePlayback(mockClient, undefined, undefined, undefined, {
      position: -1,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Offset position must be non-negative");
    }
  });

  it("should validate negative position_ms", async () => {
    const result = await startResumePlayback(
      mockClient,
      undefined,
      undefined,
      undefined,
      undefined,
      -1000,
    );

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Position must be non-negative");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.startResumePlayback).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await startResumePlayback(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to start/resume playback: API request failed");
    }
  });
});
