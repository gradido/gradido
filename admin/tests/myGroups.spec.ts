// AI-GENERATED — not an architecture reference
import type { Locator, Page } from '@playwright/test'
import de from '../src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

// "Meine Gruppen" (MG1, MG2b): the moderator ticks, group by group, whether they handle its
// creations and its support requests themself -- two columns, "Schöpfung" and "Support". Every tick
// is saved at once, one request at a time; twenty rows to a page (22.11.2026).

const GROUPS = [
  { id: 3, tag: 'potsdam', name: 'Potsdam' },
  { id: 5, tag: 'gd-hohestrasse', name: 'GD-Hohestraße' },
  { id: 7, tag: 'amstetten', name: 'Amstetten' },
  { id: 9, tag: 'dorf', name: 'Dorf der Zukunft' },
]

type Choice = { groupIds: number[]; untagged: boolean; off: boolean }

// the column "Support" as the column "Schöpfung", unless given apart: as migration 0178 left it
const answersWith = (groupIds: number[], untagged: boolean, support?: Choice) => ({
  creationGroups: GROUPS,
  handledCreationGroups: { groupIds, untagged, off: false },
  handledSupportGroups: support ?? { groupIds, untagged, off: false },
})

// setHandledGroups answering what it was sent, as the server stores it
const echo = (variables: Record<string, unknown>) => ({
  creation: variables.creation,
  support: variables.support,
})

// the sentence of a column below the list: what counts of it
const sentence = (column: string, state: keyof typeof de.myGroups.rule) =>
  de.myGroups.rule[state].replace('{column}', column)
const rule = (page: Page) => page.getByTestId('my-groups-rule')
const rows = (page: Page) => page.getByTestId('my-groups-list').getByTestId('my-groups-row')
// the switch of a column in the row "Selbst bearbeiten", before the groups (MG5)
const handleSwitch = (page: Page, column: string = de.creation) =>
  page.getByTestId('my-groups-handle').getByRole('switch', { name: column })
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
  off: false,
}

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    ...answersWith([3], true),
    // every tick saves itself, and the badges are asked anew after it
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 0 },
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
  await expect(rule(page)).toContainText(sentence(de.creation, 'some'))
  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'some'))
  // the switches of both columns stand on
  await expect(handleSwitch(page)).toBeChecked()
  await expect(handleSwitch(page, de.navbar.support)).toBeChecked()
  // no button: a tick saves itself; five rows want no second page
  await expect(page.getByTestId('my-groups-save')).toHaveCount(0)
  await expect(page.getByTestId('my-groups-saved')).toHaveText('')
  await expect(page.locator('.my-groups .pagination')).toHaveCount(0)
})

test('says that everything counts where nothing is ticked', async ({ page, graphql }) => {
  graphql.answer(answersWith([], false))
  await signIn(page, '/my-groups')

  await expect(rows(page)).toHaveCount(5)
  // a sentence per column: what counts of it
  await expect(rule(page)).toContainText(sentence(de.creation, 'all'))
  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'all'))
  await box(page, 'Amstetten').check()
  await expect(rule(page)).toContainText(sentence(de.creation, 'some'))
  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'all'))
  await supportBox(page, de.creationGroupFilter.untagged).check()
  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'some'))
  await box(page, 'Amstetten').uncheck()
  await expect(rule(page)).toContainText(sentence(de.creation, 'all'))
})

// MG5: "Selbst bearbeiten" -- a switch per column, off: nothing of it is the moderator's. Its ticks
// stay behind it, shown unticked and unpressable, and count again once it is on.
test('switches a column off and on, keeping its ticks, and saves each at once (MG5)', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    ...answersWith([3], true, { groupIds: [5], untagged: false, off: false }),
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 0 },
    adminCountOpenSupportTickets: NO_SUPPORT_OPEN,
  })
  await signIn(page, '/my-groups')
  await handleSwitch(page, de.navbar.support).uncheck()

  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'offSupport'))
  // the other column is as it was, the switched one waits behind the switch
  await expect(rule(page)).toContainText(sentence(de.creation, 'some'))
  await expect(supportBox(page, 'GD-Hohestraße')).toBeChecked()
  await expect(supportBox(page, 'GD-Hohestraße')).toBeDisabled()
  await expect(box(page, 'Potsdam')).toBeEnabled()
  // saved at once, the ticks with it
  await expect
    .poll(() => graphql.sentFor('setHandledGroups').map(({ variables }) => variables))
    .toEqual([
      {
        creation: { groupIds: [3], untagged: true, off: false },
        support: { groupIds: [5], untagged: false, off: true },
      },
    ])
  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
  // and on again, the ticks as they were
  await handleSwitch(page, de.navbar.support).check()
  await expect(supportBox(page, 'GD-Hohestraße')).toBeEnabled()
  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'some'))
  await expect
    .poll(() => graphql.sentFor('setHandledGroups').map(({ variables }) => variables.support))
    .toEqual([
      { groupIds: [5], untagged: false, off: true },
      { groupIds: [5], untagged: false, off: false },
    ])
})

