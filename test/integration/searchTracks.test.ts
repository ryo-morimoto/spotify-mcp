import { describe, test, expect } from "vitest";
import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { createSearchTracksTool } from "../../src/mcp/tools/search/tracks.ts";
import type { SpotifyTrackResult } from "../../src/types.ts";
import type { EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";

describe.skipIf(!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET)(
  "Spotify Track Search Integration",
  () => {
    const client = SpotifyApi.withClientCredentials(
      process.env.SPOTIFY_CLIENT_ID!,
      process.env.SPOTIFY_CLIENT_SECRET!,
    );
    const tool = createSearchTracksTool(client);

    test("楽曲検索が指定した件数以下の結果を返す", async () => {
      const result = await tool.handler({ query: "Shape of You", limit: 5 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("resource");

      const resource = result.content[0] as EmbeddedResource;
      const tracks: SpotifyTrackResult[] = JSON.parse(resource.resource.text as string);
      expect(tracks.length).toBeGreaterThan(0);
      expect(tracks.length).toBeLessThanOrEqual(5);
    });

    test("楽曲検索結果が必要な情報を含む", async () => {
      const result = await tool.handler({ query: "Yesterday Beatles", limit: 1 });

      expect(result.isError).toBeUndefined();
      const resource = result.content[0] as EmbeddedResource;
      const tracks: SpotifyTrackResult[] = JSON.parse(resource.resource.text as string);
      expect(tracks.length).toBeGreaterThan(0);

      const track = tracks[0];
      // 必要なフィールドが存在し、適切な型であることを確認
      expect(track.id).toBeTruthy();
      expect(track.name).toBeTruthy();
      expect(track.artists).toBeTruthy();
      expect(track.album).toBeTruthy();
      expect(track.duration_ms).toBeGreaterThan(0);
      expect(track.external_url).toMatch(/^https:\/\/open\.spotify\.com/);
    });

    test("ランダムな文字列で検索しても正常に動作する", async () => {
      const randomQuery = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const result = await tool.handler({
        query: randomQuery,
        limit: 10,
      });

      expect(result.isError).toBeUndefined();
      const resource = result.content[0] as EmbeddedResource;
      const tracks: SpotifyTrackResult[] = JSON.parse(resource.resource.text as string);
      // Spotifyは部分一致も返すので、完全に結果がないことを保証できない
      // 代わりに、エラーなく処理できることを確認
      expect(Array.isArray(tracks)).toBe(true);
    });

    test("日本語での検索が可能", async () => {
      const result = await tool.handler({ query: "千本桜", limit: 3 });

      expect(result.isError).toBeUndefined();
      const resource = result.content[0] as EmbeddedResource;
      const tracks: SpotifyTrackResult[] = JSON.parse(resource.resource.text as string);
      expect(tracks.length).toBeGreaterThan(0);
    });
  },
);
