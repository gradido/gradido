// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// What bootstrap-vue-next's BPagination drew in the old wallet, read off a browser for every
// page of 1 to 12 pages at a limit of 3, 5 and 7: `limit/pages/page: ‹ 4 5h 6a ›`, `a` the
// page shown, `h` hidden on a small screen, `d` an arrow that leads nowhere.
const drawnByVue = readFileSync(
  new URL('../../test/bootstrapVueNextPages.txt', import.meta.url),
  'utf8',
)
  .trim()
  .split('\n')

test('draws the pages bootstrap-vue-next drew', async ({ page }) => {
  expect(drawnByVue.length).toBe(123)
  await page.goto(`blocks/?pagination=${drawnByVue.map((line) => line.split(':')[0]).join(',')}`)

  // each pager read off the page in the same words
  const drawn = await page
    .locator('ul.pagination')
    .evaluateAll((pagers) =>
      pagers.map((pager) =>
        [...pager.children]
          .map(
            (item) =>
              (item.textContent ?? '') +
              (item.classList.contains('bv-d-sm-down-none') ? 'h' : '') +
              (item.classList.contains('active') ? 'a' : '') +
              (item.classList.contains('disabled') ? 'd' : ''),
          )
          .join(' '),
      ),
    )
  expect(drawn).toEqual(drawnByVue.map((line) => line.split(': ')[1]))
})

test('goes to the page clicked, and moves the focus by the arrow keys', async ({ page }) => {
  await page.goto('blocks/?pagination=5/12/1')
  const pager = page.getByRole('menubar')
  const shown = pager.locator('.page-item.active')

  await pager.getByLabel('Go to page 3').click()
  await expect(shown).toHaveText('3')
  await pager.getByLabel('Go to next page').click()
  await expect(shown).toHaveText('4')

  // only the page shown is in the tab order; the arrows move the focus from there
  await pager.getByLabel('Go to page 4').focus()
  await page.keyboard.press('ArrowRight')
  await expect(pager.getByLabel('Go to page 5')).toBeFocused()
  await page.keyboard.press('Home')
  await expect(pager.getByLabel('Go to previous page')).toBeFocused()
  await page.keyboard.press('End')
  await expect(pager.getByLabel('Go to next page')).toBeFocused()
  await expect(shown).toHaveText('4')
})
