import { defineConfig, devices } from '@playwright/test';

// Port of scripts/dev-server.mjs for this run (override with E2E_PORT to run suites side by side).
const PORT = process.env.E2E_PORT || '4317';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: /debug.*\.spec\.js$/,  // Ignore debug test files
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially for stability
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'chromium-tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 }
      },
    },
    // Extreme screen sizes
    {
      name: 'chromium-iphone-se',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 320, height: 568 }
      },
    },
    {
      name: 'chromium-4k',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 3840, height: 2160 }
      },
    },
    // Landscape mode
    {
      name: 'chromium-mobile-landscape',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 667, height: 375 }
      },
    },
    // Firefox / WebKit need their own browser downloads: opt in with E2E_ALL_BROWSERS=1
    // (`npx playwright install firefox webkit` first).
    ...(process.env.E2E_ALL_BROWSERS ? [{
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    }] : []),
  ],

  webServer: {
    command: 'node scripts/dev-server.mjs',
    url: `http://localhost:${PORT}/dist/excelike-table.js`,
    env: { PORT },
    // Never reuse whatever happens to be listening: it may be an unrelated server.
    reuseExistingServer: false,
    timeout: 30 * 1000,
  },
});
