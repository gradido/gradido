// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import en from '../../admin/src/locales/en.json' with { type: 'json' }
import { listContributionLinks } from './fixtures/contributionLinks'
import { expect, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn, tokenFor } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

const desk = { width: 1400, height: 900 }
const phone = { width: 390, height: 900 }

// The wallet, on another origin in development (0.0.0.0, the default host): a page of its own.
const serveWallet = (page: Page) =>
  page.route(/^http:\/\/0\.0\.0\.0:\d+\//, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>wallet</p>' }),
  )

/** What the admin keeps in localStorage on its own origin, after it was left. */
const adminStorage = async (page: Page) => {
  const { origins } = await page.context().storageState()
  const admin = origins.find(({ origin }) => origin.startsWith('http://localhost'))
  return Object.fromEntries((admin?.localStorage ?? []).map(({ name, value }) => [name, value]))
}

const menu = (page: Page, group: string) => page.getByTestId(`navbar-group-${group}`)

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({ ...signedInAnswers(), listContributionLinks: listContributionLinks([]) })
  await serveWalletAssets(page)
  await page.setViewportSize(desk)
})

test('stays English where the words of the language cannot be fetched', async ({ page }, info) => {
  test.skip(info.project.name === 'old', 'the old admin carries every language in its bundle')
  // the German words: a module of the dev server, a chunk of the build
  await page.route(/\/(locales\/de\.json|assets\/de-[\w-]+\.js)(\?|$)/, (route) => route.abort())
  await signIn(page, '/contribution-links')

  // signed in all the same, on the page asked for
  await expect(page).toHaveURL(/\/admin\/contribution-links$/)
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: en.navbar.user_search }),
  ).toBeVisible()
})

test('leads an administrator to every page', async ({ page }) => {
  await signIn(page, '/contribution-links')
  const bar = page.locator('nav.navbar')

  await expect(page.getByTestId('navbar-home')).toHaveAttribute('href', '/admin/')
  await expect(page.getByTestId('navbar-home')).toContainText('Gradido Entwicklung')
  await expect(bar.getByRole('link', { name: de.navbar.user_search })).toHaveAttribute(
    'href',
    '/admin/user',
  )
  await expect(bar.getByRole('link', { name: de.creation, exact: true })).toHaveAttribute(
    'href',
    '/admin/creation-confirm',
  )

  await menu(page, 'information').getByRole('button').click()
  const information = menu(page, 'information').locator('.dropdown-menu')
  await expect(information).toBeVisible()
  await expect(information.locator('a')).toHaveText([
    de.navbar.instances,
    de.navbar.statistic,
    de.help.help,
  ])
  await expect(information.locator('a').nth(0)).toHaveAttribute('href', '/admin/federation')
  await expect(information.locator('a').nth(2)).toHaveAttribute('target', '_blank')

  await menu(page, 'settings').getByRole('button').click()
  await expect(information).toBeHidden()
  const settings = menu(page, 'settings').locator('.dropdown-menu a')
  await expect(settings).toHaveText([
    de.navbar.automaticContributions,
    de.navbar.projectBranding,
    de.navbar.creationGroups,
    de.navbar.crea,
    de.navbar.chat,
  ])
  await expect(settings.nth(1)).toHaveAttribute('title', de.navbar.projectBrandingTooltip)
})

test('closes a menu on Escape and on a click beside it', async ({ page }) => {
  await signIn(page, '/contribution-links')
  const information = menu(page, 'information').locator('.dropdown-menu')

  await menu(page, 'information').getByRole('button').click()
  await expect(information).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(information).toBeHidden()

  await menu(page, 'information').getByRole('button').click()
  await expect(information).toBeVisible()
  // somewhere on the page below the bar
  await page.mouse.click(700, 700)
  await expect(information).toBeHidden()
})

test('marks the page that is open, and its menu', async ({ page }) => {
  await signIn(page, '/contribution-links')
  // the old admin marks it only once the page is opened anew, not right after the sign-in
  await page.reload()

  await expect(menu(page, 'settings').getByRole('button')).toHaveClass(/\bactive\b/)
  await expect(menu(page, 'information').getByRole('button')).not.toHaveClass(/\bactive\b/)
  await menu(page, 'settings').getByRole('button').click()
  await expect(
    menu(page, 'settings').getByRole('menuitem', { name: de.navbar.automaticContributions }),
  ).toHaveClass(/\bactive\b/)
})

test('gives a moderator the starting balances in the bar, and no settings', async ({
  page,
  graphql,
}) => {
  const notAnAdmin = { ...moderator, role: 'MODERATOR' }
  graphql.answer(signedInAnswers(notAnAdmin))
  await signIn(page, '/contribution-links', notAnAdmin)

  const startingBalances = page
    .locator('nav.navbar')
    .getByRole('link', { name: de.navbar.automaticContributions })
  await expect(startingBalances).toHaveAttribute('href', '/admin/contribution-links')
  await expect(startingBalances).toHaveClass(/\bactive\b/)
  await expect(menu(page, 'settings')).toHaveCount(0)
  await menu(page, 'information').getByRole('button').click()
  await expect(menu(page, 'information').locator('.dropdown-menu a')).toHaveText([
    de.navbar.statistic,
    de.help.help,
  ])
})

