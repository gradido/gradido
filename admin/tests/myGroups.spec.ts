// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

// "Meine Gruppen" (MG1, MG2b): the moderator ticks, group by group, whether they handle its
// creations and its support requests themself -- two columns, "Schöpfung" and "Support".

const GROUPS = [
  { id: 3, tag: 'potsdam', name: 'Potsdam' },
  { id: 5, tag: 'gd-hohestrasse', name: 'GD-Hohestraße' },
  { id: 7, tag: 'amstetten', name: 'Amstetten' },
  { id: 9, tag: 'dorf', name: 'Dorf der Zukunft' },
]

type Choice = { groupIds: number[]; untagged: boolean }

// the column "Support" as the column "Schöpfung", unless given apart: as migration 0178 left it
const answersWith = (groupIds: number[], untagged: boolean, support?: Choice) => ({
  creationGroups: GROUPS,
  handledCreationGroups: { groupIds, untagged },
  handledSupportGroups: support ?? { groupIds, untagged },
})

// setHandledGroups answering what it was sent, as the server stores it
const echo = (variables: Record<string, unknown>) => ({
  creation: { groupIds: variables.creationGroupIds, untagged: variables.creationUntagged },
  support: { groupIds: variables.supportGroupIds, untagged: variables.supportUntagged },
})

const rows = (page: Page) => page.getByTestId('my-groups-list').getByTestId('my-groups-row')
const row = (page: Page, text: string) => rows(page).filter({ hasText: text })
// a box is named by its group and its column's word, the menu's: "Schöpfung", "Support"
const box = (page: Page, text: string, column: string = de.creation) =>
  row(page, text).getByRole('checkbox', { name: column })
const supportBox = (page: Page, text: string) => box(page, text, de.navbar.support)

// an answer the test hands over when it chooses
const holding = () => {
  const held: ((answer: unknown) => void)[] = []
  return { held, answer: () => new Promise((resolve) => held.push(resolve)) }
}

// the support's count, which a save asks anew where the support is theirs (MG2)
const NO_SUPPORT_OPEN = {
  forModeration: 0,
  forMember: 0,
  onResubmission: 0,
  elsewhere: 0,
  elsewhereOnResubmission: 0,
}

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    ...answersWith([3], true),
    adminCountOpenSupportTickets: NO_SUPPORT_OPEN,
  })
  await serveWalletAssets(page)
})

test('opens with the choice the server keeps: "no group" first, then the ticked, then the rest', async ({
  page,
}) => {
  await signIn(page, '/my-groups')

  await expect(page.getByRole('heading', { name: de.myGroups.title })).toBeVisible()
  await expect(page.getByText(de.myGroups.introBoth)).toBeVisible()
  await expect(page.getByTestId('my-groups-head')).toHaveText(`${de.creation}${de.navbar.support}`)
  await expect(rows(page)).toHaveText([
    de.creationGroupFilter.untagged,
    'Potsdam',
    'Amstetten',
    'Dorf der Zukunft',
    'GD-Hohestraße',
  ])
  await expect(box(page, de.creationGroupFilter.untagged)).toBeChecked()
  await expect(box(page, 'Potsdam')).toBeChecked()
  await expect(box(page, 'Amstetten')).not.toBeChecked()
  await expect(supportBox(page, 'Potsdam')).toBeChecked()
  await expect(supportBox(page, 'Amstetten')).not.toBeChecked()
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.someBoth)
})

test('says that everything counts where nothing is ticked', async ({ page, graphql }) => {
  graphql.answer(answersWith([], false))
  await signIn(page, '/my-groups')

  await expect(rows(page)).toHaveCount(5)
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.none)
  await box(page, 'Amstetten').check()
  // one column ticked, the other not: the sentence says which counts what (MG2b)
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.someEmpty)
  await supportBox(page, de.creationGroupFilter.untagged).check()
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.someBoth)
  await box(page, 'Amstetten').uncheck()
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.someEmpty)
})

