// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import adminPackage from '../package.json' with { type: 'json' }
import de from '../src/locales/de.json' with { type: 'json' }
import en from '../src/locales/en.json' with { type: 'json' }
import { listContributionLinks } from './fixtures/contributionLinks'
import { expect, Failure, test } from './fixtures/graphql'
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

test('stays English where the words of the language cannot be fetched', async ({ page }) => {
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
    de.navbar.support,
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
  // signed in: the sign-in saves the state itself, and would overwrite what is written below
  await expect(creation).toBeVisible()
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

// "Meine Gruppen" (MG1): below the appearance, above "Mein Konto"; a moderator with an assigned
// scope has none (myGroups.spec.ts)
test('offers "Meine Gruppen" in the moderator’s menu, and leads there', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    creationGroups: [],
    handledCreationGroups: { groupIds: [], untagged: false, off: false },
  })
  await signIn(page, '/contribution-links')
  const account = page.getByTestId('navbar-account')
  await account.getByRole('button', { name: 'Peter Lustig' }).click()

  await expect(
    account.locator('.dropdown-menu [role=menuitem], .dropdown-menu [role=menuitemradio]'),
  ).toHaveText([
    de.navbar.theme.system,
    de.navbar.theme.light,
    de.navbar.theme.dark,
    de.navbar.myGroups,
    de.navbar['my-account'],
    de.navbar.logout,
  ])
  await page.getByTestId('navbar-my-groups').click()
  await expect(page).toHaveURL(/\/admin\/my-groups$/)
  await expect(page.getByRole('heading', { name: de.myGroups.title })).toBeVisible()
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

// In the window's upper right corner the face lay under what comes down there: the admin's own
// messages and the notifications of the computer (Bernd, 15.11.2026).
test('puts the moderator’s menu right after the pages at the desk', async ({ page }) => {
  await signIn(page, '/contribution-links')
  const pages = await page.locator('#nav-collapse > .navbar-nav').boundingBox()
  const account = await page.getByTestId('navbar-account').boundingBox()
  if (!pages || !account) {
    throw new Error('the bar is not drawn')
  }
  expect(Math.abs(account.x - (pages.x + pages.width))).toBeLessThan(1)
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
    // the version of the admin's package (CONFIG.APP_VERSION)
    footer.getByRole('link', {
      name: de.footer.app_version.replace('{version}', adminPackage.version),
    }),
  ).toHaveAttribute('href', /^https:\/\/github\.com\/gradido\/gradido\/commit\/[0-9a-f]{40}$/)
})

/**
 * What waits in the moderator's own wallet (Bernd, 16.11.2026): the wallet's three marks together,
 * a gold number on the corner of the face and behind "Mein Konto" -- asked by the bar every fifteen
 * seconds while the admin is in sight, without renewing the session.
 */
const news = (page: Page) => page.getByTestId('navbar-face-news')
const newsSentence = (n: number) => de.navbar.walletNews.split(' | ')[1].replace('{n}', String(n))
const setHidden = (page: Page, hidden: boolean) =>
  page.evaluate((value) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => value })
    document.dispatchEvent(new Event('visibilitychange'))
  }, hidden)

test('carries what waits in the wallet at the face, and behind "Mein Konto"', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    walletChat: { unreadConversations: 2 },
    walletSupport: { inProgress: 1 },
    walletContributions: 1,
  })
  await signIn(page, '/contribution-links')
  const account = page.getByTestId('navbar-account')

  // the figure is for the eye; the button is called by the name and the sentence
  await expect(news(page)).toHaveText('4')
  await expect(news(page)).toHaveAttribute('aria-hidden', 'true')
  await expect(account.getByTestId('member-avatar')).toHaveText('PE')
  const button = account.getByRole('button', { name: `Peter Lustig, ${newsSentence(4)}` })
  await expect(button).toBeVisible()

  await button.click()
  const entry = page.getByTestId('navbar-wallet')
  await expect(entry.getByTestId('navbar-wallet-news')).toHaveText('4')
  await expect(entry.locator('.visually-hidden')).toHaveText(`, ${newsSentence(4)}`)
})

test('carries no number while nothing waits in the wallet', async ({ page, graphql }) => {
  await signIn(page, '/contribution-links')
  const account = page.getByTestId('navbar-account')

  // asked and answered with nothing waiting
  await expect.poll(() => graphql.sentFor('walletChat').length).toBe(1)
  await page.waitForTimeout(250)
  await expect(account.getByRole('button', { name: 'Peter Lustig', exact: true })).toBeVisible()
  await expect(news(page)).toHaveCount(0)
  await account.getByRole('button').click()
  await expect(page.getByTestId('navbar-wallet')).toHaveText(de.navbar['my-account'])
})

