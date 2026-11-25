// AI-GENERATED — not an architecture reference
import { expect, test } from '@playwright/test'

// The keys and names of the WAI-ARIA patterns the building blocks follow
// (w3.org/WAI/ARIA/apg/patterns: menu-button, menubar, tabs, dialog-modal, alertdialog).

// the names of the buttons are read in English
test.use({ locale: 'en-US' })

test('a select is a menu button: arrows go round its entries, Escape and Tab close it', async ({
  page,
}) => {
  await page.goto('blocks/?select')
  const button = page.getByRole('button', { name: 'Red' })
  const menu = page.getByRole('menu', { name: 'Red' })
  const entry = (name: string) => menu.getByRole('menuitemradio', { name })

  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await button.focus()
  await page.keyboard.press('Enter')
  await expect(button).toHaveAttribute('aria-expanded', 'true')
  await expect(entry('Red')).toBeFocused()
  await expect(entry('Red')).toHaveAttribute('aria-checked', 'true')
  await expect(entry('Blue')).toHaveAttribute('aria-checked', 'false')

  // an entry that cannot be chosen is reached, and Enter on it changes nothing
  await page.keyboard.press('ArrowDown')
  await expect(entry('Green')).toBeFocused()
  await expect(entry('Green')).toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Enter')
  await expect(button).toHaveAttribute('aria-expanded', 'true')

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(entry('Red')).toBeFocused()
  await page.keyboard.press('ArrowUp')
  await expect(entry('Blue')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(entry('Red')).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(button).toBeFocused()

  // ↑ on the button opens at the last entry; Tab closes and goes on
  await page.keyboard.press('ArrowUp')
  await expect(entry('Blue')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('button', { name: 'after' })).toBeFocused()

  // a click beside closes, and the focus stays where the click put it
  await button.click()
  await expect(entry('Red')).toBeFocused()
  await page.getByRole('button', { name: 'before' }).click()
  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('button', { name: 'before' })).toBeFocused()

  // a choice closes, and the button has the focus and the new name
  await button.focus()
  await page.keyboard.press('ArrowUp')
  await expect(entry('Blue')).toBeFocused()
  await page.keyboard.press('Enter')
  const chosen = page.getByRole('button', { name: 'Blue' })
  await expect(chosen).toHaveAttribute('aria-expanded', 'false')
  await expect(chosen).toBeFocused()
})

test('tabs: the arrows move the focus round, Enter shows the tab', async ({ page }) => {
  await page.goto('blocks/?tabs')
  const tab = (name: string) =>
    page.getByRole('tablist', { name: 'Bookings' }).getByRole('tab', { name })

  await expect(tab('Sent')).toHaveAttribute('aria-selected', 'true')
  await tab('Sent').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(tab('Open')).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(tab('Received')).toBeFocused()
  // only the focus moved
  await expect(tab('Sent')).toHaveAttribute('aria-selected', 'true')

  await page.keyboard.press('Enter')
  await expect(tab('Received')).toHaveAttribute('aria-selected', 'true')
  await expect(tab('Sent')).toHaveAttribute('aria-selected', 'false')
  await expect(tab('Received')).toBeFocused()

  // Tab leaves the row for the pane shown
  await page.keyboard.press('Tab')
  await expect(page.getByRole('tabpanel', { name: 'Received' })).toBeFocused()
  await expect(page.getByRole('tabpanel', { name: 'Received' })).toHaveText('Received pane')
})

test('a question is an alert dialog: named, read, the focus kept inside and given back', async ({
  page,
}) => {
  await page.goto('blocks/?confirm')
  const opener = page.getByRole('button', { name: 'delete' })
  await opener.click()

  const dialog = page.getByRole('alertdialog', { name: 'Delete?' })
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog).toHaveAccessibleDescription('It cannot be brought back.')
  // the focus starts at the button that does not
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Delete' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Delete' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test('a window keeps Tab inside also where its last button is not in the tab order', async ({
  page,
}) => {
  await page.goto('blocks/?modal')
  await page.getByRole('button', { name: 'open' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pages' })
  const first = dialog.getByRole('button', { name: 'first' })
  const shown = dialog.getByRole('menuitem', { name: 'Go to page 1' })

  await shown.focus()
  await page.keyboard.press('Tab')
  await expect(first).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(shown).toBeFocused()
})

test('Tab goes on from a button inside a window that only the arrows reach', async ({ page }) => {
  await page.goto('blocks/?modal=last')
  await page.getByRole('button', { name: 'open' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pages' })
  const second = dialog.getByRole('menuitem', { name: 'Go to page 2' })

  await dialog.getByRole('menuitem', { name: 'Go to page 1' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(second).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'last' })).toBeFocused()

  // and back: to the stop before it, not to the end of the window
  await second.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('menuitem', { name: 'Go to page 1' })).toBeFocused()

  // from the window itself, which has the focus as it opens
  await dialog.focus()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'last' })).toBeFocused()
})

test('Tab stays inside from a button behind the last stop of a window', async ({ page }) => {
  await page.goto('blocks/?modal')
  await page.getByRole('button', { name: 'open' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pages' })

  await dialog.getByRole('menuitem', { name: 'Go to page 1' }).focus()
  await page.keyboard.press('End')
  await expect(dialog.getByRole('menuitem', { name: 'Go to next page' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'first' })).toBeFocused()
})

test('Tab stays inside a window whose last button is locked, also one with a tabindex', async ({
  page,
}) => {
  await page.goto('blocks/?modal=locked')
  await page.getByRole('button', { name: 'open' }).click()
  const dialog = page.getByRole('dialog', { name: 'Pages' })

  await dialog.getByRole('menuitem', { name: 'Go to page 1' }).focus()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'first' })).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('menuitem', { name: 'Go to page 1' })).toBeFocused()
})
