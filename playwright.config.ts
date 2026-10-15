import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
  // Uses an already-installed Chromium (no download); set CHROMIUM_PATH to override.
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || 'C:/Users/Rohit Kakade/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' },
  },
  webServer: { command: 'node scripts/serve-static.mjs', url: 'http://localhost:3100', reuseExistingServer: true, timeout: 30000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
