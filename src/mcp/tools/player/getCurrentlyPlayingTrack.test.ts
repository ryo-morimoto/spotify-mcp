import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetCurrentlyPlayingTrackTool } from "./getCurrentlyPlayingTrack.ts";

describe("get-currently-playing-track tool", () => {
  it("should return currently playing track", async () => {
    const mockCurrentlyPlaying = {
      is_playing: true,
      progress_ms: 30000,
      timestamp: 1640995200000,
      currently_playing_type: "track",
      item: {
        id: "track123",
        name: "Test Track",
        type: "track",
        uri: "spotify:track:track123",
        duration_ms: 180000,
        artists: [
          {
            id: "artist123",
            name: "Test Artist",
          },
        ],
        album: {
          id: "album123",
          name: "Test Album",
          images: [
            {
              url: "https://example.com/image.jpg",
              height: 300,
              width: 300,
            },
          ],
        },
      },
      context: {
        type: "album",
        href: "https://api.spotify.com/v1/albums/album123",
        uri: "spotify:album:album123",
        external_urls: {
          spotify: "https://open.spotify.com/album/album123",
        },
      },
      actions: {
        disallows: {
          resuming: false,
        },
      },
    };

    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn().mockResolvedValue(mockCurrentlyPlaying as any),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const data = JSON.parse((result.content[0] as any).text);
    expect(data.is_playing).toBe(true);
    expect(data.item.name).toBe("Test Track");
    expect(data.item.artists[0].name).toBe("Test Artist");
    expect(data.currently_playing_type).toBe("track");
  });

  it("should return message when no track is playing", async () => {
    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn().mockResolvedValue(null as any),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const data = JSON.parse((result.content[0] as any).text);
    expect(data.message).toBe("No track currently playing");
    expect(data.is_playing).toBe(false);
  });

  it("should return message when item is null", async () => {
    const mockResponse = {
      is_playing: false,
      progress_ms: 0,
      timestamp: 1640995200000,
      currently_playing_type: null,
      item: null,
      context: null,
      actions: null,
    };

    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn().mockResolvedValue(mockResponse as any),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const data = JSON.parse((result.content[0] as any).text);
    expect(data.message).toBe("No track currently playing");
    expect(data.is_playing).toBe(false);
  });

  it("should validate market parameter", async () => {
    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({ market: "USA" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Market must be a valid ISO 3166-1 alpha-2 country code",
    );
    expect(mockClient.player.getCurrentlyPlayingTrack).not.toHaveBeenCalled();
  });

  it("should validate additional types", async () => {
    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({ additionalTypes: ["invalid" as any] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Invalid additional type: invalid. Must be 'track' or 'episode'",
    );
    expect(mockClient.player.getCurrentlyPlayingTrack).not.toHaveBeenCalled();
  });

  it("should handle episode playback", async () => {
    const mockEpisodePlaying = {
      is_playing: true,
      progress_ms: 600000,
      timestamp: 1640995200000,
      currently_playing_type: "episode",
      item: {
        id: "episode123",
        name: "Test Episode",
        type: "episode",
        uri: "spotify:episode:episode123",
        duration_ms: 3600000,
        show: {
          id: "show123",
          name: "Test Show",
        },
      },
      context: null,
      actions: {
        disallows: {
          resuming: false,
        },
      },
    };

    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn().mockResolvedValue(mockEpisodePlaying as any),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({ additionalTypes: ["episode"] });

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const data = JSON.parse((result.content[0] as any).text);
    expect(data.is_playing).toBe(true);
    expect(data.item.type).toBe("episode");
    expect(data.item.show.name).toBe("Test Show");
    expect(data.currently_playing_type).toBe("episode");
  });

  it("should handle API errors", async () => {
    const mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn().mockRejectedValue(new Error("API request failed")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetCurrentlyPlayingTrackTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get currently playing track: API request failed",
    );
  });
});
