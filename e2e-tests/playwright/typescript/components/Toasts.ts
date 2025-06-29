import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class Toasts {
  public readonly toastSlot: Locator
  public readonly toastTypeError: Locator
  public readonly toastTitle: Locator
  public readonly toastMessage: Locator

  constructor(page: Page) {
    this.toastSlot = page.locator('#__BVID__toaster-container')
    this.toastTypeError = this.toastSlot.locator('.toast.text-bg-danger')
    this.toastTitle = this.toastTypeError.locator('.gdd-toaster-title')
    this.toastMessage = this.toastTypeError.locator('.gdd-toaster-body')
  }

  async assertErrorToastVisible(): Promise<void> {
    await this.toastTypeError.waitFor({ state: 'visible' })
    expect(this.toastTitle).toBeVisible()
    expect(this.toastMessage).toBeVisible()
  }
}
