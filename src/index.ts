/**
 * Spotify MCP Server - A TypeScript MCP server for controlling Spotify
 */
export {};

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('init', () => {
    expect(true).toBe(true);
  });
}
