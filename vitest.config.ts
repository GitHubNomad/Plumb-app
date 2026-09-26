import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so unit tests don't boot the TanStack Start plugin.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