test('finds a group by name or tag, without regard to case, and says where none matches', async ({
  page,
}) => {
  await signIn(page, '/my-groups')
  const search = page.getByPlaceholder(de.myGroups.search)

  await search.fill('HOHE')
  await expect(rows(page)).toHaveText(['GD-Hohestraße'])
  await search.fill('dorf')
  await expect(rows(page)).toHaveText(['Dorf der Zukunft'])
  // the tag alone, which the name does not hold
  await search.fill('strasse')
  await expect(rows(page)).toHaveText(['GD-Hohestraße'])

  await search.fill('Imkerei')
  await expect(rows(page)).toHaveCount(0)
  await expect(page.getByTestId('my-groups-no-match')).toHaveText(de.myGroups.noMatch)
})

// the order follows what was stored when the page opened, not the ticks
test('moves nothing when a box is ticked or cleared', async ({ page }) => {
  await signIn(page, '/my-groups')
  const order = [
    de.creationGroupFilter.untagged,
    'Potsdam',
    'Amstetten',
    'Dorf der Zukunft',
    'GD-Hohestraße',
  ]
  await expect(rows(page)).toHaveText(order)

  await box(page, 'GD-Hohestraße').check()
  await box(page, 'Potsdam').uncheck()
  await supportBox(page, 'Dorf der Zukunft').check()

  await expect(box(page, 'GD-Hohestraße')).toBeChecked()
  await expect(box(page, 'Potsdam')).not.toBeChecked()
  await expect(supportBox(page, 'Potsdam')).toBeChecked()
  await expect(supportBox(page, 'Dorf der Zukunft')).toBeChecked()
  await expect(rows(page)).toHaveText(order)
})

test('saves the whole choice, says so, and asks the number at "Schöpfung" anew', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 4 },
  })
  await signIn(page, '/my-groups')
  await box(page, 'GD-Hohestraße').check()
  await box(page, de.creationGroupFilter.untagged).uncheck()

  await page.getByTestId('my-groups-save').click()

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  // both columns in one request; the column "Support" as it was loaded
  expect(graphql.sentFor('setHandledGroups').map(({ variables }) => variables)).toEqual([
    {
      creationGroupIds: [3, 5],
      creationUntagged: false,
      supportGroupIds: [3],
      supportUntagged: true,
    },
  ])
  const counted = graphql.sentFor('adminListContributions')
  expect(counted.map(({ variables }) => variables.filter)).toEqual([
    { statusFilter: ['IN_PROGRESS', 'PENDING'], hideResubmission: true, creationGroup: '*handled' },
  ])
  const badge = page
    .locator('nav.navbar')
    .getByRole('link', { name: de.creation })
    .locator('.badge')
  await expect(badge).toHaveText('4')
})

// The number at "Support" counts "Meine Gruppen" as well (MG2): a save asks it anew -- only where
// the support is the moderator's, since a refusal of its count takes the tick away.
test('asks the number at "Support" anew after a save, where the support is theirs (MG2)', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 4 },
    adminCountOpenSupportTickets: {
      forModeration: 2,
      forMember: 1,
      onResubmission: 0,
      elsewhere: 5,
      elsewhereOnResubmission: 0,
    },
  })
  await signIn(page, '/my-groups')
  await box(page, 'GD-Hohestraße').check()
  await page.getByTestId('my-groups-save').click()

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  await expect.poll(() => graphql.sentFor('adminCountOpenSupportTickets').length).toBe(1)
  const supportBadge = page
    .locator('nav.navbar')
    .getByRole('link', { name: de.navbar.support })
    .locator('.badge')
  await expect(supportBadge).toHaveText('3')
})

