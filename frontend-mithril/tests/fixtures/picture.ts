// AI-GENERATED — not an architecture reference
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test'

/**
 * Holds the Mithril wallet to the picture the old wallet shows at this point of a spec: the old
 * wallet's run takes it (tests/pictures, not checked in), the new wallet's run is compared with
 * it. `mask` is covered in both: what differs for a reason, as the port in an address. `new` runs after `old`, and `new-phone` after `old-phone` (playwright.config.ts).
 */
export const samePicture = async (
  page: Page,
  info: TestInfo,
  name: string,
  mask: Locator[] = [],
) => {
  // the same file for both wallets: only desk and phone differ
  const file = `${name}${info.project.name.endsWith('-phone') ? '-phone' : ''}.png`
  // from the top: what is fixed to the window (the picture beside the form) stands in a
  // picture of the whole page where the page was scrolled to
  await page.evaluate(() => scrollTo(0, 0))
  if (info.project.name.startsWith('old')) {
    // what stands in the place of the fonts and the images until they are loaded is no
    // picture of the wallet
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => [...document.images].every((image) => image.complete))
    // in CSS pixels, as toHaveScreenshot takes its own: a phone has more than one to each
    await page.screenshot({
      path: info.snapshotPath(file),
      fullPage: true,
      animations: 'disabled',
      scale: 'css',
      mask,
    })
  } else {
    await expect(page).toHaveScreenshot(file, { fullPage: true, mask })
  }
}
