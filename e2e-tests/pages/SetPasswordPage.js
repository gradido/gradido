// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'
import { FRONTEND_URL } from '../config/index.js'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

// The page behind the activation link (/checkEmail/…) and the password reset link
// (/reset-password/…): both ask for a new password.
export class SetPasswordPage {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Page} */
    this.page = page
    /** @type {Locator} */
    this.newPasswordInput = page.locator('#new-password-input-field input[type=password]')
    /** @type {Locator} */
    this.repeatPasswordInput = page.locator('#repeat-new-password-input-field input[type=password]')
    /** @type {Locator} */
    this.submitButton = page.locator('[data-test=submit-new-password-btn]')
    /** @type {Locator} */
    this.signinButton = page.locator('.btn.test-message-button')
  }

  /** @param {string} path path of the link from the e-mail */
  async goto(path) {
    await this.page.goto(`${FRONTEND_URL}${path}`)
    await expect(this.newPasswordInput).toBeVisible()
  }

  /** @param {string} password */
  async setPassword(password) {
    await this.newPasswordInput.fill(password)
    await this.repeatPasswordInput.fill(password)
    await this.submitButton.click()
  }

  async openSigninPage() {
    await this.signinButton.click()
    await this.page.waitForURL('**/login**')
  }
}
