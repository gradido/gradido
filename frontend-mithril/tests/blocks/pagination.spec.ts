// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

// What bootstrap-vue-next's BPagination drew in the old wallet, read off a browser for every
// page of 1 to 12 pages at a limit of 3, 5 and 7: `limit/pages/page: ‹ 4 5h 6a ›`, `a` the
// page shown, `h` hidden on a small screen, `d` an arrow that leads nowhere.
// the names of the buttons are read in English
test.use({ locale: 'en-US' })

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
  // One difference: bootstrap-vue-next hid the page shown itself on a small screen in two
  // cases (`2ha`). Here the page shown is never hidden.
  expect(drawn).toEqual(drawnByVue.map((line) => line.split(': ')[1].replace('ha', 'a')))
})

test('goes to the page clicked, and moves the focus by the arrow keys', async ({ page }) => {
  await page.goto('blocks/?pagination=5/12/1')
  const pager = page.getByRole('menubar')
  const shown = pager.locator('.page-item.active')
  // nothing between the menubar and its entries
  await expect(pager.locator('> li:not([role="none"])')).toHaveCount(0)
  await expect(pager.getByLabel('Go to page 1')).toHaveAttribute('aria-current', 'page')
  // the arrow that leads nowhere says so, and the keys still reach it
  await pager.getByLabel('Go to page 1').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(pager.getByLabel('Go to previous page')).toBeFocused()
  await expect(pager.getByLabel('Go to previous page')).toHaveAttribute('aria-disabled', 'true')

  await pager.getByLabel('Go to page 3').click()
  await expect(shown).toHaveText('3')
  await pager.getByLabel('Go to next page').click()
  await expect(shown).toHaveText('4')
  await expect(pager.locator('[aria-current="page"]')).toHaveText('4')

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

test('never hides the page shown on a small screen, also with two places', async ({ page }) => {
  await page.goto('blocks/?pagination=2/12/1,2/12/12,3/12/12')
  const shown = page.locator('.page-item.active')
  await expect(shown).toHaveText(['1', '12', '12'])
  await expect(page.locator('.page-item.active.bv-d-sm-down-none')).toHaveCount(0)
  // with three places the page before the last still gives way
  await expect(page.locator('.bv-d-sm-down-none')).toHaveText(['11'])
})

test('keeps the focus at the page chosen by the keyboard', async ({ page }) => {
  await page.goto('blocks/?pagination=5/12/3')
  const pager = page.getByRole('menubar')

  // the pages shown move on: the focus stays with page 5, now the one shown
  await pager.getByLabel('Go to page 5').focus()
  await page.keyboard.press('Enter')
  await expect(pager.locator('[aria-current="page"]')).toHaveText('5')
  await expect(pager.getByLabel('Go to page 5')).toBeFocused()

  // the arrow that led to the last page leads nowhere now: the focus goes to that page
  await pager.getByLabel('Go to page 7').click()
  await expect(pager.locator('[aria-current="page"]')).toHaveText('7')
  for (const shown of ['8', '9', '10', '11', '12']) {
    await pager.getByLabel('Go to next page').focus()
    await page.keyboard.press('Enter')
    await expect(pager.locator('[aria-current="page"]')).toHaveText(shown)
  }
  await expect(pager.getByLabel('Go to page 12')).toBeFocused()
})
