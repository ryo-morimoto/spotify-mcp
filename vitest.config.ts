import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "node",
    includeSource: ["src/**/*.ts"],
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Load all env vars from .env files
    env: loadEnv(mode, process.cwd(), ""),
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/**/*.test.ts",
        "test/**/*.test.ts",
        "src/**/*.d.ts",
        "src/**/*.config.*",
        "src/types/**",
      ],
    },
  },
}));
