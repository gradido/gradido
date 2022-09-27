import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  process.env.EMAIL = 'bibi@bloxberg.de';
  process.env.PASSWORD = 'Aa12345_';
}

export default globalSetup;
