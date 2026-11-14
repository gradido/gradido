// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import en from '../../admin/src/locales/en.json' with { type: 'json' }
import { expect, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    waitingForModeration: { contributionCount: 0 },
    waitingForMember: { contributionCount: 0 },
    allOpen: { contributionCount: 0 },
    // the support's count (K3) is asked beside the creation's by the Mithril admin
    adminCountOpenSupportTickets: { forModeration: 0, forMember: 0, onResubmission: 0 },
  })
  await serveWalletAssets(page)
})

const picture = (page: Page) => page.locator('svg[viewBox="0 0 636 324"]')
const menu = (page: Page) => page.locator('nav.navbar')
const backButton = (page: Page) => page.getByRole('button', { name: de.back })

// signed in on the dashboard, and from there to an address the admin does not know
const lost = async (page: Page) => {
  await signIn(page, '/')
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
  await page.goto('nowhere')
}

test('shows an address it does not know as not found, and goes back from there', async ({
  page,
}) => {
  await lost(page)

  await expect(picture(page)).toBeVisible()
  await expect(menu(page)).toBeVisible()
  await backButton(page).click()

  await expect(page).toHaveURL(/\/admin\/$/)
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
})

test('goes back from the picture too', async ({ page }) => {
  await lost(page)

  await picture(page).click()

  await expect(page).toHaveURL(/\/admin\/$/)
})

test('shows the page of signing out without a session, and without the menu', async ({ page }) => {
  await page.goto('logout')

  await expect(picture(page)).toBeVisible()
  // nobody signed in: the admin speaks English
  await expect(page.getByRole('button', { name: en.back })).toBeVisible()
  await expect(menu(page)).toHaveCount(0)
})

test('sends whoever is not signed in to not found', async ({ page }) => {
  await page.goto('statistic')

  await expect(page).toHaveURL(/\/admin\/not-found$/)
  await expect(picture(page)).toBeVisible()
  await expect(menu(page)).toHaveCount(0)
})

test('sends a moderator from a page for administrators to not found', async ({ page, graphql }) => {
  const plain = { ...moderator, role: 'MODERATOR' }
  graphql.answer(signedInAnswers(plain))
  await signIn(page, '/federation', plain)

  await expect(page).toHaveURL(/\/admin\/not-found$/)
  await expect(picture(page)).toBeVisible()
  await expect(menu(page)).toBeVisible()
})
