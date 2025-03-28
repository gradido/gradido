import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  process.env.EMAIL = 'bibi@bloxberg.de';
  process.env.PASSWORD = 'Aa12345_';
  process.env.GMS_ACTIVE = false;
  process.env.HUMHUB_ACTIVE = false;
}

export default globalSetup;
