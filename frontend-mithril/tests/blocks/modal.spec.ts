// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

test('a click beside the window closes it, a text marked out of it does not', async ({ page }) => {
  await page.goto('blocks/?modal')
  // the blocks page has no styles: room beside the window
  await page.addStyleTag({ content: '.modal { position: fixed; inset: 0; padding: 150px }' })
  await page.getByRole('button', { name: 'open' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pages' })
  const inside = await dialog.getByRole('button', { name: 'first' }).boundingBox()
  if (!inside) {
    throw new Error('the window is not drawn')
  }

  // pressed inside, let go beside
  await page.mouse.move(inside.x + 5, inside.y + 5)
  await page.mouse.down()
  await page.mouse.move(20, 20)
  await page.mouse.up()
  // once the click is drawn: a window that closes is gone two frames later
  await page.evaluate(
    () => new Promise((drawn) => requestAnimationFrame(() => requestAnimationFrame(drawn))),
  )
  await expect(dialog).toBeVisible()

  await page.mouse.click(20, 20)
  await expect(dialog).toHaveCount(0)
})

test('of two windows the upper one keeps the focus where what had it is gone', async ({ page }) => {
  await page.goto('blocks/?modals')
  await page.getByRole('button', { name: 'goes' }).click()
  await expect(page.getByRole('button', { name: 'goes' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'stays' })).toBeFocused()
})
