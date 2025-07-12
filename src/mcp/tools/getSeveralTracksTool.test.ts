import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createGetSeveralTracksTool } from "./getSeveralTracksTool.ts";

describe("createGetSeveralTracksTool", () => {
  const mockSpotifyClient = {} as any;
  const tool = createGetSeveralTracksTool(mockSpotifyClient);

  it("should create tool with correct metadata", () => {
    expect(tool.name).toBe("get-several-tracks");
    expect(tool.title).toBe("Get Several Tracks");
    expect(tool.description).toBe(
      "Get multiple tracks by their IDs from Spotify (maximum 50 tracks)",
    );
  });

  it("should have correct input schema", () => {
    const schema = z.object(tool.inputSchema);

    // Valid input
    const validInput = {
      trackIds: ["track1", "track2"],
      market: "US",
    };
    expect(() => schema.parse(validInput)).not.toThrow();

    // Valid input without market
    const validInputNoMarket = {
      trackIds: ["track1"],
    };
    expect(() => schema.parse(validInputNoMarket)).not.toThrow();

    // Invalid: empty array
    const invalidEmptyArray = {
      trackIds: [],
    };
    expect(() => schema.parse(invalidEmptyArray)).toThrow();

    // Invalid: too many IDs
    const invalidTooMany = {
      trackIds: Array.from({ length: 51 }, (_, i) => `track${i}`),
    };
    expect(() => schema.parse(invalidTooMany)).toThrow();

    // Invalid: invalid market code
    const invalidMarket = {
      trackIds: ["track1"],
      market: "USA",
    };
    expect(() => schema.parse(invalidMarket)).toThrow();

    // Invalid: lowercase market code
    const invalidLowercaseMarket = {
      trackIds: ["track1"],
      market: "us",
    };
    expect(() => schema.parse(invalidLowercaseMarket)).toThrow();
  });
});
