// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'
import { FRONTEND_URL } from '../config/index.js'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class LoginPage {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Page} */
    this.page = page
    /** @type {Locator} */
    this.emailInput = page.locator('#email-input-field')
    /** @type {Locator} */
    this.passwordInput = page.locator('#password-input-field')
    /** @type {Locator} */
    this.submitButton = page.locator("button[type='submit']")
    /** @type {Locator} */
    this.forgotPasswordLink = page.locator('[data-test="forgot-password-link"]')
  }

  async goto() {
    await this.page.goto(`${FRONTEND_URL}/login`)
  }

  /**
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    const responsePromise = this.page.waitForResponse('**/graphql')
    await this.submitButton.click()
    const response = await responsePromise
    expect(response.status()).toBe(200)
  }

  async openForgotPasswordPage() {
    await this.forgotPasswordLink.click()
    await this.page.waitForURL('**/forgot-password')
  }
}
