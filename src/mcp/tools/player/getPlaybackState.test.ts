import { describe, it, expect, vi } from "vitest";
import type { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createGetPlaybackStateTool } from "@mcp/tools/player/getPlaybackState.ts";

describe("get-playback-state tool", () => {
  it("should return playback state when playback is active", async () => {
    const mockClient = {
      player: {
        getPlaybackState: vi.fn(),
      },
    } as unknown as SpotifyApi;

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

    const tool = createGetPlaybackStateTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:player:state");
    expect(resource.resource.mimeType).toBe("application/json");

    const response = JSON.parse(resource.resource.text);
    expect(response.is_playing).toBe(true);
    expect(response.device.name).toBe("My Device");
    expect(response.item.name).toBe("Test Track");
    expect(response.currently_playing_type).toBe("track");
  });

  it("should return message when no playback is active", async () => {
    const mockClient = {
      player: {
        getPlaybackState: vi.fn().mockResolvedValue(null as any),
      },
    } as unknown as SpotifyApi;

    const tool = createGetPlaybackStateTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:player:state");
    expect(resource.resource.mimeType).toBe("application/json");

    const response = JSON.parse(resource.resource.text);
    expect(response.message).toBe("No active playback found");
  });

  it("should validate market parameter", async () => {
    const mockClient = {
      player: {
        getPlaybackState: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetPlaybackStateTool(mockClient);
    const result = await tool.handler({ market: "USA" });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Market must be a valid ISO 3166-1 alpha-2 country code",
    );
  });

  it("should validate additional types", async () => {
    const mockClient = {
      player: {
        getPlaybackState: vi.fn(),
      },
    } as unknown as SpotifyApi;

    const tool = createGetPlaybackStateTool(mockClient);
    const result = await tool.handler({ additionalTypes: ["invalid" as any] });

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Invalid additional type: invalid. Must be 'track' or 'episode'",
    );
  });

  it("should handle episode playback", async () => {
    const mockClient = {
      player: {
        getPlaybackState: vi.fn(),
      },
    } as unknown as SpotifyApi;

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

    const tool = createGetPlaybackStateTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBeFalsy();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("resource");

    const resource = result.content[0] as any;
    expect(resource.resource.uri).toBe("spotify:player:state");
    expect(resource.resource.mimeType).toBe("application/json");

    const response = JSON.parse(resource.resource.text);
    expect(response.is_playing).toBe(true);
    expect(response.item.type).toBe("episode");
    expect(response.item.show.name).toBe("Test Show");
    expect(response.currently_playing_type).toBe("episode");
  });

  it("should handle API errors", async () => {
    const mockClient = {
      player: {
        getPlaybackState: vi.fn().mockRejectedValue(new Error("API request failed")),
      },
    } as unknown as SpotifyApi;

    const tool = createGetPlaybackStateTool(mockClient);
    const result = await tool.handler({});

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect((result.content[0] as any).text).toBe(
      "Error: Failed to get playback state: API request failed",
    );
  });
});
