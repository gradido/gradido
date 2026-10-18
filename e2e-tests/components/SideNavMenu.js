// AI-GENERATED — not an architecture reference
/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class SideNavMenu {
  /** @param {Page} page */
  constructor(page) {
    // There are several logout entries (main menu, settings menu, phone drawer); only the
    // visible one can be clicked.
    /** @type {Locator} */
    this.logoutMenu = page.locator('[data-test=logout-menu]').filter({ visible: true })
  }

  async logout() {
    await this.logoutMenu.click()
  }
}
