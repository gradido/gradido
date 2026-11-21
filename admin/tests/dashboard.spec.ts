// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import { Kind, type OperationDefinitionNode, parse, print } from 'graphql'
import de from '../src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn, WALLET_NEWS_FIELDS } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

// the three counts in "Meine Gruppen" (MG1), and everything open beside them
const counts = (
  forModeration: number,
  forMember: number,
  allOpen: number,
  everythingOpen = forModeration + forMember,
) => ({
  waitingForModeration: { contributionCount: forModeration },
  waitingForMember: { contributionCount: forMember },
  allOpen: { contributionCount: allOpen },
  everythingOpen: { contributionCount: everythingOpen },
})

/** The documents the page posts to the server, as they went out. */
const posted = (page: Page) => {
  const documents: string[] = []
  page.on('request', (request) => {
    if (request.url().endsWith('/graphql') && request.method() === 'POST') {
      documents.push(request.postDataJSON().query)
    }
  })
  return documents
}

/** The group filter each root field of a document asks with, by its alias. */
const groupFilters = (document: string) =>
  Object.fromEntries(
    (parse(document).definitions[0] as OperationDefinitionNode).selectionSet.selections.flatMap(
      (selection) => {
        if (selection.kind !== Kind.FIELD) {
          return []
        }
        const filter = selection.arguments?.find(({ name }) => name.value === 'filter')
        const group =
          filter?.value.kind === Kind.OBJECT
            ? filter.value.fields.find(({ name }) => name.value === 'creationGroup')
            : undefined
        return [[(selection.alias ?? selection.name).value, group ? print(group.value) : null]]
      },
    ),
  )

const badge = (page: Page) =>
  page.locator('nav.navbar').getByRole('link', { name: de.creation }).locator('.badge')
const supportBadge = (page: Page) =>
  page.locator('nav.navbar').getByRole('link', { name: de.navbar.support }).locator('.badge')

// the support's count (K3, K4), in "Meine Gruppen" and beyond it (MG2)
const support = (
  forModeration: number,
  forMember: number,
  onResubmission = 0,
  elsewhere = 0,
  elsewhereOnResubmission = 0,
) => ({
  adminCountOpenSupportTickets: {
    forModeration,
    forMember,
    onResubmission,
    elsewhere,
    elsewhereOnResubmission,
  },
})

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({ ...signedInAnswers(), ...support(0, 0) })
  await serveWalletAssets(page)
})

test('a sign-in without a page to go to lands here', async ({ page, graphql }) => {
  graphql.answer(counts(0, 0, 0))
  await signIn(page, '')
  await expect(page).toHaveURL(/\/admin\/$/)
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
})

test('counts what is open today, and what waits for whom', async ({ page, graphql }) => {
  graphql.answer(counts(2, 1, 5))
  await signIn(page, '/')

  const today = page.getByTestId('open-creations')
  await expect(today).toHaveText(de.dashboard.today.replace('{n}', '3'))
  await expect(today).toHaveAttribute('href', '/admin/creation-confirm')
  await expect(page.getByTestId('waiting-for-moderation')).toHaveText('2 warten auf die Moderation')
  await expect(page.getByTestId('waiting-for-member')).toHaveText('1 wartet auf das Mitglied')
  await expect(page.getByTestId('on-resubmission')).toHaveText(
    de.dashboard.resubmission.replace('{n}', '2'),
  )
  // the badge in the bar counts the same
  await expect(badge(page)).toHaveText('3')
  // the support's count is asked beside the creation's, so its place among them is not fixed
  const supportCount = 'adminCountOpenSupportTickets'
  expect(
    graphql
      .sent()
      .map(({ field }) => field)
      .filter((field) => field !== supportCount && !WALLET_NEWS_FIELDS.includes(field)),
  ).toEqual([
    'verifyLogin',
    'waitingForModeration',
    'waitingForMember',
    'allOpen',
    'everythingOpen',
    'handledCreationGroups',
  ])
  expect(graphql.sentFor(supportCount)).toHaveLength(1)
})

