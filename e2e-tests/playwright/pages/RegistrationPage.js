// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'
import { FRONTEND_URL } from '../config/index.js'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class RegistrationPage {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Page} */
    this.page = page
    /** @type {Locator} */
    this.firstnameInput = page.locator('#registerFirstname')
    /** @type {Locator} */
    this.lastnameInput = page.locator('#registerLastname')
    /** @type {Locator} */
    this.emailInput = page.locator('input[type=email]')
    /** @type {Locator} */
    this.privacyCheckbox = page.locator('#registerCheckbox')
    /** @type {Locator} */
    this.submitButton = page.locator('[type=submit]')
    /** @type {Locator} */
    this.thanksHeadline = page.locator('.test-message-headline')
    /** @type {Locator} */
    this.thanksText = page.locator('.test-message-subtitle')
  }

  async goto() {
    await this.page.goto(`${FRONTEND_URL}/register`)
  }

  /**
   * @param {string} firstname
   * @param {string} lastname
   * @param {string} email
   */
  async register(firstname, lastname, email) {
    await this.firstnameInput.fill(firstname)
    await this.lastnameInput.fill(lastname)
    await this.emailInput.fill(email)
    // the checkbox input is covered by its styled label
    await this.privacyCheckbox.check({ force: true })
    await expect(this.submitButton).toBeEnabled()
    await this.submitButton.click()
    await expect(this.thanksHeadline).toBeVisible()
    await expect(this.thanksText).toBeVisible()
  }
}