// Opened switched off, the switch stands off and the ticks behind it wait.
test('opens with a column switched off as the server keeps it (MG5)', async ({ page, graphql }) => {
  graphql.answer({
    ...answersWith([3], true),
    handledSupportGroups: { groupIds: [5], untagged: true, off: true },
  })
  await signIn(page, '/my-groups')
  await expect(handleSwitch(page)).toBeChecked()
  await expect(handleSwitch(page, de.navbar.support)).not.toBeChecked()
  await expect(supportBox(page, 'GD-Hohestraße')).toBeDisabled()
  await expect(rule(page)).toContainText(sentence(de.navbar.support, 'offSupport'))

  // each switch over the boxes of its column, in the middle of its row
  const middleOf = async (place: Locator) => {
    const { x, y, width, height } = (await place.boundingBox()) ?? {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }
    return { x: x + width / 2, y: y + height / 2 }
  }
  const { y } = await middleOf(page.getByTestId('my-groups-handle'))
  for (const column of [de.creation, de.navbar.support]) {
    const shown = await middleOf(handleSwitch(page, column))
    expect(shown.x).toBeCloseTo((await middleOf(box(page, 'Potsdam', column))).x, 0)
    expect(Math.abs(shown.y - y)).toBeLessThanOrEqual(1)
  }
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

test('saves each tick at once, says so quietly, and asks the number at "Schöpfung" anew', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 4 },
  })
  await signIn(page, '/my-groups')
  await box(page, 'GD-Hohestraße').check()
  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
  await box(page, de.creationGroupFilter.untagged).uncheck()
  await expect.poll(() => graphql.sentFor('setHandledGroups').length).toBe(2)

  // both columns in each request; the column "Support" as it was loaded
  expect(graphql.sentFor('setHandledGroups').map(({ variables }) => variables)).toEqual([
    {
      creation: { groupIds: [3, 5], untagged: true, off: false },
      support: { groupIds: [3], untagged: true, off: false },
    },
    {
      creation: { groupIds: [3, 5], untagged: false, off: false },
      support: { groupIds: [3], untagged: true, off: false },
    },
  ])
  // no toast for a tick: the quiet line says it
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
  const counted = graphql.sentFor('adminListContributions')
  await expect.poll(() => counted.length).toBe(2)
  const handled = {
    statusFilter: ['IN_PROGRESS', 'PENDING'],
    hideResubmission: true,
    creationGroup: '*handled',
  }
  expect(counted.map(({ variables }) => variables.filter)).toEqual([handled, handled])
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
      off: false,
    },
  })
  await signIn(page, '/my-groups')
  await box(page, 'GD-Hohestraße').check()

  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
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
    ...answersWith([3], true, { groupIds: [7], untagged: false, off: false }),
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 4 },
  })
  await signIn(page, '/my-groups', withoutSupport)
  // the column "Schöpfung" alone, under the sentences of before (MG2b)
  await expect(page.getByText(de.myGroups.intro)).toBeVisible()
  await expect(page.getByTestId('my-groups-head')).toHaveText(de.creation)
  await expect(row(page, 'Potsdam').getByRole('checkbox')).toHaveCount(1)
  await expect(rule(page)).toHaveText(sentence(de.creation, 'some'))
  // what a moderator handles an administrator assigns: no switch (MG5)
  await expect(page.getByTestId('my-groups-handle')).toHaveCount(0)
  await box(page, 'GD-Hohestraße').check()

  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
  // the creation's number is asked and answered, so the save has run to its end: the support's
  // question would have gone out in the same moment
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.creation }).locator('.badge'),
  ).toHaveText('4')
  expect(graphql.sentFor('adminCountOpenSupportTickets')).toEqual([])
  // the column it does not see goes back as it came
  expect(graphql.sentFor('setHandledGroups').map(({ variables }) => variables)).toEqual([
    {
      creation: { groupIds: [3, 5], untagged: true, off: false },
      support: { groupIds: [7], untagged: false, off: false },
    },
  ])
})

