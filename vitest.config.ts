import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    includeSource: ["src/**/*.ts"],
    include: ["src/**/*.test.ts", "src/**/*.spec.ts", "test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@external": path.resolve(__dirname, "./src/external"),
      "@mcp": path.resolve(__dirname, "./src/mcp"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@auth": path.resolve(__dirname, "./src/auth"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@middleware": path.resolve(__dirname, "./src/middleware"),
      "@storage": path.resolve(__dirname, "./src/storage"),
      "@adapters": path.resolve(__dirname, "./src/adapters"),
    },
  },
});