test('asks no number at "Support" after a save for a moderator without the support (MG2)', async ({
  page,
  graphql,
}) => {
  const withoutSupport = { ...moderator, role: 'MODERATOR', handlesSupportTickets: false }
  graphql.answer({
    ...signedInAnswers(withoutSupport),
    ...answersWith([3], true, { groupIds: [7], untagged: false }),
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 4 },
  })
  await signIn(page, '/my-groups', withoutSupport)
  // the column "Schöpfung" alone, under the sentences of before (MG2b)
  await expect(page.getByText(de.myGroups.intro)).toBeVisible()
  await expect(page.getByTestId('my-groups-head')).toHaveText(de.creation)
  await expect(row(page, 'Potsdam').getByRole('checkbox')).toHaveCount(1)
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.some)
  await box(page, 'GD-Hohestraße').check()
  await page.getByTestId('my-groups-save').click()

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  // the creation's number is asked and answered, so the save has run to its end: the support's
  // question would have gone out in the same moment
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.creation }).locator('.badge'),
  ).toHaveText('4')
  expect(graphql.sentFor('adminCountOpenSupportTickets')).toEqual([])
  // the column it does not see goes back as it came
  expect(graphql.sentFor('setHandledGroups').map(({ variables }) => variables)).toEqual([
    {
      creationGroupIds: [3, 5],
      creationUntagged: true,
      supportGroupIds: [7],
      supportUntagged: false,
    },
  ])
})

test('sends nothing on a second press while the first answer is on its way', async ({
  page,
  graphql,
}) => {
  const save = holding()
  graphql.answer({
    setHandledGroups: save.answer,
    adminListContributions: { contributionCount: 1 },
  })
  await signIn(page, '/my-groups')
  const button = page.getByTestId('my-groups-save')

  await button.click()
  await expect(button).toBeDisabled()
  // the ticks shown stay the ticks sent
  await expect(box(page, 'Amstetten')).toBeDisabled()
  await expect(box(page, de.creationGroupFilter.untagged)).toBeDisabled()
  await expect(supportBox(page, 'Amstetten')).toBeDisabled()
  await button.click({ force: true })
  await expect.poll(() => save.held.length).toBe(1)
  const kept = { groupIds: [3], untagged: true }
  save.held[0]({ creation: kept, support: kept })

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  await expect(button).toBeEnabled()
  await expect(box(page, 'Amstetten')).toBeEnabled()
  expect(graphql.sentFor('setHandledGroups')).toHaveLength(1)
})

// A question and a save each take a mark as they go out: the start page's answer, asked before a
// save and arriving after it, sets neither the number at "Schöpfung" nor the kept choice.
test('keeps the count and the choice of a save where the start page answers after it', async ({
  page,
  graphql,
}) => {
  const start = holding()
  graphql.answer({
    waitingForModeration: start.answer,
    waitingForMember: { contributionCount: 1 },
    allOpen: { contributionCount: 9 },
    everythingOpen: { contributionCount: 12 },
    adminCountOpenSupportTickets: {
      forModeration: 0,
      forMember: 0,
      onResubmission: 0,
      elsewhere: 0,
      elsewhereOnResubmission: 0,
    },
    setHandledGroups: {
      creation: { groupIds: [3, 7], untagged: true },
      support: { groupIds: [3], untagged: true },
    },
    adminListContributions: { contributionCount: 3 },
  })
  await signIn(page, '')
  await expect.poll(() => start.held.length).toBe(1)
  // on to "Meine Gruppen" while the start page still waits for its counts
  await page.getByTestId('navbar-account').getByRole('button', { name: 'Peter Lustig' }).click()
  await page.getByTestId('navbar-my-groups').click()
  await box(page, 'Amstetten').check()
  await page.getByTestId('my-groups-save').click()
  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  const menuBadge = page
    .locator('nav.navbar')
    .getByRole('link', { name: de.creation })
    .locator('.badge')
  await expect(menuBadge).toHaveText('3')

  const answered = page.waitForResponse((response) =>
    (response.request().postData() ?? '').includes('adminOpenCreationCounts'),
  )
  start.held[0]({ contributionCount: 8 })
  await answered
  // time for the page to read the answer
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)))

  await expect(menuBadge).toHaveText('3')
  const kept = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('gradido-admin'))) ?? '{}',
  )
  expect(kept.openCreations).toBe(3)
  expect(kept.handledCreationGroups).toMatchObject({ groupIds: [3, 7], untagged: true })
  expect(kept.handledSupportGroups).toMatchObject({ groupIds: [3], untagged: true })
})