test('asks every fifteen seconds while in sight, and at once when it comes back', async ({
  page,
  graphql,
}) => {
  await page.clock.install()
  // the bar sets its next question only after the answer: the figure says it has taken it
  graphql.answer({ walletContributions: 1 })
  await signIn(page, '/contribution-links')
  await expect(news(page)).toHaveText('1')

  graphql.answer({ walletContributions: 2 })
  await page.clock.runFor(15000)
  await expect(news(page)).toHaveText('2')
  expect(graphql.sentFor('walletChat')).toHaveLength(2)

  // out of sight it rests
  await setHidden(page, true)
  await page.clock.runFor(60000)
  expect(graphql.sentFor('walletChat')).toHaveLength(2)

  // back in sight it asks at once
  graphql.answer({ walletContributions: 0 })
  await setHidden(page, false)
  await expect.poll(() => graphql.sentFor('walletChat').length).toBe(3)
  await expect(news(page)).toHaveCount(0)
})

test('asks nothing while the admin opens out of sight, and at once in sight', async ({
  page,
  graphql,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  })
  await signIn(page, '/contribution-links')
  await expect(page.getByTestId('navbar-account')).toBeVisible()
  expect(graphql.sentFor('walletChat')).toHaveLength(0)

  await setHidden(page, false)
  await expect.poll(() => graphql.sentFor('walletChat').length).toBe(1)
})

// ⛔ The bar's question is not the moderator doing something: ten minutes without a click of
// their own must still end the session. The moderator's own question renews it, the bar's not.
test("keeps the session's clock: the token of the bar's answer is not taken", async ({ page }) => {
  const renewed = (by: string) => tokenFor(moderator.gradidoID).replace(/signature$/, by)
  await page.route('**/graphql', async (route) => {
    const { query } = route.request().postDataJSON()
    if (query.includes('moderatorWalletNews')) {
      await route.fulfill({
        json: {
          data: {
            walletChat: { unreadConversations: 1 },
            walletSupport: { inProgress: 0 },
            walletContributions: 0,
          },
        },
        headers: { token: renewed('bar') },
      })
    } else if (query.includes('verifyLogin')) {
      await route.fulfill({
        json: { data: { verifyLogin: moderator } },
        headers: { token: renewed('moderator') },
      })
    } else {
      await route.fallback()
    }
  })
  await signIn(page, '/contribution-links')
  await expect(news(page)).toHaveText('1')

  expect(JSON.parse((await adminStorage(page))['auth-token']).token).toBe(renewed('moderator'))
})

// A sign-out in another window of the origin -- the wallet, or its session clock -- signs this
// admin out without leaving the page (authToken.ts): the number goes at once, and the bar asks
// nothing without a token.
test('goes quiet when the moderator signs out in another window', async ({ page, graphql }) => {
  graphql.answer({ walletContributions: 2 })
  await page.clock.install()
  await signIn(page, '/contribution-links')
  await expect(news(page)).toHaveText('2')

  await page.evaluate(() => {
    localStorage.removeItem('auth-token')
    window.dispatchEvent(new StorageEvent('storage', { key: 'auth-token' }))
  })
  await expect(news(page)).toHaveCount(0)
  const asked = graphql.sentFor('walletChat').length
  for (let step = 0; step < 4; step++) {
    await page.clock.runFor(15000)
    await page.waitForTimeout(250)
  }
  expect(graphql.sentFor('walletChat')).toHaveLength(asked)
})

// An ended session answers the bar's question too: the bar stops asking and signs nobody out --
// the moderator's next click of their own finds the end, as before.
// The same for an account that is gone, which the server answers with 401.
for (const [kind, message] of [
  ['has ended', '403.13 - Client certificate revoked'],
  ['is gone', '401 Unauthorized'],
]) {
  test(`stops asking when the session ${kind}, and leaves the page as it is`, async ({
    page,
    graphql,
  }) => {
    graphql.answer({ walletChat: new Failure(message) })
    await serveWallet(page)
    await page.clock.install()
    await signIn(page, '/contribution-links')
    await expect.poll(() => graphql.sentFor('walletChat').length).toBe(1)

    // the server would answer now: a bar that went on would ask, and its question needs a moment
    // of real time to reach the test's server after each step of the clock
    graphql.answer({ walletChat: { unreadConversations: 3 } })
    for (let step = 0; step < 4; step++) {
      await page.clock.runFor(15000)
      await page.waitForTimeout(250)
    }
    expect(graphql.sentFor('walletChat')).toHaveLength(1)
    await expect(news(page)).toHaveCount(0)
    await expect(page).toHaveURL(/\/admin\/contribution-links$/)
    expect((await adminStorage(page))['auth-token']).toBeDefined()
  })
}
