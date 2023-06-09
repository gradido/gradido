import { expect, Locator, Page } from '@playwright/test';

export class WelcomePage {
  readonly page: Page;
  readonly url: string;
  readonly profileLink: Locator;

  constructor(page: Page){
    this.page = page;
    this.url = './overview';
    this.profileLink = page.locator('href=/profile');
  }
}
