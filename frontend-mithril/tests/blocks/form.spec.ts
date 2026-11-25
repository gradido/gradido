// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

test.beforeEach(({ page }) => page.goto('blocks/?form'))

test('locks its button until every field fits, also one another component draws', async ({
  page,
}) => {
  const send = page.getByRole('button', { name: 'Send' })
  await expect(send).toBeDisabled()
  await expect(page.getByLabel('Memo')).not.toHaveClass(/is-/)

  await page.getByLabel('Memo').fill('Danke!')
  await expect(page.getByLabel('Memo')).toHaveClass(/is-valid/)
  await expect(send).toBeDisabled()

  await page.getByLabel('Amount').fill('1.5')
  await expect(send).toBeEnabled()

  await page.getByLabel('Memo').fill('Hi')
  await expect(send).toBeDisabled()
})

test('says what is wrong with a field only once it was left', async ({ page }) => {
  await page.getByLabel('Memo').fill('Hi')
  await expect(page.getByLabel('Memo')).not.toHaveClass(/is-/)
  await page.getByLabel('Memo').blur()
  await expect(page.getByLabel('Memo')).toHaveClass(/is-invalid/)
  await expect(page.getByText('at least 5 characters')).toBeVisible()
  await expect(page.getByLabel('Amount')).not.toHaveClass(/is-/)
})

test('lets every field say what is wrong with it under a pointer or a finger on the locked button', async ({
  page,
  isMobile,
}) => {
  // the button is locked: neither is waited for to be possible
  if (isMobile) {
    await page.getByRole('button', { name: 'Send' }).tap({ force: true })
  } else {
    await page.getByRole('button', { name: 'Send' }).hover({ force: true })
  }
  await expect(page.getByLabel('Memo')).toHaveClass(/is-invalid/)
  await expect(page.getByLabel('Amount')).toHaveClass(/is-invalid/)
  await expect(page.getByText('amount needed')).toBeVisible()
  await expect(page.getByTestId('sent')).toHaveText('[]')
})

test('sends by Enter what its schema gives out, once, and is locked until the answer', async ({
  page,
}) => {
  const send = page.getByRole('button', { name: 'Send' })
  await page.getByLabel('Memo').fill('Danke!')
  await page.getByLabel('Amount').fill('1.5')
  // The form unlocks its button a draw after the last field fits; until then Enter sends
  // nothing, as with every locked button.
  await expect(send).toBeEnabled()
  await page.getByLabel('Amount').press('Enter')

  // the amount as a number: read through the form's schema
  await expect(page.getByTestId('sent')).toHaveText('[{"memo":"Danke!","amount":1.5}]')
  await expect(send).toBeDisabled()
  // counted, not seen: the page of the blocks loads no styles, and without them it has no size
  await expect(send.locator('.spinner-border')).toHaveCount(1)

  await page.getByLabel('Amount').press('Enter')
  await expect(page.getByTestId('sent')).toHaveText('[{"memo":"Danke!","amount":1.5}]')
  // the page was not loaded anew, as a form of the browser's would
  expect(new URL(page.url()).search).toBe('?form')

  await page.getByTestId('answer').click()
  await expect(send).toBeEnabled()
  await expect(send.locator('.spinner-border')).toHaveCount(0)
})

test('sends nothing by Enter straight after a field stopped fitting', async ({ page }) => {
  const errors: Error[] = []
  page.on('pageerror', (error) => errors.push(error))
  await page.getByLabel('Memo').fill('Danke!')
  await page.getByLabel('Amount').fill('1.5')
  await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled()

  // typed and sent before the form has drawn again
  await page.getByLabel('Memo').evaluate((memo: HTMLInputElement) => {
    memo.value = 'Hi'
    memo.dispatchEvent(new Event('input', { bubbles: true }))
    memo.form?.requestSubmit()
  })
  await expect(page.getByRole('button', { name: 'Send' })).toBeDisabled()
  await expect(page.getByTestId('sent')).toHaveText('[]')
  expect(errors).toEqual([])
})
