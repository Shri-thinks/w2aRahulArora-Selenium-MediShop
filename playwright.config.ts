/// <reference types="node" />

import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://www.way2automation.com/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    channel: 'chrome',
    headless: false,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* This is the Playwright default and matches the attribute used across the
       site. Shown explicitly so the class can see where it is configured. */
    testIdAttribute: 'data-testid'
  },

  /* Boots the demo site automatically before the run. */
  webServer: {
    command: 'node server.js 3000',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },

  projects: [
    /* Signs in once and saves the session to playwright/.auth/user.json. */
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    }

    /* Uncomment to run the same suite across browsers.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, dependencies: ['setup'] },
    { name: 'webkit',  use: { ...devices['Desktop Safari'] },  dependencies: ['setup'] },
    */
  ]
});