// "Meine Gruppen" (MG1)
test('counts in "Meine Gruppen", everything open beside, in one request', async ({
  page,
  graphql,
}) => {
  graphql.answer(counts(2, 1, 5))
  const documents = posted(page)
  await signIn(page, '/')
  await expect(page.getByTestId('open-creations')).toBeVisible()

  const countings = documents.filter((document) => document.includes('waitingForModeration'))
  expect(countings).toHaveLength(1)
  expect(groupFilters(countings[0])).toEqual({
    waitingForModeration: '"*handled"',
    waitingForMember: '"*handled"',
    allOpen: '"*handled"',
    everythingOpen: null,
    handledCreationGroups: null,
  })
})

test('names what is open in other groups, quietly and below the creation, where a choice is made', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    ...counts(2, 1, 5, 7),
    handledCreationGroups: { groupIds: [3], untagged: true },
    adminCountOpenSupportTickets: {
      forModeration: 1,
      forMember: 0,
      onResubmission: 0,
      elsewhere: 0,
      elsewhereOnResubmission: 0,
    },
  })
  await signIn(page, '/')

  await expect(page.getByTestId('open-elsewhere')).toHaveText(
    de.dashboard.elsewhere.replace('{n}', '4'),
  )
  await expect(page.getByTestId('open-elsewhere').locator('a')).toHaveCount(0)
  // the badge counts "Meine Gruppen", as the line above
  await expect(badge(page)).toHaveText('3')
  expect(
    await page
      .locator('.admin-dashboard [data-test]')
      .evaluateAll((lines) => lines.map((line) => line.getAttribute('data-test'))),
  ).toEqual([
    'open-creations',
    'open-creations-waiting',
    'waiting-for-moderation',
    'waiting-for-member',
    'on-resubmission',
    'open-elsewhere',
    'open-support-tickets',
    'support-waiting',
    'support-waiting-for-moderation',
    'support-waiting-for-member',
  ])

  // the choice stays as answered above
  graphql.answer(counts(2, 1, 5, 4))
  await page.reload()
  await expect(page.getByTestId('open-elsewhere')).toHaveText(de.dashboard.elsewhereOne)
})

test('names nothing elsewhere without a choice, nor where nothing is open there', async ({
  page,
  graphql,
}) => {
  // three counts are three statements: a creation arriving between them is no rest
  graphql.answer(counts(2, 1, 5, 6))
  await signIn(page, '/')
  await expect(page.getByTestId('open-creations')).toBeVisible()
  await expect(page.getByTestId('open-elsewhere')).toHaveCount(0)

  graphql.answer({
    ...counts(2, 1, 5, 3),
    handledCreationGroups: { groupIds: [3], untagged: false },
  })
  await page.reload()
  await expect(page.getByTestId('open-creations')).toBeVisible()
  await expect(page.getByTestId('open-elsewhere')).toHaveCount(0)
})

test('names one open creation as one, and every line at 0', async ({ page, graphql }) => {
  graphql.answer(counts(1, 0, 1))
  await signIn(page, '/')

  await expect(page.getByTestId('open-creations')).toHaveText(de.dashboard.todayOne)
  await expect(page.getByTestId('waiting-for-moderation')).toHaveText('1 wartet auf die Moderation')
  await expect(page.getByTestId('waiting-for-member')).toHaveText('0 warten auf das Mitglied')
  await expect(page.getByTestId('on-resubmission')).toHaveCount(0)
})

test('says when nothing is open', async ({ page, graphql }) => {
  graphql.answer(counts(0, 0, 0))
  await signIn(page, '/')

  await expect(page.getByTestId('open-creations')).toHaveText(de.dashboard.todayNone)
  await expect(page.getByTestId('open-creations-waiting')).toHaveCount(0)
  await expect(page.getByTestId('on-resubmission')).toHaveCount(0)
  await expect(badge(page)).toBeHidden()
})

test('counts nothing less than nothing on resubmission', async ({ page, graphql }) => {
  // the three counts are three statements: a creation may change between them
  graphql.answer(counts(2, 1, 2))
  await signIn(page, '/')
  await expect(page.getByTestId('open-creations')).toHaveText(
    de.dashboard.today.replace('{n}', '3'),
  )
  await expect(page.getByTestId('on-resubmission')).toHaveCount(0)
})

