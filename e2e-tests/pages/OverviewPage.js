// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class OverviewPage {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Page} */
    this.page = page
    /** @type {Locator} */
    this.navbarName = page.locator('[data-test="navbar-item-username"]')
  }

  /** @param {string} username */
  async assertLoggedInAs(username) {
    await this.page.waitForURL('**/overview')
    await expect(this.navbarName).toContainText(username)
  }
}
