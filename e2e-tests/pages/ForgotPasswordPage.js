// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class ForgotPasswordPage {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Locator} */
    this.emailInput = page.locator('input[type=email]')
    /** @type {Locator} */
    this.submitButton = page.locator('button[type=submit]')
    /** @type {Locator} */
    this.successComponent = page.locator('[data-test="forgot-password-success"]')
  }

  /** @param {string} email */
  async requestPasswordReset(email) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
    await expect(this.successComponent).toBeVisible()
  }
}