// MG5: the switch is an administrator's; a moderator with the support has both columns, and no switch
test('offers a moderator with the support both columns and no switch (MG5)', async ({
  page,
  graphql,
}) => {
  const withSupport = { ...moderator, role: 'MODERATOR', handlesSupportTickets: true }
  graphql.answer(signedInAnswers(withSupport))
  await signIn(page, '/my-groups', withSupport)

  await expect(rows(page)).toHaveCount(5)
  await expect(row(page, 'Potsdam').getByRole('checkbox')).toHaveCount(2)
  await expect(page.getByTestId('my-groups-handle')).toHaveCount(0)
  await expect(page.getByRole('switch')).toHaveCount(0)
})

// One save at a time: ticks made while one is out go with the next, with the ticks of that moment,
// so no answer overtakes another and nothing ticked is lost.
test('sends one save at a time, and the ticks made meanwhile with the next', async ({
  page,
  graphql,
}) => {
  const save = holding()
  graphql.answer({
    setHandledGroups: save.answer,
    adminListContributions: { contributionCount: 1 },
    adminCountOpenSupportTickets: NO_SUPPORT_OPEN,
  })
  await signIn(page, '/my-groups')
  await box(page, 'Amstetten').check()
  await expect.poll(() => save.held.length).toBe(1)

  // the boxes stay open while it is out; two more ticks wait for its answer
  await box(page, 'Dorf der Zukunft').check()
  await supportBox(page, 'Amstetten').check()
  expect(save.held).toHaveLength(1)
  const sent = () =>
    graphql.sentFor('setHandledGroups').map(({ variables }) => variables as Record<string, unknown>)
  save.held[0](echo(sent()[0]))
  await expect.poll(() => save.held.length).toBe(2)
  await expect(page.getByTestId('my-groups-saved')).toHaveText('')
  save.held[1](echo(sent()[1]))

  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
  expect(sent()).toEqual([
    {
      creation: { groupIds: [3, 7], untagged: true, off: false },
      support: { groupIds: [3], untagged: true, off: false },
    },
    {
      creation: { groupIds: [3, 7, 9], untagged: true, off: false },
      support: { groupIds: [3, 7], untagged: true, off: false },
    },
  ])
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
      off: false,
    },
    setHandledGroups: {
      creation: { groupIds: [3, 7], untagged: true, off: false },
      support: { groupIds: [3], untagged: true, off: false },
    },
    adminListContributions: { contributionCount: 3 },
  })
  await signIn(page, '')
  await expect.poll(() => start.held.length).toBe(1)
  // on to "Meine Gruppen" while the start page still waits for its counts
  await page.getByTestId('navbar-account').getByRole('button', { name: 'Peter Lustig' }).click()
  await page.getByTestId('navbar-my-groups').click()
  await box(page, 'Amstetten').check()
  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
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
  expect(kept.handledCreationGroups).toMatchObject({ groupIds: [3, 7], untagged: true, off: false })
  expect(kept.handledSupportGroups).toMatchObject({ groupIds: [3], untagged: true, off: false })
})