test('counts the open creations', async ({ page }) => {
  const creation = page.locator('nav.navbar').getByRole('link', { name: de.creation })
  await signIn(page, '/contribution-links')
  await expect(creation.locator('.badge')).toBeHidden()

  // as the admin keeps them from the last time
  await page.evaluate(() =>
    localStorage.setItem(
      'gradido-admin',
      JSON.stringify({
        ...JSON.parse(localStorage.getItem('gradido-admin') ?? '{}'),
        openCreations: 3,
      }),
    ),
  )
  await page.reload()
  await expect(creation.locator('.badge')).toHaveText('3')
  await expect(creation.locator('.badge')).toHaveClass(/text-bg-danger/)
})

test('shows who is signed in, and switches light and dark', async ({ page }) => {
  await signIn(page, '/contribution-links')
  const account = page.getByTestId('navbar-account')
  await expect(account.getByTestId('member-avatar')).toHaveText('PE')

  await account.getByRole('button', { name: 'Peter Lustig' }).click()
  await expect(account.locator('.navbar-account-name')).toHaveText('Peter Lustig')
  await expect(account.locator('.navbar-account-role')).toHaveText(de.userRole.selectRoles.admin)
  await expect(page.getByTestId('navbar-theme-system')).toHaveAttribute('aria-checked', 'true')

  await page.getByTestId('navbar-theme-dark').click()
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark')
  await expect(page.getByTestId('navbar-theme-dark')).toBeHidden()
  expect(await page.evaluate(() => localStorage.getItem('gradido-theme-mode'))).toBe('dark')

  await account.getByRole('button', { name: 'Peter Lustig' }).click()
  await expect(page.getByTestId('navbar-theme-dark')).toHaveAttribute('aria-checked', 'true')
  await page.getByTestId('navbar-theme-light').click()
  await expect(page.locator('html')).not.toHaveAttribute('data-bs-theme', 'dark')
})

test('takes the wallet a change of light and dark made there', async ({ page }) => {
  await signIn(page, '/contribution-links')
  // another tab of the origin writes the key: this one hears it as a storage event
  await page.evaluate(() => {
    localStorage.setItem('gradido-theme-mode', 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: 'gradido-theme-mode' }))
  })
  await expect(page.locator('html')).toHaveAttribute('data-bs-theme', 'dark')
})

test('goes over to the wallet with the token, signed out here', async ({ page }) => {
  await serveWallet(page)
  await signIn(page, '/contribution-links')
  await page.getByTestId('navbar-account').getByRole('button').click()
  await page.getByTestId('navbar-wallet').click()

  await expect(page).toHaveURL(
    new RegExp(`^http://0\\.0\\.0\\.0:\\d+/authenticate\\?token=${tokenFor(moderator.gradidoID)}$`),
  )
  // on another origin the token went in the address, and this admin signed out
  const storage = await adminStorage(page)
  expect(storage['auth-token']).toBeUndefined()
  expect(storage['gradido-admin']).toBeUndefined()
})

test('signs out, and goes to the login of the wallet', async ({ page, graphql }) => {
  graphql.answer({ logout: true })
  await serveWallet(page)
  await signIn(page, '/contribution-links')
  await page.getByTestId('navbar-account').getByRole('button').click()
  await page.getByTestId('navbar-logout').click()

  await expect(page).toHaveURL(/^http:\/\/0\.0\.0\.0:\d+\/login$/)
  const storage = await adminStorage(page)
  expect(storage['auth-token']).toBeUndefined()
  expect(storage['gradido-admin']).toBeUndefined()
})

test('on a phone, folds the pages into a list that a choice closes', async ({ page }) => {
  await page.setViewportSize(phone)
  await signIn(page, '/contribution-links')
  const list = page.locator('#nav-collapse')
  const opener = page.getByTestId('navbar-menu-opener')

  await expect(list).toBeHidden()
  await expect(opener).toHaveAttribute('aria-label', de.navbar.menu)
  // the moderator's own menu stays in the bar
  await expect(page.getByTestId('navbar-account')).toBeVisible()

  await opener.click()
  await expect(list).toBeVisible()
  await expect(opener).toHaveAttribute('aria-expanded', 'true')
  await expect(list.locator('.navbar-group-heading')).toHaveText([
    de.navbar.information,
    de.navbar.settings,
  ])
  await expect(menu(page, 'information')).toBeHidden()

  // also the page that is open already, which changes no route
  await list.locator('.navbar-group-entry').getByText(de.navbar.automaticContributions).click()
  await expect(list).toBeHidden()
})

test('names the year, the community site and the version below the page', async ({ page }) => {
  await signIn(page, '/contribution-links')
  const footer = page.locator('.copyright')

  await expect(footer).toContainText(`© ${new Date().getFullYear()}`)
  await expect(footer.getByRole('link', { name: de.footer.copyright.link })).toHaveAttribute(
    'href',
    'https://gradido.net/de',
  )
  await expect(
    footer.getByRole('link', { name: de.footer.app_version.replace('{version}', '3.1.5') }),
  ).toHaveAttribute('href', /^https:\/\/github\.com\/gradido\/gradido\/commit\/[0-9a-f]{40}$/)
})
