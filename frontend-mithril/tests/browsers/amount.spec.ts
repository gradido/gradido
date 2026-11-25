// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

// An amount is typed with a comma or a point, whatever the language of the browser: sending
// and creating rest on it. The wallet draws the field as text and reads the number itself
// (`amountSchema`). A `type: 'number'` field is no way: Firefox refuses a comma there, and
// Safari in English reads `1,5` as 15.

// A browser in each language the wallet has (frontend/src/locales), which the wallet then
// shows, and the sign that language groups thousands with: French and Russian take a space.
const LOCALES = {
  'de-DE': '.',
  'el-GR': '.',
  'en-US': ',',
  'es-ES': '.',
  'fr-FR': ' ',
  'it-IT': '.',
  'nl-NL': '.',
  'pt-PT': '.',
  'ru-RU': ' ',
  'tr-TR': '.',
}

for (const [locale, groupSign] of Object.entries(LOCALES)) {
  test.describe(locale, () => {
    test.use({ locale })

    test('an amount typed with a comma or a point is sent as that number', async ({ page }) => {
      await page.goto('blocks/?amount=text')
      const amount = page.getByLabel('Amount')
      const send = page.getByRole('button', { name: 'Send' })

      await amount.pressSequentially('1,5')
      await expect(amount).toHaveValue('1,5')
      await send.click()
      await expect(page.getByTestId('sent')).toHaveText('[1.5]')

      await amount.clear()
      await amount.pressSequentially('1.5')
      await send.click()
      await expect(page.getByTestId('sent')).toHaveText('[1.5,1.5]')

      // grouped as no language can mean otherwise
      await amount.clear()
      await amount.pressSequentially('1.234,56')
      await send.click()
      await expect(page.getByTestId('sent')).toHaveText('[1.5,1.5,1234.56]')

      // one sign with three digits behind it: a thousand only as the language groups
      for (const sign of ['.', ',']) {
        await amount.clear()
        await amount.pressSequentially(`2${sign}000`)
        await amount.blur()
        if (sign === groupSign) {
          await send.click()
          await expect(page.getByTestId('sent')).toHaveText('[1.5,1.5,1234.56,2000]')
        } else {
          await expect(send).toBeDisabled()
          await expect(page.locator('.invalid-feedback')).not.toBeEmpty()
        }
      }
    })
  })
}
