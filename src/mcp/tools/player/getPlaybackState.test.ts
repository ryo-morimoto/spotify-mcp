import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getPlaybackState } from "./getPlaybackState.ts";

describe("getPlaybackState", () => {
  let mockClient: SpotifyApi;

  beforeEach(() => {
    mockClient = {
      player: {
        getPlaybackState: vi.fn(),
      },
    } as unknown as SpotifyApi;
  });

  it("should return playback state when playback is active", async () => {
    const mockPlaybackState = {
      is_playing: true,
      shuffle_state: false,
      repeat_state: "off",
      timestamp: 1640995200000,
      progress_ms: 30000,
      device: {
        id: "device123",
        name: "My Device",
        type: "Computer",
        is_active: true,
        is_private_session: false,
        is_restricted: false,
        volume_percent: 50,
      },
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
      currently_playing_type: "track",
      actions: {
        disallows: {
          resuming: false,
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
    };

    vi.mocked(mockClient.player.getPlaybackState).mockResolvedValue(mockPlaybackState as any);

    const result = await getPlaybackState(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.is_playing).toBe(true);
      expect(result.value.device.name).toBe("My Device");
      expect(result.value.item.name).toBe("Test Track");
      expect(result.value.currently_playing_type).toBe("track");
    }
  });

  it("should return message when no playback is active", async () => {
    vi.mocked(mockClient.player.getPlaybackState).mockResolvedValue(null as any);

    const result = await getPlaybackState(mockClient);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.message).toBe("No active playback found");
      expect(result.value.is_playing).toBe(false);
    }
  });

  it("should validate market parameter", async () => {
    const result = await getPlaybackState(mockClient, "USA");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Market must be a valid ISO 3166-1 alpha-2 country code");
    }
  });

  it("should validate additional types", async () => {
    const result = await getPlaybackState(mockClient, undefined, ["invalid"]);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Invalid additional type: invalid. Must be 'track' or 'episode'");
    }
  });

  it("should handle episode playback", async () => {
    const mockEpisodePlayback = {
      is_playing: true,
      shuffle_state: false,
      repeat_state: "off",
      timestamp: 1640995200000,
      progress_ms: 30000,
      device: {
        id: "device123",
        name: "My Device",
        type: "Computer",
        is_active: true,
        is_private_session: false,
        is_restricted: false,
        volume_percent: 50,
      },
      item: {
        id: "episode123",
        name: "Test Episode",
        type: "episode",
        uri: "spotify:episode:episode123",
        duration_ms: 3600000,
        audio_preview_url: "https://example.com/preview.mp3",
        description: "Test Episode Description",
        html_description: "<p>Test Episode Description</p>",
        explicit: false,
        external_urls: {
          spotify: "https://open.spotify.com/episode/episode123",
        },
        href: "https://api.spotify.com/v1/episodes/episode123",
        images: [],
        is_externally_hosted: false,
        is_playable: true,
        language: "en",
        languages: ["en"],
        release_date: "2024-01-01",
        release_date_precision: "day",
        resume_point: {
          fully_played: false,
          resume_position_ms: 0,
        },
        show: {
          id: "show123",
          name: "Test Show",
          type: "show",
          media_type: "audio",
          uri: "spotify:show:show123",
          available_markets: ["US"],
          explicit: false,
          html_description: "Test Show Description",
          description: "Test Show Description",
          images: [],
          is_externally_hosted: false,
          languages: ["en"],
          publisher: "Test Publisher",
          total_episodes: 100,
          external_urls: {
            spotify: "https://open.spotify.com/show/show123",
          },
          href: "https://api.spotify.com/v1/shows/show123",
        },
      },
      currently_playing_type: "episode",
      actions: {
        disallows: {
          resuming: false,
        },
      },
      context: null,
    };

    vi.mocked(mockClient.player.getPlaybackState).mockResolvedValue(mockEpisodePlayback as any);

    const result = await getPlaybackState(mockClient, undefined, ["episode"]);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.is_playing).toBe(true);
      expect(result.value.item.type).toBe("episode");
      expect(result.value.item.show.name).toBe("Test Show");
      expect(result.value.currently_playing_type).toBe("episode");
    }
  });

  it("should handle API errors", async () => {
    vi.mocked(mockClient.player.getPlaybackState).mockRejectedValue(
      new Error("API request failed"),
    );

    const result = await getPlaybackState(mockClient);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe("Failed to get playback state: API request failed");
    }
  });
});
