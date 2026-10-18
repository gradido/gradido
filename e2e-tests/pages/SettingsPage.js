// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class SettingsPage {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Locator} */
    this.openChangePassword = page.locator('[data-test=open-password-change-form]')
    /** @type {Locator} */
    this.oldPasswordInput = page.locator('#password-input-field')
    /** @type {Locator} */
    this.newPasswordInput = page.locator('#new-password-input-field input')
    /** @type {Locator} */
    this.repeatPasswordInput = page.locator('#repeat-new-password-input-field input')
    /** @type {Locator} */
    this.submitButton = page.locator('[data-test=submit-new-password-btn]')
  }

  async openChangePasswordForm() {
    await this.openChangePassword.click()
    await expect(this.repeatPasswordInput).toBeVisible()
  }

  /**
   * @param {string} oldPassword
   * @param {string} newPassword
   */
  async changePassword(oldPassword, newPassword) {
    await this.oldPasswordInput.fill(oldPassword)
    await this.newPasswordInput.fill(newPassword)
    await this.repeatPasswordInput.fill(newPassword)
    await expect(this.submitButton).toBeEnabled()
    await this.submitButton.click()
  }
}