// coderabbit on #4315: a later question that fails takes nothing from a save -- the save's answer,
// arriving after it, is kept. The marks of both columns work alike; the start page asks this one.
test('keeps a save whose answer comes after a later question that failed', async ({
  page,
  graphql,
}) => {
  const save = holding()
  graphql.answer({
    setHandledGroups: save.answer,
    adminListContributions: { contributionCount: 1 },
    // the start page's question, which carries the column "Schöpfung", fails
    waitingForModeration: new Failure('no database'),
    waitingForMember: { contributionCount: 0 },
    allOpen: { contributionCount: 0 },
    everythingOpen: { contributionCount: 0 },
  })
  await signIn(page, '/my-groups')
  await box(page, 'Amstetten').check()
  await expect.poll(() => save.held.length).toBe(1)

  // on to the start page while the save is on its way: its question goes out after the save
  await page.getByTestId('navbar-home').click()
  await expect(page.getByRole('alert')).toContainText('no database')
  save.held[0]({
    creation: { groupIds: [3, 7], untagged: true, off: false },
    support: { groupIds: [3], untagged: true, off: false },
  })

  await expect
    .poll(
      async () =>
        JSON.parse((await page.evaluate(() => localStorage.getItem('gradido-admin'))) ?? '{}')
          .handledCreationGroups?.groupIds,
    )
    .toEqual([3, 7])
})

test('reports a failed save, and shows the ticks the server holds', async ({ page, graphql }) => {
  graphql.answer({ setHandledGroups: new Failure('no database') })
  await signIn(page, '/my-groups')
  const order = [
    de.creationGroupFilter.untagged,
    'Potsdam',
    'Amstetten',
    'Dorf der Zukunft',
    'GD-Hohestraße',
  ]
  await expect(rows(page)).toHaveText(order)
  await box(page, 'Amstetten').check()

  await expect(page.getByRole('alert')).toContainText('no database')
  // asked anew: the server still holds "no group" and Potsdam, in the order of the page
  await expect.poll(() => graphql.sentFor('handledCreationGroups').length).toBe(2)
  await expect(box(page, 'Amstetten')).not.toBeChecked()
  await expect(box(page, 'Potsdam')).toBeChecked()
  await expect(rows(page)).toHaveText(order)
  await expect(page.getByTestId('my-groups-saved')).toHaveText('')
  expect(graphql.sentFor('adminListContributions')).toHaveLength(0)
})

// coderabbit on #4317: after a failed save the boxes wait until the stored ticks are back, so no
// tick goes out on top of what the screen shows wrongly; a question that fails is asked again
test('waits with the boxes until the stored ticks are back, asking again where that fails', async ({
  page,
  graphql,
}) => {
  let asked = 0
  graphql.answer({
    setHandledGroups: new Failure('save refused'),
    // the page's own question, then the one after the failed save, which fails once
    creationGroups: () => (++asked === 2 ? new Failure('question refused') : GROUPS),
  })
  await signIn(page, '/my-groups')
  await expect(rows(page)).toHaveCount(5)
  await box(page, 'Amstetten').check()

  await expect(page.getByRole('alert').filter({ hasText: 'save refused' })).toBeVisible()
  await expect(box(page, 'Potsdam')).toBeDisabled()
  await expect(supportBox(page, 'Potsdam')).toBeDisabled()
  await expect.poll(() => asked).toBe(3)
  await expect(box(page, 'Potsdam')).toBeEnabled()
  await expect(box(page, 'Amstetten')).not.toBeChecked()
  await expect(box(page, 'Potsdam')).toBeChecked()
  // asked again without a word of its own
  await expect(page.getByRole('alert').filter({ hasText: 'question refused' })).toHaveCount(0)
})

// coderabbit on #4317: the page left while it waits to ask again asks no more
test('stops asking for the stored ticks once the page is left', async ({ page, graphql }) => {
  let asked = 0
  graphql.answer({
    setHandledGroups: new Failure('save refused'),
    creationGroups: () => (++asked === 1 ? GROUPS : new Failure('question refused')),
    waitingForModeration: { contributionCount: 0 },
    waitingForMember: { contributionCount: 0 },
    allOpen: { contributionCount: 0 },
    everythingOpen: { contributionCount: 0 },
  })
  await signIn(page, '/my-groups')
  await expect(rows(page)).toHaveCount(5)
  await box(page, 'Amstetten').check()
  await expect.poll(() => asked).toBe(2)

  await page.getByTestId('navbar-home').click()
  await expect(page).toHaveURL(/\/admin\/$/)
  // two seconds is the pause before the next question
  await page.waitForTimeout(2500)
  expect(asked).toBe(2)
})

