// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

// "Meine Gruppen" (MG1): the moderator ticks the creation groups they handle themself.

const GROUPS = [
  { id: 3, tag: 'potsdam', name: 'Potsdam' },
  { id: 5, tag: 'gd-hohestrasse', name: 'GD-Hohestraße' },
  { id: 7, tag: 'amstetten', name: 'Amstetten' },
  { id: 9, tag: 'dorf', name: 'Dorf der Zukunft' },
]

const answersWith = (groupIds: number[], untagged: boolean) => ({
  creationGroups: GROUPS,
  handledCreationGroups: { groupIds, untagged },
})

const rows = (page: Page) => page.getByTestId('my-groups-list').locator('li')
const row = (page: Page, text: string) => rows(page).filter({ hasText: text })
const box = (page: Page, text: string) => row(page, text).getByRole('checkbox')

// an answer the test hands over when it chooses
const holding = () => {
  const held: ((answer: unknown) => void)[] = []
  return { held, answer: () => new Promise((resolve) => held.push(resolve)) }
}

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({ ...signedInAnswers(), ...answersWith([3], true) })
  await serveWalletAssets(page)
})

test('opens with the choice the server keeps: "no group" first, then the ticked, then the rest', async ({
  page,
}) => {
  await signIn(page, '/my-groups')

  await expect(page.getByRole('heading', { name: de.myGroups.title })).toBeVisible()
  await expect(page.getByText(de.myGroups.intro)).toBeVisible()
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
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.some)
})

test('says that everything counts where nothing is ticked', async ({ page, graphql }) => {
  graphql.answer(answersWith([], false))
  await signIn(page, '/my-groups')

  await expect(rows(page)).toHaveCount(5)
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.none)
  await box(page, 'Amstetten').check()
  await expect(page.getByTestId('my-groups-rule')).toHaveText(de.myGroups.some)
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

  await expect(box(page, 'GD-Hohestraße')).toBeChecked()
  await expect(box(page, 'Potsdam')).not.toBeChecked()
  await expect(rows(page)).toHaveText(order)
})

test('saves the whole choice, says so, and asks the number at "Schöpfung" anew', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    setHandledCreationGroups: ({ groupIds, untagged }: Record<string, unknown>) => ({
      groupIds,
      untagged,
    }),
    adminListContributions: { contributionCount: 4 },
  })
  await signIn(page, '/my-groups')
  await box(page, 'GD-Hohestraße').check()
  await box(page, de.creationGroupFilter.untagged).uncheck()

  await page.getByTestId('my-groups-save').click()

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  expect(graphql.sentFor('setHandledCreationGroups').map(({ variables }) => variables)).toEqual([
    { groupIds: [3, 5], untagged: false },
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

test('sends nothing on a second press while the first answer is on its way', async ({
  page,
  graphql,
}) => {
  const save = holding()
  graphql.answer({
    setHandledCreationGroups: save.answer,
    adminListContributions: { contributionCount: 1 },
  })
  await signIn(page, '/my-groups')
  const button = page.getByTestId('my-groups-save')

  await button.click()
  await expect(button).toBeDisabled()
  await button.click({ force: true })
  await expect.poll(() => save.held.length).toBe(1)
  save.held[0]({ groupIds: [3], untagged: true })

  await expect(page.getByRole('alert')).toContainText(de.myGroups.saved)
  await expect(button).toBeEnabled()
  expect(graphql.sentFor('setHandledCreationGroups')).toHaveLength(1)
})

test('reports a failed save, and leaves the ticks as they are', async ({ page, graphql }) => {
  graphql.answer({ setHandledCreationGroups: new Failure('no database') })
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
})

// A state kept from before this page has no choice in it; refused, the whole state would go, the
// session with it.
test('keeps a moderator signed in whose kept state is from before "Meine Gruppen"', async ({
  page,
}) => {
  await signIn(page, '/my-groups')
  await expect(rows(page)).toHaveCount(5)
  await page.evaluate(() => {
    const { handledCreationGroups: _left, ...before } = JSON.parse(
      localStorage.getItem('gradido-admin') ?? '{}',
    )
    localStorage.setItem('gradido-admin', JSON.stringify(before))
  })

  await page.reload()

  await expect(page).toHaveURL(/\/admin\/my-groups$/)
  await expect(rows(page)).toHaveCount(5)
})
