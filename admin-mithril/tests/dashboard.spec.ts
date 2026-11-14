// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

const counts = (forModeration: number, forMember: number, allOpen: number) => ({
  waitingForModeration: { contributionCount: forModeration },
  waitingForMember: { contributionCount: forMember },
  allOpen: { contributionCount: allOpen },
})

const badge = (page: Page) =>
  page.locator('nav.navbar').getByRole('link', { name: de.creation }).locator('.badge')
const supportBadge = (page: Page) =>
  page.locator('nav.navbar').getByRole('link', { name: de.navbar.support }).locator('.badge')

// The support requests (Support-Anfragen K3) stand on the start page of the Mithril admin only:
// the old admin is no longer brought along (AGENTS.md, SUA-002). It does not ask for them.
const ONLY_NEW = 'the support requests exist in the Mithril admin only (SUA-002)'
const support = (forModeration: number, forMember: number) => ({
  adminCountOpenSupportTickets: { forModeration, forMember },
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

test('counts what is open today, and what waits for whom', async ({ page, graphql }, info) => {
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
      .filter((field) => field !== supportCount),
  ).toEqual(['verifyLogin', 'waitingForModeration', 'waitingForMember', 'allOpen'])
  expect(graphql.sentFor(supportCount)).toHaveLength(info.project.name === 'old' ? 0 : 1)
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
  })
  await signIn(page, '/')

  await expect(page.getByRole('alert')).toContainText('no database')
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
  await expect(page.getByTestId('open-creations')).toHaveCount(0)
})

test('counts the open support requests below the creation, and what waits for whom', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
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

test('names one open support request as one, and says when none is open', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
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
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
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

test('says when the support count failed, and keeps the creation', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
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
