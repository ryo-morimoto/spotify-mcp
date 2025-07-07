import { describe, test, expect } from "vitest";
import { generateCodeVerifier, generateCodeChallenge } from "./pkce.ts";

describe("PKCE functions", () => {
  test("generateCodeVerifier returns valid verifier", () => {
    const result = generateCodeVerifier();
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const verifier = result.value;
      // Should be 43 characters (32 bytes base64url encoded)
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      // Should only contain URL-safe characters
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  test("generateCodeChallenge returns valid challenge", async () => {
    const verifierResult = generateCodeVerifier();
    expect(verifierResult.isOk()).toBe(true);
    if (verifierResult.isOk()) {
      const result = await generateCodeChallenge(verifierResult.value);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const challenge = result.value;
        // Should be base64url encoded
        expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
        // Should not contain padding
        expect(challenge).not.toContain("=");
      }
    }
  });
});
