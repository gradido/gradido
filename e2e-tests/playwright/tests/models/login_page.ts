import { expect, test, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly url: string;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = './login';
    this.emailInput = page.locator('id=Email-input-field');
    this.passwordInput = page.locator('id=Password-input-field');
    this.submitBtn = page.locator('text=Login');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async enterEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submitLogin() {
    await this.submitBtn.click();
  }
}
