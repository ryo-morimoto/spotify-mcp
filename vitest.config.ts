import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@types": path.resolve(__dirname, "./src/types.ts"),
      "@mcp": path.resolve(__dirname, "./src/mcp"),
    },
  },
  test: {
    environment: "node",
    includeSource: ["src/**/*.ts"],
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Load all env vars from .env files
    env: loadEnv(mode, process.cwd(), ""),
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        "src/**/*.config.*",
        "src/types/**",
        "src/**/types.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
}));