test('reports failed counts, and shows none', async ({ page, graphql }) => {
  graphql.answer({
    waitingForModeration: new Failure('no database'),
    waitingForMember: new Failure('no database'),
    allOpen: new Failure('no database'),
    everythingOpen: new Failure('no database'),
  })
  await signIn(page, '/')

  await expect(page.getByRole('alert')).toContainText('no database')
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
  await expect(page.getByTestId('open-creations')).toHaveCount(0)
})

test('counts the open support requests below the creation, and what waits for whom', async ({
  page,
  graphql,
}) => {
  graphql.answer({ ...counts(2, 1, 5), ...support(3, 1) })
  await signIn(page, '/')

  const open = page.getByTestId('open-support-tickets')
  await expect(open).toHaveText(de.dashboard.support.replace('{n}', '4'))
  await expect(open).toHaveAttribute('href', '/admin/support')
  await expect(page.getByTestId('support-waiting-for-moderation')).toHaveText(
    '3 warten auf die Moderation',
  )
  await expect(page.getByTestId('support-waiting-for-member')).toHaveText(
    '1 wartet auf das Mitglied',
  )
  // below every line of the creation
  expect(
    await page
      .locator('.admin-dashboard [data-test]')
      .evaluateAll((lines) => lines.map((line) => line.getAttribute('data-test'))),
  ).toEqual([
    'open-creations',
    'open-creations-waiting',
    'waiting-for-moderation',
    'waiting-for-member',
    'on-resubmission',
    'open-support-tickets',
    'support-waiting',
    'support-waiting-for-moderation',
    'support-waiting-for-member',
  ])
  // the badge at the support's menu entry counts the same
  await expect(supportBadge(page)).toHaveText('4')
})

test('names the support requests on resubmission in a line of their own, not in the count', async ({
  page,
  graphql,
}) => {
  graphql.answer({ ...counts(2, 1, 5), ...support(3, 1, 2) })
  await signIn(page, '/')

  await expect(page.getByTestId('open-support-tickets')).toHaveText(
    de.dashboard.support.replace('{n}', '4'),
  )
  await expect(page.getByTestId('support-on-resubmission')).toHaveText(
    de.dashboard.resubmission.replace('{n}', '2'),
  )
  // the last line of the support, as of the creation
  expect(
    await page
      .locator('.admin-dashboard [data-test]')
      .evaluateAll((lines) => lines.map((line) => line.getAttribute('data-test'))),
  ).toEqual([
    'open-creations',
    'open-creations-waiting',
    'waiting-for-moderation',
    'waiting-for-member',
    'on-resubmission',
    'open-support-tickets',
    'support-waiting',
    'support-waiting-for-moderation',
    'support-waiting-for-member',
    'support-on-resubmission',
  ])
  await expect(supportBadge(page)).toHaveText('4')

  graphql.answer(support(3, 1, 0))
  await page.reload()
  await expect(page.getByTestId('open-support-tickets')).toBeVisible()
  await expect(page.getByTestId('support-on-resubmission')).toHaveCount(0)
})

