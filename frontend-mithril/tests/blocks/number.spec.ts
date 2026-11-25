// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

// A field of `type: 'number'` with the step of its rule (0.01): the browser's own check goes
// by the step, and stops the form before `onsubmit` where the two do not agree. With a point
// only: what a number field makes of a comma depends on the browser and on the language of the
// machine (Chromium reads `1,5` as 1.5 on a German one, as 15 on an English one), which is why
// an amount is a text field (tests/browsers/amount.spec.ts).
test('sends a number field with decimals', async ({ page }) => {
  await page.goto('blocks/?amount=number')
  await page.getByLabel('Amount').fill('1.5')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByTestId('sent')).toHaveText('[1.5]')
})

test('says what is wrong with more decimals than the step allows', async ({ page }) => {
  await page.goto('blocks/?amount=number')
  await page.getByLabel('Amount').fill('1.5555')
  await page.getByLabel('Amount').blur()
  await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled()
  await expect(page.locator('.invalid-feedback')).not.toBeEmpty()
})
