// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

// A field of `type: 'number'` with the step of its rule (0.01): the browser's own check goes
// by the step, and stops the form before `onsubmit` where the two do not agree. In Chromium
// only: what Firefox and Safari make of a comma there is why an amount is a text field
// (tests/browsers/amount.spec.ts).
test('sends a number field with decimals', async ({ page }) => {
  await page.goto('blocks/?amount=number')
  await page.getByLabel('Amount').fill('1.5')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByTestId('sent')).toHaveText('[1.5]')
})

test('takes a comma typed into a number field as a point', async ({ page }) => {
  await page.goto('blocks/?amount=number')
  // typed key by key: `fill` refuses what is no number to JavaScript
  await page.getByLabel('Amount').pressSequentially('1,5')
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
