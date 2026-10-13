import { defineConfig, devices } from '@playwright/test';

const remote = process.env.BASE_URL;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: CI ? [['list'], ['html', { open: 'never' }], ['github']] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: remote || 'http://127.0.0.1:4173',
    timezoneId: 'Asia/Kolkata',
    locale: 'en-IN',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: remote ? undefined : {
    command: 'node e2e/serve.mjs',
    url: 'http://127.0.0.1:4173/molbhav/',
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
