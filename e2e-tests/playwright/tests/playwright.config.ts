import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  globalSetup: require.resolve('./global-setup'),
  ignoreHTTPSErrors: true,
  locale: 'de-DE',
  reporter: process.env.CI ? 'github' : 'list',
  retries: 1,
  screenshot: 'only-on-failure',
  testDir: '.',
  timeout: 30000,
  trace: 'on-first-retry',
  video: 'never',
  viewport: { width: 1280, height: 720 },
  use: {
    baseURL: process.env.URL || 'http://localhost:3000',
    browserName: 'webkit',

  },
};
export default config;
