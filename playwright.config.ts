import { defineConfig, devices } from "@playwright/test";

const PORT = 8787;

// Runs against the built site served by wrangler, i.e. the same Workers Static Assets
// runtime (and SPA fallback, and _headers) that production uses. Build first: `npm run build`.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "pixel", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: `npx wrangler dev --port ${PORT} --log-level warn`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