// "Meine Gruppen" (MG2): the support's lines count the chosen groups, and below them, quietly and
// without a link, what is open elsewhere -- in the same form as the creation's line
test('names the support requests open in other groups, quietly and below the support (MG2)', async ({
  page,
  graphql,
}) => {
  graphql.answer({ ...counts(2, 1, 5), ...support(3, 1, 2, 6, 1) })
  await signIn(page, '/')

  const elsewhere = page.getByTestId('support-open-elsewhere')
  await expect(elsewhere).toHaveText('In anderen Gruppen: 6 offene Anfragen')
  await expect(elsewhere.locator('a')).toHaveCount(0)
  await expect(elsewhere).toHaveClass(/\btext-body-secondary\b/)
  // the number counts "Meine Gruppen" alone, and so does the badge
  await expect(page.getByTestId('open-support-tickets')).toHaveText(
    de.dashboard.support.replace('{n}', '4'),
  )
  await expect(supportBadge(page)).toHaveText('4')
  expect(
    await page
      .locator('.admin-dashboard [data-test]')
      .evaluateAll((lines) => lines.map((line) => line.getAttribute('data-test'))),
  ).toEqual([
    'open-creations',
    'open-creations-waiting',
    'waiting-for-moderation',
    'waiting-for-member',
    'on-resubmission',
    'open-support-tickets',
    'support-waiting',
    'support-waiting-for-moderation',
    'support-waiting-for-member',
    'support-on-resubmission',
    'support-open-elsewhere',
  ])
  // still one question for the support's counts
  expect(graphql.sentFor('adminCountOpenSupportTickets')).toHaveLength(1)

  graphql.answer(support(3, 1, 0, 1))
  await page.reload()
  await expect(elsewhere).toHaveText('In anderen Gruppen: eine offene Anfrage')

  // nothing open elsewhere -- and nothing ever for whoever chose nothing: the server says 0
  graphql.answer(support(3, 1, 0, 0, 2))
  await page.reload()
  await expect(page.getByTestId('open-support-tickets')).toBeVisible()
  await expect(elsewhere).toHaveCount(0)
})

test('names one open support request as one, and says when none is open', async ({
  page,
  graphql,
}) => {
  graphql.answer({ ...counts(0, 0, 0), ...support(0, 1) })
  await signIn(page, '/')

  await expect(page.getByTestId('open-support-tickets')).toHaveText(de.dashboard.supportOne)
  await expect(page.getByTestId('support-waiting-for-moderation')).toHaveText(
    '0 warten auf die Moderation',
  )
  await expect(page.getByTestId('support-waiting-for-member')).toHaveText(
    '1 wartet auf das Mitglied',
  )
  await expect(supportBadge(page)).toHaveText('1')

  graphql.answer(support(0, 0))
  await page.reload()
  await expect(page.getByTestId('open-support-tickets')).toHaveText(de.dashboard.supportNone)
  await expect(page.getByTestId('support-waiting')).toHaveCount(0)
  await expect(supportBadge(page)).toBeHidden()
})

test('puts the support below the creation only once the creation answered', async ({
  page,
  graphql,
}) => {
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  graphql.answer({
    ...counts(1, 0, 1),
    waitingForModeration: async () => {
      await held
      return { contributionCount: 1 }
    },
    ...support(2, 0),
  })
  await signIn(page, '/')

  // the support answered, the creation not yet: the badge counts, the page waits, so that
  // nothing moves down under the eye
  await expect(supportBadge(page)).toHaveText('2')
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
  await expect(page.getByTestId('open-support-tickets')).toHaveCount(0)

  release()
  await expect(page.getByTestId('open-creations')).toHaveText(de.dashboard.todayOne)
  await expect(page.getByTestId('open-support-tickets')).toHaveText(
    de.dashboard.support.replace('{n}', '2'),
  )
})

test('says when the support count failed, and keeps the creation', async ({ page, graphql }) => {
  graphql.answer({
    ...counts(2, 1, 3),
    adminCountOpenSupportTickets: new Failure('no database'),
  })
  await signIn(page, '/')

  await expect(page.getByRole('alert')).toContainText(de.support.loadFailed)
  await expect(page.getByTestId('open-creations')).toHaveText(
    de.dashboard.today.replace('{n}', '3'),
  )
  await expect(page.getByTestId('open-support-tickets')).toHaveCount(0)
  await expect(supportBadge(page)).toBeHidden()
})