// coderabbit on #4317: the badges are asked anew after each save that came through, also where the
// save after it fails
test('asks the badges anew after each save that came through, also where a later one fails', async ({
  page,
  graphql,
}) => {
  const held: (() => void)[] = []
  graphql.answer({
    setHandledGroups: (variables: Record<string, unknown>) =>
      held.length === 0
        ? new Promise((resolve) => held.push(() => resolve(echo(variables))))
        : new Failure('save refused'),
    adminListContributions: { contributionCount: 7 },
  })
  await signIn(page, '/my-groups')
  await box(page, 'Amstetten').check()
  await expect.poll(() => held.length).toBe(1)
  // waits for the first save, and then fails
  await box(page, 'Dorf der Zukunft').check()
  held[0]()

  await expect(page.getByRole('alert').filter({ hasText: 'save refused' })).toBeVisible()
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.creation }).locator('.badge'),
  ).toHaveText('7')
  expect(graphql.sentFor('adminListContributions')).toHaveLength(1)
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
    ...answersWith([3], true, { groupIds: [5], untagged: false, off: false }),
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

  // the last request carries both ticks, each in its column -- and what the admin keeps is its
  // answer (waited for: the line of the first save may still stand while the second is out)
  await expect
    .poll(async () => {
      const kept = JSON.parse(
        (await page.evaluate(() => localStorage.getItem('gradido-admin'))) ?? '{}',
      )
      return [kept.handledCreationGroups?.groupIds, kept.handledSupportGroups?.groupIds]
    })
    .toEqual([[], [5, 7]])
  expect(graphql.sentFor('setHandledGroups').at(-1)?.variables).toEqual({
    creation: { groupIds: [], untagged: true, off: false },
    support: { groupIds: [5, 7], untagged: false, off: false },
  })
  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
})

// Many groups (22.11.2026): twenty rows to a page, "(ohne Gruppe)" and the ticked ones first; the
// search looks through all of them, from the first page.
test('shows twenty rows to a page, the ticked first, and searches through all', async ({
  page,
  graphql,
}) => {
  const many = Array.from({ length: 45 }, (_, index) => {
    const number = String(index + 1).padStart(2, '0')
    return { id: 100 + index, tag: `gruppe-${number}`, name: `Gruppe ${number}` }
  })
  graphql.answer({
    creationGroups: many,
    handledCreationGroups: { groupIds: [144], untagged: true, off: false },
    handledSupportGroups: { groupIds: [], untagged: false, off: false },
    setHandledGroups: echo,
    adminListContributions: { contributionCount: 1 },
    adminCountOpenSupportTickets: NO_SUPPORT_OPEN,
  })
  await signIn(page, '/my-groups')

  // 46 rows: 20, 20 and 6
  await expect(rows(page)).toHaveCount(20)
  await expect(rows(page).nth(0)).toHaveText(de.creationGroupFilter.untagged)
  await expect(rows(page).nth(1)).toHaveText('Gruppe 45')
  await expect(rows(page).nth(2)).toHaveText('Gruppe 01')

  // the pager by keyboard (coderabbit on #4317): → moves the focus, Enter turns the page, End goes
  // to the last button
  await page.getByRole('menuitem', { name: 'Go to page 1' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('menuitem', { name: 'Go to page 2' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(rows(page).first()).toHaveText('Gruppe 19')
  await page.getByRole('menuitem', { name: 'Go to page 2' }).focus()
  await page.keyboard.press('End')
  await expect(page.getByRole('menuitem', { name: 'Go to last page' })).toBeFocused()
  await page.keyboard.press('Home')
  await expect(page.getByRole('menuitem', { name: 'Go to first page' })).toBeFocused()

  await page.getByRole('menuitem', { name: 'Go to page 3' }).click()
  await expect(rows(page)).toHaveCount(6)
  await expect(rows(page).last()).toHaveText('Gruppe 44')

  // a tick on a later page is saved like any other
  await supportBox(page, 'Gruppe 44').check()
  await expect(page.getByTestId('my-groups-saved')).toHaveText(de.myGroups.saved)
  expect(graphql.sentFor('setHandledGroups').at(-1)?.variables).toMatchObject({
    support: { groupIds: [143] },
  })

  // the search, from the first page, through all groups
  await page.getByPlaceholder(de.myGroups.search).fill('Gruppe 3')
  await expect(rows(page)).toHaveText(Array.from({ length: 10 }, (_, index) => `Gruppe 3${index}`))
  await expect(page.locator('.my-groups .pagination')).toHaveCount(0)
})
