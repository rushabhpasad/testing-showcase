import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm --filter sample-app-backend dev',
      port: 3001,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter sample-app-frontend dev',
      port: 5173,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
