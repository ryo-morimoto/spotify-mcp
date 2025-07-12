import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { transferPlayback } from "./transferPlayback.ts";

describe("transferPlayback", () => {
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

    const result = await transferPlayback(mockClient, ["device123"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback transferred successfully");
    }
    expect(mockClient.player.transferPlayback).toHaveBeenCalledWith(["device123"], undefined);
  });

  it("should transfer playback to a device and start playing", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockResolvedValue(undefined);

    const result = await transferPlayback(mockClient, ["device456"], true);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback transferred and started successfully");
    }
    expect(mockClient.player.transferPlayback).toHaveBeenCalledWith(["device456"], true);
  });

  it("should transfer playback to a device without starting", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockResolvedValue(undefined);

    const result = await transferPlayback(mockClient, ["device789"], false);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("Playback transferred successfully");
    }
    expect(mockClient.player.transferPlayback).toHaveBeenCalledWith(["device789"], false);
  });

  it("should validate empty device IDs array", async () => {
    const result = await transferPlayback(mockClient, []);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("At least one device ID must be provided");
    }
  });

  it("should validate empty device ID string", async () => {
    const result = await transferPlayback(mockClient, [""]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device IDs must not be empty");
    }
  });

  it("should validate whitespace-only device ID", async () => {
    const result = await transferPlayback(mockClient, ["  "]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Device IDs must not be empty");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await transferPlayback(mockClient, ["device123"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to transfer playback: API request failed");
    }
  });

  it("should handle network errors", async () => {
    vi.mocked(mockClient.player.transferPlayback).mockRejectedValue(new Error("Network error"));

    const result = await transferPlayback(mockClient, ["device456"], true);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to transfer playback: Network error");
    }
  });
});