// The support only for whom it is (Support-Anfragen K6): an administrator, or a moderator with the
// tick.
test.describe('the support, for an administrator or a moderator with the tick (K6)', () => {
  const withoutTick = { ...moderator, role: 'MODERATOR', handlesSupportTickets: false }
  const supportLink = (page: Page) =>
    page.locator('nav.navbar').getByRole('link', { name: de.navbar.support })
  // what the admin keeps of the sign-in, written as an older admin wrote it, then read anew
  const keep = (page: Page, state: object) =>
    page.evaluate((written) => {
      localStorage.setItem(
        'gradido-admin',
        JSON.stringify({
          ...JSON.parse(localStorage.getItem('gradido-admin') ?? '{}'),
          ...written,
        }),
      )
    }, state)

  test.beforeEach(({ graphql }) => {
    // nothing open of the creation, unless a test says otherwise
    graphql.answer(counts(0, 0, 0))
  })

  test('shows a moderator without the tick no support: no menu item, no lines, no question, no page', async ({
    page,
    graphql,
  }) => {
    graphql.answer({ ...signedInAnswers(withoutTick), ...counts(2, 1, 3) })
    await signIn(page, '/', withoutTick)

    // the page is drawn: the creation's lines stand, which the support's would follow
    await expect(page.getByTestId('open-creations')).toHaveText(
      de.dashboard.today.replace('{n}', '3'),
    )
    await expect(page.locator('nav.navbar').getByRole('link', { name: de.creation })).toBeVisible()
    await expect(supportLink(page)).toHaveCount(0)
    await expect(page.getByTestId('open-support-tickets')).toHaveCount(0)
    expect(graphql.sentFor('adminCountOpenSupportTickets')).toEqual([])

    await page.goto('support')
    await expect(page).toHaveURL(/\/admin\/not-found$/)
    expect(graphql.sentFor('adminListSupportTickets')).toEqual([])
  })

  test('shows a moderator with the tick the support', async ({ page, graphql }) => {
    const withTick = { ...withoutTick, handlesSupportTickets: true }
    graphql.answer({ ...signedInAnswers(withTick), ...counts(0, 0, 0), ...support(1, 0) })
    await signIn(page, '/', withTick)

    await expect(page.getByTestId('open-support-tickets')).toHaveText(de.dashboard.supportOne)
    await expect(supportLink(page)).toHaveAttribute('href', '/admin/support')
  })

  test('keeps an administrator the support with a state from before the tick, and a moderator none, signing nobody out', async ({
    page,
    graphql,
  }) => {
    graphql.answer(counts(0, 0, 0))
    await signIn(page, '/')
    await expect(supportLink(page)).toBeVisible()
    const { handlesSupportTickets: _left, ...before } = moderator
    await keep(page, { moderator: before })
    await page.reload()
    await expect(page).toHaveURL(/\/admin\/$/)
    await expect(supportLink(page)).toBeVisible()

    await keep(page, { moderator: { ...before, role: 'MODERATOR' } })
    await page.reload()
    await expect(page).toHaveURL(/\/admin\/$/)
    await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
    await expect(supportLink(page)).toHaveCount(0)
  })

  test('takes the support away where the server refuses its count, without a message, and keeps it so', async ({
    page,
    graphql,
  }) => {
    const withTick = { ...withoutTick, handlesSupportTickets: true }
    graphql.answer({
      ...signedInAnswers(withTick),
      ...counts(2, 1, 3),
      adminCountOpenSupportTickets: new Failure('401 Unauthorized'),
    })
    await signIn(page, '/', withTick)

    await expect(page.getByTestId('open-creations')).toHaveText(
      de.dashboard.today.replace('{n}', '3'),
    )
    await expect(supportLink(page)).toHaveCount(0)
    await expect(page.getByTestId('open-support-tickets')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
    const asked = graphql.sentFor('adminCountOpenSupportTickets').length
    expect(asked).toBe(1)

    await page.reload()
    await expect(page.getByTestId('open-creations')).toHaveText(
      de.dashboard.today.replace('{n}', '3'),
    )
    await expect(supportLink(page)).toHaveCount(0)
    expect(graphql.sentFor('adminCountOpenSupportTickets')).toHaveLength(asked)
  })

  test('takes nothing away where the count fails for another reason', async ({ page, graphql }) => {
    const withTick = { ...withoutTick, handlesSupportTickets: true }
    graphql.answer({
      ...signedInAnswers(withTick),
      ...counts(0, 0, 0),
      adminCountOpenSupportTickets: new Failure('no database'),
    })
    await signIn(page, '/', withTick)

    await expect(page.getByRole('alert')).toContainText(de.support.loadFailed)
    await expect(supportLink(page)).toBeVisible()
  })
})
