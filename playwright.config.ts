import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // Every test talks to the same in-memory store, so they run one at a time.
  // Each test still creates its own data and never relies on global counts.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // A production build: prefetching, streaming and caching behave as they
    // would in a real deployment, unlike in `next dev`.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/tasks`,
    timeout: 180_000,
    // Always a fresh server, so every run starts from the same seed data.
    reuseExistingServer: false,
  },
});
