// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { member, searchUsers } from './fixtures/users'

type Variables = Record<string, unknown>

const ALL = { byActivated: null, byDeleted: null }
const UNCONFIRMED = { byActivated: false, byDeleted: false }
// what the page asks for, without what never changes
const question = (query: string, filters: object, currentPage: number) => ({
  query,
  filters,
  currentPage,
  pageSize: 25,
  order: 'DESC',
})
const KEPT = 'gradido-admin-last-search'

const members = [
  member(1, { findableOnMap: true }),
  member(2, { emailChecked: false }),
  member(3, { deletedAt: '2026-05-01T00:00:00.000Z', findableOnMap: false }),
  member(4),
  member(5, { gradidoID: moderator.gradidoID, alias: 'peter' }),
]
const contact = { communityUuid: member(4).communityUuid, gradidoID: member(4).gradidoID }

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    searchUsers: searchUsers(members, 60),
    contactRefs: [contact],
    // the old admin asks for these on the page, and shows nothing of them
    adminOpenCreations: [],
  })
})

// What the old admin asks for as a row opens, for the forms under it -- not what these tests are
// about: answered with a failure, which the forms report.
const detailsUnanswered = {
  adminEmailStatus: new Failure('not part of this test'),
  adminListContributions: new Failure('not part of this test'),
  listTransactionLinksAdmin: new Failure('not part of this test'),
  creationGroups: new Failure('not part of this test'),
  userCreationGroups: new Failure('not part of this test'),
}

const rows = (page: Page) => page.locator('.search-user-table tbody tr.pointer')
const search = (page: Page) => page.locator('.test-input-criteria')
const lastQuestion = (graphql: { sentFor: (field: string) => { variables: Variables }[] }) =>
  graphql.sentFor('searchUsers').at(-1)?.variables
const kept = (page: Page) => page.evaluate((key) => localStorage.getItem(key), KEPT)
const keep = (page: Page, value: object) =>
  page.addInitScript(
    ([key, kept]) => localStorage.setItem(key, kept),
    [KEPT, JSON.stringify({ [moderator.gradidoID]: value })],
  )
// the three months a member can still be credited for, as the browser names them in German
const months = (page: Page) =>
  page.evaluate(() => {
    const now = new Date()
    return [2, 1, 0]
      .map((back) => (back ? new Date(now.getFullYear(), now.getMonth() - back, 1) : now))
      .map((date) => new Intl.DateTimeFormat('de', { month: 'short' }).format(date))
  })

test('lists the members of the first page, asking once', async ({ page, graphql }) => {
  await signIn(page, '/user')

  await expect(rows(page)).toHaveCount(5)
  await expect(page.getByTestId('user-search-hits')).toHaveText('60 Treffer')
  expect(graphql.sentFor('searchUsers').map((sent) => sent.variables)).toEqual([
    question('', ALL, 1),
  ])
  const heads = page.locator('.search-user-table thead th')
  await expect(heads).toHaveText([
    de.e_mail,
    de.firstname,
    de.lastname,
    de.username,
    (await months(page)).join(' | '),
    de.registered_at,
    de.status,
  ])
  const cells = rows(page).nth(0).locator('td')
  await expect(cells.nth(0)).toHaveText('member1@example.org')
  await expect(cells.nth(1)).toHaveText('First1')
  await expect(cells.nth(2)).toHaveText('Last1')
  await expect(cells.nth(3)).toContainText('member1')
  await expect(cells.nth(4)).toHaveText('1000 | 1000 | 1000')
  await expect(cells.nth(5)).toHaveText('Donnerstag, 15. Januar 2026 um 11:00')
  await expect(
    rows(page).nth(1).getByRole('img', { name: de.userStatus.emailUnconfirmed }),
  ).toBeVisible()
  await expect(rows(page).nth(2).getByRole('img', { name: de.deleted })).toBeVisible()
  await expect(rows(page).nth(0).getByRole('img')).toHaveCount(0)
})

test('asks for each text typed, from the first page, and keeps it', async ({ page, graphql }) => {
  await signIn(page, '/user')
  await expect(rows(page)).toHaveCount(5)
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()
  await expect.poll(() => lastQuestion(graphql)).toEqual(question('', ALL, 2))
  await search(page).pressSequentially('ab', { delay: 50 })

  await expect
    .poll(() =>
      graphql
        .sentFor('searchUsers')
        .slice(-2)
        .map((sent) => sent.variables),
    )
    .toEqual([question('a', ALL, 1), question('ab', ALL, 1)])
  expect(JSON.parse((await kept(page)) ?? '{}')).toEqual({
    [moderator.gradidoID]: { '/user': 'ab' },
  })
})

