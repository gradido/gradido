import type { Locator, Page } from '@playwright/test'
import { FRONTEND_URL } from '../config'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('#email-input-field')
    this.passwordInput = page.locator('#password-input-field')
    this.submitButton = page.locator("button[type='submit']")
  }

  async goto() {
    await this.page.goto(`${FRONTEND_URL}/login`)
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    const responsePromise = this.page.waitForResponse('**/graphql')
    await this.submitButton.click()
    await responsePromise
  }
}