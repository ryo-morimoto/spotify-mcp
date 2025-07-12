import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getCurrentlyPlayingTrack } from "./getCurrentlyPlayingTrack.ts";

describe("getCurrentlyPlayingTrack", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        getCurrentlyPlayingTrack: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

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

    vi.mocked(mockClient.player.getCurrentlyPlayingTrack).mockResolvedValue(
      mockCurrentlyPlaying as any,
    );

    const result = await getCurrentlyPlayingTrack(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.is_playing).toBe(true);
      expect(result.value.item.name).toBe("Test Track");
      expect(result.value.item.artists[0].name).toBe("Test Artist");
      expect(result.value.currently_playing_type).toBe("track");
    }
  });

  it("should return message when no track is playing", async () => {
    vi.mocked(mockClient.player.getCurrentlyPlayingTrack).mockResolvedValue(null as any);

    const result = await getCurrentlyPlayingTrack(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("No track currently playing");
      expect(result.value.is_playing).toBe(false);
    }
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

    vi.mocked(mockClient.player.getCurrentlyPlayingTrack).mockResolvedValue(mockResponse as any);

    const result = await getCurrentlyPlayingTrack(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("No track currently playing");
      expect(result.value.is_playing).toBe(false);
    }
  });

  it("should validate market parameter", async () => {
    const result = await getCurrentlyPlayingTrack(mockClient, "USA");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  });

  it("should validate additional types", async () => {
    const result = await getCurrentlyPlayingTrack(mockClient, undefined, ["invalid"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Invalid additional type: invalid. Must be 'track' or 'episode'");
    }
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

    vi.mocked(mockClient.player.getCurrentlyPlayingTrack).mockResolvedValue(
      mockEpisodePlaying as any,
    );

    const result = await getCurrentlyPlayingTrack(mockClient, undefined, ["episode"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.is_playing).toBe(true);
      expect(result.value.item.type).toBe("episode");
      expect(result.value.item.show.name).toBe("Test Show");
      expect(result.value.currently_playing_type).toBe("episode");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getCurrentlyPlayingTrack).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await getCurrentlyPlayingTrack(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get currently playing track: API request failed");
    }
  });
});