test('asks for the members of a tab, from the first page, and keeps it', async ({
  page,
  graphql,
}) => {
  await signIn(page, '/user')
  await page.getByRole('menuitem', { name: 'Go to page 3' }).click()
  await expect.poll(() => lastQuestion(graphql)).toEqual(question('', ALL, 3))
  await page.getByRole('tab', { name: de.userSearch.tabs.unconfirmed }).click()

  await expect.poll(() => lastQuestion(graphql)).toEqual(question('', UNCONFIRMED, 1))
  await expect(page.getByRole('tab', { selected: true })).toHaveText(de.userSearch.tabs.unconfirmed)
  expect(JSON.parse((await kept(page)) ?? '{}')).toEqual({
    [moderator.gradidoID]: { '/user#tab': 2 },
  })
})

test('empties the search with the ×', async ({ page, graphql }) => {
  await keep(page, { '/user': 'ab' })
  await signIn(page, '/user')
  await expect(search(page)).toHaveValue('ab')
  await page.getByRole('button', { name: de.search.clear }).click()

  await expect(search(page)).toHaveValue('')
  await expect.poll(() => lastQuestion(graphql)).toEqual(question('', ALL, 1))
})

test('opens with the search and the tab kept', async ({ page, graphql }) => {
  await keep(page, { '/user': 'ab', '/user#tab': 2 })
  await signIn(page, '/user')

  await expect(rows(page)).toHaveCount(5)
  await expect(search(page)).toHaveValue('ab')
  await expect(page.getByRole('tab', { selected: true })).toHaveText(de.userSearch.tabs.unconfirmed)
  expect(graphql.sentFor('searchUsers').map((sent) => sent.variables)).toEqual([
    question('ab', UNCONFIRMED, 1),
  ])
})

test('gives way to everybody where what is kept finds nobody', async ({ page, graphql }) => {
  graphql.answer({
    searchUsers: ({ query }: Variables) =>
      query === 'gone' ? searchUsers([], 0) : searchUsers(members, 60),
  })
  await keep(page, { '/user': 'gone', '/user#tab': 2 })
  await signIn(page, '/user')

  await expect(rows(page)).toHaveCount(5)
  await expect(search(page)).toHaveValue('')
  await expect(page.getByRole('tab', { selected: true })).toHaveText(de.userSearch.tabs.all)
  expect(graphql.sentFor('searchUsers').map((sent) => sent.variables)).toEqual([
    question('gone', UNCONFIRMED, 1),
    question('', ALL, 1),
  ])
})

test('keeps a search typed here, also where it finds nobody', async ({ page, graphql }) => {
  await signIn(page, '/user')
  await expect(rows(page)).toHaveCount(5)
  graphql.answer({ searchUsers: searchUsers([], 0) })
  await search(page).fill('gone')

  await expect(page.getByTestId('user-search-hits')).toHaveText('0 Treffer')
  await expect(rows(page)).toHaveCount(0)
  await expect(search(page)).toHaveValue('gone')
})

test('opens an entry link on its search, under every member', async ({ page, graphql }) => {
  await keep(page, { '/user': 'ab', '/user#tab': 2 })
  await signIn(page, '/user')
  await expect(rows(page)).toHaveCount(5)
  await page.goto('user?search=member7')

  await expect(search(page)).toHaveValue('member7')
  await expect(page.getByRole('tab', { selected: true })).toHaveText(de.userSearch.tabs.all)
  await expect.poll(() => lastQuestion(graphql)).toEqual(question('member7', ALL, 1))
})

test('reports a failed search and says no number', async ({ page, graphql }) => {
  graphql.answer({ searchUsers: new Failure('database down') })
  await signIn(page, '/user')

  await expect(page.getByRole('alert')).toContainText('database down')
  await expect(page.getByTestId('user-search-hits')).toHaveText('')
})

test('goes back to the last page where the list has become shorter', async ({ page, graphql }) => {
  graphql.answer({
    searchUsers: ({ currentPage }: Variables) => searchUsers(members, currentPage === 3 ? 30 : 60),
  })
  await signIn(page, '/user')
  await page.getByRole('menuitem', { name: 'Go to page 3' }).click()

  await expect.poll(() => lastQuestion(graphql)).toEqual(question('', ALL, 2))
  await expect(page.locator('.page-item.active')).toHaveText('2')
})

