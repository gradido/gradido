// AI-GENERATED — not an architecture reference
import { expect } from '@playwright/test'

/** @typedef {import('@playwright/test').Locator} Locator */
/** @typedef {import('@playwright/test').Page} Page */

export class Toasts {
  /** @param {Page} page */
  constructor(page) {
    /** @type {Locator} */
    this.toastSlot = page.locator('#__BVID__toaster-container')
    /** @type {Locator} */
    this.toastTypeError = this.toastSlot.locator('.toast.text-bg-danger')
    /** @type {Locator} */
    this.toastTitle = this.toastTypeError.locator('.gdd-toaster-title')
    /** @type {Locator} */
    this.toastMessage = this.toastTypeError.locator('.gdd-toaster-body')
    /** @type {Locator} */
    this.toastTypeSuccess = this.toastSlot.locator('.toast.text-bg-success')
  }

  /** @returns {Promise<void>} */
  async assertErrorToastVisible() {
    await this.toastTypeError.waitFor({ state: 'visible' })
    await expect(this.toastTitle).toBeVisible()
    await expect(this.toastMessage).toBeVisible()
  }

  /** @returns {Promise<void>} */
  async assertSuccessToastVisible() {
    await this.toastTypeSuccess.waitFor({ state: 'visible' })
    await expect(this.toastTypeSuccess.locator('.gdd-toaster-title')).toBeVisible()
    await expect(this.toastTypeSuccess.locator('.gdd-toaster-body')).toBeVisible()
  }
}