test('reports a failed save, and leaves the ticks as they are', async ({ page, graphql }) => {
  graphql.answer({ setHandledGroups: new Failure('no database') })
  await signIn(page, '/my-groups')
  await box(page, 'Amstetten').check()

  await page.getByTestId('my-groups-save').click()

  await expect(page.getByRole('alert')).toContainText('no database')
  await expect(box(page, 'Amstetten')).toBeChecked()
  await expect(box(page, 'Potsdam')).toBeChecked()
  expect(graphql.sentFor('adminListContributions')).toHaveLength(0)
})

// their scope is their list
test('sends a moderator with an assigned scope to not found, and offers them no entry', async ({
  page,
  graphql,
}) => {
  const scoped = {
    ...moderator,
    role: 'MODERATOR',
    visibleCreationGroups: ['potsdam'],
    seesAllCreationGroups: false,
    seesUntagged: false,
  }
  graphql.answer(signedInAnswers(scoped))
  await signIn(page, '/my-groups', scoped)

  await expect(page).toHaveURL(/\/admin\/not-found$/)
  await page.getByTestId('navbar-account').getByRole('button').click()
  await expect(page.getByTestId('navbar-logout')).toBeVisible()
  await expect(page.getByTestId('navbar-my-groups')).toHaveCount(0)
  expect(graphql.sentFor('handledCreationGroups')).toHaveLength(0)
  expect(graphql.sentFor('handledSupportGroups')).toHaveLength(0)
})

// A state kept from before this page has no choice in it; refused, the whole state would go, the
// session with it.
test('keeps a moderator signed in whose kept state is from before "Meine Gruppen"', async ({
  page,
}) => {
  await signIn(page, '/my-groups')
  await expect(rows(page)).toHaveCount(5)
  await page.evaluate(() => {
    const {
      handledCreationGroups: _left,
      handledSupportGroups: _right,
      ...before
    } = JSON.parse(localStorage.getItem('gradido-admin') ?? '{}')
    localStorage.setItem('gradido-admin', JSON.stringify(before))
  })

  await page.reload()

  await expect(page).toHaveURL(/\/admin\/my-groups$/)
  await expect(rows(page)).toHaveCount(5)
})

// MG2b: the two columns hold their own ticks, and a save sends them apart
test('shows each column with its own ticks, and saves them apart (MG2b)', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    ...answersWith([3], true, { groupIds: [5], untagged: false }),
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 2 },
    adminCountOpenSupportTickets: NO_SUPPORT_OPEN,
  })
  await signIn(page, '/my-groups')

  // the ticked of either column first, by name
  await expect(rows(page)).toHaveText([
    de.creationGroupFilter.untagged,
    'GD-Hohestraße',
    'Potsdam',
    'Amstetten',
    'Dorf der Zukunft',
  ])
  await expect(box(page, de.creationGroupFilter.untagged)).toBeChecked()
  await expect(supportBox(page, de.creationGroupFilter.untagged)).not.toBeChecked()
  await expect(box(page, 'Potsdam')).toBeChecked()
  await expect(supportBox(page, 'Potsdam')).not.toBeChecked()
  await expect(box(page, 'GD-Hohestraße')).not.toBeChecked()
  await expect(supportBox(page, 'GD-Hohestraße')).toBeChecked()
  // each box named by its group and its column, for a screen reader
  await expect(
    page.getByRole('checkbox', { name: `GD-Hohestraße ${de.navbar.support}`, exact: true }),
  ).toBeChecked()

  await supportBox(page, 'Amstetten').check()
  await box(page, 'Potsdam').uncheck()
  await page.getByTestId('my-groups-save').click()

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  expect(graphql.sentFor('setHandledGroups').map(({ variables }) => variables)).toEqual([
    {
      creationGroupIds: [],
      creationUntagged: true,
      supportGroupIds: [5, 7],
      supportUntagged: false,
    },
  ])
  const kept = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('gradido-admin'))) ?? '{}',
  )
  expect(kept.handledCreationGroups).toMatchObject({ groupIds: [], untagged: true })
  expect(kept.handledSupportGroups).toMatchObject({ groupIds: [5, 7], untagged: false })
})
