import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createGetSeveralAlbumsTool } from "./getSeveralAlbumsTool.ts";

describe("createGetSeveralAlbumsTool", () => {
  const mockSpotifyClient = {} as any;
  const tool = createGetSeveralAlbumsTool(mockSpotifyClient);

  it("should create tool with correct metadata", () => {
    expect(tool.name).toBe("get-several-albums");
    expect(tool.title).toBe("Get Several Albums");
    expect(tool.description).toBe(
      "Get multiple albums by their IDs from Spotify (maximum 20 albums)",
    );
  });

  it("should have correct input schema", () => {
    const schema = z.object(tool.inputSchema);

    // Valid input
    const validInput = {
      albumIds: ["album1", "album2"],
      market: "US",
    };
    expect(() => schema.parse(validInput)).not.toThrow();

    // Valid input without market
    const validInputNoMarket = {
      albumIds: ["album1"],
    };
    expect(() => schema.parse(validInputNoMarket)).not.toThrow();

    // Invalid: empty array
    const invalidEmptyArray = {
      albumIds: [],
    };
    expect(() => schema.parse(invalidEmptyArray)).toThrow();

    // Invalid: too many IDs
    const invalidTooMany = {
      albumIds: Array.from({ length: 21 }, (_, i) => `album${i}`),
    };
    expect(() => schema.parse(invalidTooMany)).toThrow();

    // Invalid: invalid market code
    const invalidMarket = {
      albumIds: ["album1"],
      market: "USA",
    };
    expect(() => schema.parse(invalidMarket)).toThrow();

    // Invalid: lowercase market code
    const invalidLowercaseMarket = {
      albumIds: ["album1"],
      market: "us",
    };
    expect(() => schema.parse(invalidLowercaseMarket)).toThrow();
  });
});
