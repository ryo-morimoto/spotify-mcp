import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    includeSource: ["src/**/*.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/**/*.test.ts",
        "src/**/*.d.ts",
        "src/**/*.config.*",
        "src/types/**",
      ],
    },
  },
});
