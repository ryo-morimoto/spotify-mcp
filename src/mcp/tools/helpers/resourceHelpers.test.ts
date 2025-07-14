import { describe, it, expect } from "vitest";
import type { EmbeddedResource } from "@modelcontextprotocol/sdk/types.js";
import { createResourceResponse, createResourceUri } from "./resourceHelpers.ts";

describe("resourceHelpers", () => {
  describe("createResourceUri", () => {
    it("should create URI for single resource", () => {
      const uri = createResourceUri("track", "3n3Ppam7vgaVa1iaRUc9Lp");
      expect(uri).toBe("spotify:track:3n3Ppam7vgaVa1iaRUc9Lp");
    });

    it("should create URI for search", () => {
      const uri = createResourceUri("search:tracks", undefined, { q: "hello world" });
      expect(uri).toBe("spotify:search:tracks?q=hello%20world");
    });

    it("should create URI for related resource", () => {
      const uri = createResourceUri("artist", "12345", undefined, "top-tracks");
      expect(uri).toBe("spotify:artist:12345:top-tracks");
    });

    it("should create URI for player action", () => {
      const uri = createResourceUri("player", undefined, undefined, "playback-state");
      expect(uri).toBe("spotify:player:playback-state");
    });

    it("should handle multiple query parameters", () => {
      const uri = createResourceUri("search:albums", undefined, { q: "abbey road", limit: "10" });
      expect(uri).toBe("spotify:search:albums?q=abbey%20road&limit=10");
    });
  });

  describe("createResourceResponse", () => {
    it("should create resource response for single object", () => {
      const data = { id: "123", name: "Test Track" };
      const result = createResourceResponse("spotify:track:123", data);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("resource");

      const resource = result.content[0] as EmbeddedResource;
      expect(resource.resource.uri).toBe("spotify:track:123");
      expect(resource.resource.mimeType).toBe("application/json");
      expect(resource.resource.text).toBe(JSON.stringify(data, null, 2));
    });

    it("should create resource response for array", () => {
      const data = [
        { id: "1", name: "Track 1" },
        { id: "2", name: "Track 2" },
      ];
      const result = createResourceResponse("spotify:search:tracks?q=test", data);

      expect(result.content).toHaveLength(1);
      const resource = result.content[0] as EmbeddedResource;
      expect(resource.resource.text).toBe(JSON.stringify(data, null, 2));
    });

    it("should use custom mimeType if provided", () => {
      const data = { id: "123" };
      const result = createResourceResponse(
        "spotify:track:123",
        data,
        "application/vnd.spotify.track+json",
      );

      const resource = result.content[0] as EmbeddedResource;
      expect(resource.resource.mimeType).toBe("application/vnd.spotify.track+json");
    });

    it("should not have isError property for success", () => {
      const result = createResourceResponse("spotify:track:123", {});
      expect(result.isError).toBeUndefined();
    });
  });
});
