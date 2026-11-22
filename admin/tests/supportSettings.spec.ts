// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../src/locales/de.json' with { type: 'json' }
import { listContributionLinks } from './fixtures/contributionLinks'
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'

// Einstellungen → Support (K5, SUA-019): whether members may file new requests, for administrators
// -- off only after a question that names all requests still open, on without one. It stood above
// the support's list until 21.11.2026; there a line still says while new requests are off
// (support.spec.ts).

// the badges' count of the open tab, which the question before switching off asks anew
const OPEN = {
  forModeration: 5,
  forMember: 1,
  onResubmission: 2,
  elsewhere: 0,
  elsewhereOnResubmission: 0,
  off: false,
}

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    adminCountOpenSupportTickets: OPEN,
    // on as it comes
    supportTicketsMenu: { active: true },
  })
})

const box = (page: Page) => page.getByLabel(de.support.switch.label)
const dialog = (page: Page) => page.getByRole('dialog')
const toast = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text })
const asked = (graphql: { sentFor: (field: string) => { variables: object }[] }, field: string) =>
  graphql.sentFor(field).map((sent) => sent.variables)
const open = async (page: Page) => {
  await signIn(page, '/support-settings')
  await expect(page.getByText(de.support.switch.hint)).toBeVisible()
}

test('stands in the settings for an administrator, under "Support", ticked, with its hint', async ({
  page,
  graphql,
}) => {
  graphql.answer({ listContributionLinks: listContributionLinks([]) })
  await signIn(page, '/contribution-links')
  const settings = page.getByTestId('navbar-group-settings')
  await settings.getByRole('button').click()
  await settings.getByRole('menuitem', { name: de.navbar.support }).click()

  await expect(page).toHaveURL(/\/admin\/support-settings$/)
  await expect(page.locator('.support-settings .h2')).toHaveText(de.navbar.support)
  await expect(box(page)).toBeChecked()
  await expect(page.locator('.support-switch')).toContainText(de.support.switch.hint)
})

test('asks before switching off and names all requests still open, the waiting ones too', async ({
  page,
  graphql,
}) => {
  graphql.answer({ adminSetSupportTicketsActive: ({ active }: { active: boolean }) => active })
  await open(page)
  await box(page).click()
  await expect(dialog(page)).toContainText(de.support.switch.confirmTitle)
  await expect(dialog(page)).toContainText(de.support.switch.confirmBody)
  await expect(dialog(page)).toContainText(de.support.switch.confirmOpen.replace('{open}', '8'))
  // still on while asked
  await expect(box(page)).toBeChecked()
  expect(asked(graphql, 'adminSetSupportTicketsActive')).toEqual([])
  await dialog(page).getByRole('button', { name: de.support.switch.confirmYes }).click()
  await expect(box(page)).not.toBeChecked()
  expect(asked(graphql, 'adminSetSupportTicketsActive')).toEqual([{ active: false }])
  await expect(toast(page, de.support.switch.off)).toBeVisible()
})

// ⛔ "Meine Gruppen" is a filter of what the moderator handles, not of what is open (MG2): an
// administrator who chose names every request still open before switching off, also the others'.
test('names before switching off also the requests open and waiting beyond "Meine Gruppen" (MG2)', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    handledSupportGroups: { groupIds: [1], untagged: false, off: false },
    adminCountOpenSupportTickets: { ...OPEN, elsewhere: 7, elsewhereOnResubmission: 3, off: false },
    adminSetSupportTicketsActive: ({ active }: { active: boolean }) => active,
  })
  await open(page)
  await box(page).click()
  await expect(dialog(page)).toContainText(de.support.switch.confirmOpen.replace('{open}', '18'))
  // the badge counts "Meine Gruppen" alone
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.navbar.support }).locator('.badge'),
  ).toHaveText('6')
})

