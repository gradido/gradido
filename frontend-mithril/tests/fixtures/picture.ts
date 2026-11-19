// AI-GENERATED — not an architecture reference
import { expect, type Page, type TestInfo } from '@playwright/test'

/**
 * Holds the Mithril wallet to the picture the old wallet shows at this point of a spec: the old
 * wallet's run takes it (tests/pictures, not checked in), the new wallet's run is compared with
 * it. `new` runs after `old`, and `new-phone` after `old-phone` (playwright.config.ts).
 */
export const samePicture = async (page: Page, info: TestInfo, name: string) => {
  // the same file for both wallets: only desk and phone differ
  const file = `${name}${info.project.name.endsWith('-phone') ? '-phone' : ''}.png`
  if (info.project.name.startsWith('old')) {
    // what stands in the fonts' place until they are loaded is no picture of the wallet
    await page.evaluate(() => document.fonts.ready)
    // in CSS pixels, as toHaveScreenshot takes its own: a phone has more than one to each
    await page.screenshot({
      path: info.snapshotPath(file),
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
    })
  } else {
    await expect(page).toHaveScreenshot(file, { fullPage: true })
  }
}
