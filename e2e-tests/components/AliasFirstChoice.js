// AI-GENERATED — not an architecture reference
/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

// The window a new member gets on the first login, asking them to keep or change the username
// suggested for them. It covers the page until it is answered.
export class AliasFirstChoice {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Locator} */
    this.keepButton = page.locator('[data-test=alias-first-keep]')
  }

  async keepSuggestion() {
    await this.keepButton.click()
    await this.keepButton.waitFor({ state: 'hidden' })
  }
}