test('offers the ways into the wallet behind the usernames', async ({ page, graphql }) => {
  await signIn(page, '/user')
  const usernames = rows(page).locator('td:nth-child(4)')

  await expect(usernames.nth(3).getByTestId('member-chat-bubble')).toHaveAttribute(
    'aria-label',
    de.goTo.memberChat.replace('{name}', 'member4'),
  )
  await expect(usernames.nth(0).getByTestId('member-map-pin')).toHaveAttribute(
    'aria-label',
    de.goTo.memberMap.replace('{name}', 'member1'),
  )
  await expect(usernames.nth(0).getByTestId('member-send-arrow')).toHaveAttribute(
    'aria-label',
    de.goTo.memberSend.replace('{name}', 'member1'),
  )
  await expect(usernames.nth(1).getByRole('button')).toHaveCount(1)
  // nobody to write to: a deleted member, and the moderator themselves
  await expect(usernames.nth(2).getByRole('button')).toHaveCount(0)
  await expect(usernames.nth(4).getByRole('button')).toHaveCount(0)
  expect(graphql.sentFor('contactRefs')).toHaveLength(1)
})

test('opens the wallet on the member in a window of its own', async ({ page, graphql }) => {
  await page.addInitScript(() => {
    const opened: unknown[] = []
    Object.assign(window, { opened })
    window.open = (...args: unknown[]) => {
      opened.push(args)
      return { focus: () => undefined } as unknown as Window
    }
  })
  await signIn(page, '/user')
  await rows(page).nth(0).getByTestId('member-map-pin').click()

  const [address, name, features] = (
    (await page.evaluate(() => (window as unknown as { opened: string[][] }).opened)) as string[][]
  )[0]
  expect(new URL(address).pathname).toBe('/authenticate')
  expect(new URL(address).searchParams.get('redirect')).toBe(
    `/matching/karte?with=${member(1).gradidoID}&community=${member(1).communityUuid}&admin=%2Fuser`,
  )
  expect([name, features]).toEqual(['gradido-wallet-map', 'popup,width=1000,height=760'])
  // the press counts as a step of work: the sign-in is renewed
  await expect.poll(() => graphql.sentFor('verifyLogin').length).toBe(2)
})

test('says so where the browser keeps the window from opening', async ({ page }) => {
  await page.addInitScript(() => {
    window.open = () => null
  })
  await signIn(page, '/user')
  await rows(page).nth(1).getByTestId('member-send-arrow').click()

  await expect(page.getByRole('alert')).toContainText(de.goTo.memberMapBlocked)
})

test('opens a row with a click and closes it with another', async ({ page, graphql }) => {
  graphql.answer(detailsUnanswered)
  await signIn(page, '/user')
  await rows(page).nth(1).locator('td').nth(0).click()

  await expect(rows(page).nth(1).getByTestId('row-caret-up')).toHaveCount(1)
  await expect(page.getByTestId('row-caret-up')).toHaveCount(1)
  await rows(page).nth(0).locator('td').nth(0).click()
  await expect(rows(page).nth(0).getByTestId('row-caret-up')).toHaveCount(1)
  await expect(page.getByTestId('row-caret-up')).toHaveCount(1)
  await rows(page).nth(0).locator('td').nth(0).click()
  await expect(page.getByTestId('row-caret-up')).toHaveCount(0)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('shows every member as a card', async ({ page }) => {
    await signIn(page, '/user')
    const card = rows(page).nth(0).locator('.member-card')

    await expect(card).toContainText('First1 Last1')
    await expect(card).toContainText('member1@example.org')
    await expect(card).toContainText(`${de.registered_at} 15.1.2026`)
    const [a, b, c] = await months(page)
    await expect(card).toContainText(`${de.creation}: ${a} 1000 · ${b} 1000 · ${c} 1000`)
    await expect(card.locator('.badge')).toHaveText(de.enabled)
    await expect(rows(page).nth(2).locator('.badge')).toHaveText(de.deleted)
    await expect(page.getByRole('menuitem', { name: 'Go to first page' })).toHaveCount(0)
  })

  test('opens a card with its button', async ({ page, graphql }) => {
    graphql.answer(detailsUnanswered)
    await signIn(page, '/user')
    const button = rows(page).nth(0).getByRole('button', { name: de.show_details })
    await button.click()

    await expect(rows(page).nth(0).getByRole('button', { name: de.hide_details })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })
})
