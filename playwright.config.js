import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: /debug.*\.spec\.js$/,  // Ignore debug test files
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially for stability
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
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
    // Other browsers
    {
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
    },
  ],

  webServer: {
    command: 'npx http-server -p 8080 -c-1',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
