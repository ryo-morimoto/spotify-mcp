import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createGetArtistTopTracksTool } from "./getArtistTopTracksTool.ts";

describe("createGetArtistTopTracksTool", () => {
  const mockSpotifyClient = {} as any;
  const tool = createGetArtistTopTracksTool(mockSpotifyClient);

  it("should create tool with correct metadata", () => {
    expect(tool.name).toBe("get-artist-top-tracks");
    expect(tool.title).toBe("Get Artist's Top Tracks");
    expect(tool.description).toBe("Get the top tracks of an artist on Spotify by country");
  });

  it("should have correct input schema", () => {
    const schema = z.object(tool.inputSchema);

    // Valid input
    const validInput = {
      artistId: "artist123",
      market: "US",
    };
    expect(() => schema.parse(validInput)).not.toThrow();

    // Invalid: missing artistId
    const invalidMissingArtist = {
      market: "US",
    };
    expect(() => schema.parse(invalidMissingArtist)).toThrow();

    // Invalid: missing market (required for this endpoint)
    const invalidMissingMarket = {
      artistId: "artist123",
    };
    expect(() => schema.parse(invalidMissingMarket)).toThrow();

    // Invalid: invalid market code (3 letters)
    const invalidMarketThreeLetters = {
      artistId: "artist123",
      market: "USA",
    };
    expect(() => schema.parse(invalidMarketThreeLetters)).toThrow();

    // Invalid: lowercase market code
    const invalidLowercaseMarket = {
      artistId: "artist123",
      market: "us",
    };
    expect(() => schema.parse(invalidLowercaseMarket)).toThrow();

    // Invalid: numeric market code
    const invalidNumericMarket = {
      artistId: "artist123",
      market: "12",
    };
    expect(() => schema.parse(invalidNumericMarket)).toThrow();
  });
});
