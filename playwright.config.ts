import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'test/smoke-test',
  use: {
    baseURL: process.env.ENV === 'dev'
      ? 'http://localhost:4000'
      : 'https://nextstrain.org/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run server',
    url: 'http://localhost:4000',
    reuseExistingServer: true,
  },
  outputDir: ".playwright",
});
