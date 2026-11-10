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

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer(signedInAnswers())
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
  expect(graphql.sent().map(({ field }) => field)).toEqual([
    'verifyLogin',
    'waitingForModeration',
    'waitingForMember',
    'allOpen',
  ])
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