// coderabbit on #4316: one click, one question -- the box waits for the count, a second click
// while it comes asks nothing, and a question said no to does not come back
test('asks once while the count is on its way, and not again after a no', async ({
  page,
  graphql,
}) => {
  const held: ((answer: unknown) => void)[] = []
  graphql.answer({
    adminCountOpenSupportTickets: () => new Promise((resolve) => held.push(resolve)),
  })
  await open(page)
  await box(page).click()
  await expect.poll(() => held.length).toBe(1)
  await expect(box(page)).toBeDisabled()
  await box(page).click({ force: true })
  held[0](OPEN)

  await expect(dialog(page)).toContainText(de.support.switch.confirmOpen.replace('{open}', '8'))
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(box(page)).toBeEnabled()
  await expect(box(page)).toBeChecked()
  expect(held).toHaveLength(1)
  expect(asked(graphql, 'adminSetSupportTicketsActive')).toEqual([])
})

// coderabbit on #4316: a count the admin cannot read -- a server of another version -- throws; the
// question still comes, without a number, and the box does not stay waiting
test('asks without a number where the count cannot be read, and frees the box', async ({
  page,
}) => {
  await open(page)
  // past the answers of the fixture, which hold to the schema: a count in a shape the admin's
  // schema refuses
  await page.route('**/graphql', async (route) => {
    const body = route.request().postData() ?? ''
    if (body.includes('adminCountOpenSupportTickets')) {
      await route.fulfill({
        json: { data: { adminCountOpenSupportTickets: { forModeration: 'fünf' } } },
      })
    } else {
      await route.fallback()
    }
  })
  await box(page).click()

  await expect(dialog(page)).toContainText(de.support.switch.confirmBody)
  await expect(dialog(page)).not.toContainText(de.support.switch.confirmOpen.split('{')[0])
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(box(page)).toBeEnabled()
  await expect(box(page)).toBeChecked()
})

test('switches on again without asking', async ({ page, graphql }) => {
  graphql.answer({
    supportTicketsMenu: { active: false },
    adminSetSupportTicketsActive: ({ active }: { active: boolean }) => active,
  })
  await open(page)
  await expect(box(page)).not.toBeChecked()
  await box(page).click()
  await expect(box(page)).toBeChecked()
  await expect(dialog(page)).toHaveCount(0)
  expect(asked(graphql, 'adminSetSupportTicketsActive')).toEqual([{ active: true }])
  await expect(toast(page, de.support.switch.on)).toBeVisible()
})

test('stays on where the administrator says no, and where the switch is refused', async ({
  page,
  graphql,
}) => {
  graphql.answer({ adminSetSupportTicketsActive: new Failure('no database') })
  await open(page)
  await box(page).click()
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(box(page)).toBeChecked()
  expect(asked(graphql, 'adminSetSupportTicketsActive')).toEqual([])
  await box(page).click()
  await dialog(page).getByRole('button', { name: de.support.switch.confirmYes }).click()
  await expect(toast(page, de.support.failed)).toBeVisible()
  await expect(box(page)).toBeChecked()
})

test('says where the server could not say, and shows no box', async ({ page, graphql }) => {
  graphql.answer({ supportTicketsMenu: null })
  await signIn(page, '/support-settings')
  await expect(toast(page, de.support.failed)).toBeVisible()
  await expect(box(page)).toHaveCount(0)
})

// the settings are the administrators'
test('sends a moderator to not found', async ({ page, graphql }) => {
  const asModerator = { ...moderator, role: 'MODERATOR' }
  graphql.answer(signedInAnswers(asModerator))
  await signIn(page, '/support-settings', asModerator)
  await expect(page).toHaveURL(/\/admin\/not-found$/)
  expect(asked(graphql, 'adminSetSupportTicketsActive')).toEqual([])
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 320, height: 900 } })

  // The word fits one line at 375 px in Chrome on a Mac and on an iPhone (measured in the built
  // admin, 14.11.2026); with a wider font it breaks into two. At 320 px it breaks on any font, so
  // that is where it is held: the box stands beside its word, also over two lines, and the row
  // stays inside the window.
  test('keeps the box beside its word, and the row inside the window', async ({ page }) => {
    await open(page)
    const box = await page.locator('#support-tickets-active').boundingBox()
    const word = await page.locator('label[for="support-tickets-active"]').boundingBox()
    if (!box || !word) {
      throw new Error('the switch row is not drawn')
    }
    expect(word.x).toBeGreaterThan(box.x + box.width)
    expect(word.y).toBeLessThan(box.y + box.height)
    expect(word.x + word.width).toBeLessThanOrEqual(320)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
  })
})
