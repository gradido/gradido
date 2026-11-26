// AI-GENERATED — not an architecture reference
// The frame around every page for somebody not signed in: the bar with the logo, the picture
// on the desk, the card with language and letter size, the footer.
import { expect, Failure, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'
import { bibi, signIn, signInAndLandAt } from './fixtures/session'
import { text } from './fixtures/texts'

const isPhone = (project: string) => project.endsWith('-phone')

test('the bar leads to the registration, and the logo to the community’s start', async ({
  page,
  graphql: _backend,
  baseURL,
}, info) => {
  await page.goto('login')
  const bar = page.locator('.auth-header')
  // the page shown is named, not linked
  await expect(bar.locator('.nav-link.active')).toHaveText(text('signin'))
  await expect(bar.locator('.nav-link.active')).toHaveAttribute('aria-current', 'page')
  await expect(
    bar.getByTestId(isPhone(info.project.name) ? 'auth-home-small' : 'auth-home'),
  ).toHaveAttribute('href', baseURL ?? '')

  await bar.getByRole('link', { name: text('signup') }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(bar.locator('.nav-link.active')).toHaveText(text('signup'))
  await bar.getByRole('link', { name: text('signin') }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('the footer leads to the imprint and the privacy policy in the language shown', async ({
  page,
  graphql: _backend,
}) => {
  await page.goto('login')
  const footer = page.locator('footer')
  await expect(footer.getByRole('link', { name: text('footer.imprint') })).toHaveAttribute(
    'href',
    'https://gradido.net/de/impressum/',
  )
  await expect(footer.getByRole('link', { name: text('footer.privacy_policy') })).toHaveAttribute(
    'href',
    'https://gradido.net/de/datenschutz/',
  )
  await expect(footer.getByRole('link', { name: text('footer.eventMatching') })).toHaveAttribute(
    'href',
    '/project-matching',
  )
  for (const platform of ['Facebook', 'X', 'YouTube', 'Telegram']) {
    await expect(
      footer.getByRole('link', { name: text('footer.socialLink', { platform }) }),
    ).toHaveAttribute('target', '_blank')
  }
})

test('shows the language chosen, keeps it, and saves it to the account at the sign-in', async ({
  page,
  graphql,
}, info) => {
  await page.goto('login')
  const languages = page.locator('.language-switch')
  await expect(languages.locator('.ls-menu')).toBeHidden()
  await languages.locator('.ls-trigger').click()
  await expect(languages.locator('.ls-trigger')).toHaveAttribute('aria-expanded', 'true')
  // the one shown first, the others by their own names
  await expect(languages.locator('.ls-item-name')).toHaveText([
    'Deutsch',
    'English',
    'Español',
    'Français',
    'Italiano',
    'Nederlands',
    'Português',
    'Türkçe',
    'Ελληνικά',
    'Русский',
  ])
  await expect(languages.locator('.ls-item-active')).toHaveText('Deutsch')
  await samePicture(page, info, 'auth-languages')

  await languages.locator('.ls-item', { hasText: 'English' }).click()
  await expect(languages.locator('.ls-menu')).toBeHidden()
  await expect(languages.locator('.ls-current')).toHaveText('English')
  await expect(page.locator('form button[type="submit"]')).toHaveText(text('login', {}, 'en'))
  // nobody is signed in: nothing is saved to an account
  expect(graphql.sent()).toEqual([])

  await page.reload()
  await expect(page.locator('form button[type="submit"]')).toHaveText(text('login', {}, 'en'))

  // the account says German: the choice made before the sign-in wins, and is saved to it
  graphql.answer({ updateUserInfos: true })
  await signInAndLandAt(page, graphql, /\/overview$/)
  expect(graphql.sentFor('updateUserInfos').map(({ variables }) => variables)).toEqual([
    { locale: 'en' },
  ])
})

test('closes the list of languages by a click beside it', async ({ page, graphql: _backend }) => {
  await page.goto('login')
  await page.locator('.ls-trigger').click()
  await expect(page.locator('.ls-menu')).toBeVisible()
  await page.locator('.auth-card .card-body').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.ls-menu')).toBeHidden()
})

test('lets a keyboard choose a language, as in a menu', async ({
  page,
  graphql: _backend,
}, info) => {
  test.skip(
    info.project.name.startsWith('old'),
    'the old wallet reaches the languages by pointer only',
  )
  await page.goto('login')
  const entry = (name: string) => page.getByRole('menuitemradio', { name })
  await page.locator('.ls-trigger').focus()
  await page.keyboard.press('Enter')
  // the one shown, first, has the focus
  await expect(entry('Deutsch')).toBeFocused()
  await expect(entry('Deutsch')).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Escape')
  await expect(page.locator('.ls-menu')).toBeHidden()
  await expect(page.locator('.ls-trigger')).toBeFocused()

  await page.keyboard.press('ArrowDown')
  await expect(entry('Deutsch')).toBeFocused()
  await page.keyboard.press('End')
  await expect(entry('Русский')).toBeFocused()
  await page.keyboard.press('Home')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(entry('Français')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('.ls-menu')).toBeHidden()
  await expect(page.locator('.ls-trigger')).toBeFocused()
  // a language fetched first: the page is drawn in it once it is there, without another touch
  await expect(page.locator('.ls-current')).toHaveText('Français')
  await expect(page.locator('form button[type="submit"]')).toHaveText(text('login', {}, 'fr'))
})

test('sets the size of the letters in the card', async ({ page, graphql: _backend }, info) => {
  await page.goto('login')
  const card = page.locator('.page-font-size')
  await expect(page.locator('.popover')).toBeHidden()
  await page.locator('#popover-target-1').click()
  await expect(page.locator('.popover')).toBeVisible()
  await samePicture(page, info, 'auth-letter-size')

  await page.locator('.popover').getByText(text('125')).click()
  await expect(card).toHaveCSS('font-size', '20px')
  await page.locator('.popover').getByText(text('85')).click()
  await expect(card).toHaveCSS('font-size', '13.6px')
  await page.locator('.popover').getByText(text('100')).click()
  await expect(card).toHaveCSS('font-size', '16px')

  await page.locator('.auth-card .card-body').click({ position: { x: 5, y: 5 } })
  await expect(page.locator('.popover')).toBeHidden()
})

test('shows the three triads one after the other, twice, and stops where somebody types', async ({
  page,
  graphql: _backend,
}) => {
  await page.clock.install()
  await page.goto('login')
  // read out once, all three
  await expect(page.getByTestId('triads-spoken')).toHaveText(
    [
      'auth.triads.slogan.help',
      'auth.triads.slogan.give',
      'auth.triads.slogan.thank',
      'auth.triads.design.communityBased',
      'auth.triads.design.decentralized',
      'auth.triads.design.openSource',
      'auth.triads.purpose.youAndMe',
      'auth.triads.purpose.community',
      'auth.triads.purpose.nature',
    ]
      .map((key) => text(key))
      .join(' '),
  )
  await expect(page.getByTestId('triad-stage')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.getByTestId('triad-sizer')).toHaveCount(3)

  await expect(page.getByTestId('triad-slogan')).toBeVisible()
  const onStage = page.locator('[data-test="triad-stage"] > :not([data-test="triad-sizer"])')
  for (const shown of ['design', 'purpose', 'slogan', 'design', 'purpose', 'slogan']) {
    await page.clock.runFor(7000)
    await expect(page.getByTestId(`triad-${shown}`).last()).toBeVisible()
    // the one before it has slid out
    await expect(onStage).toHaveCount(1)
  }
  // two rounds, then the slogan stays
  await page.clock.runFor(7000)
  await expect(page.getByTestId('triad-slogan')).toBeVisible()
  await expect(page.getByTestId('triad-design')).toHaveCount(0)

  await page.reload()
  await page.locator('#email-input-field').focus()
  await page.clock.runFor(7000)
  await expect(page.getByTestId('triad-slogan')).toBeVisible()
  await expect(page.getByTestId('triad-design')).toHaveCount(0)
})

test('shows three pictures with their words on the desk, one after the other', async ({
  page,
  graphql: _backend,
}, info) => {
  test.skip(isPhone(info.project.name), 'no room for the picture on a phone')
  await page.clock.install()
  await page.goto('login')
  const shown = page.locator('.carousel-item.active')
  await expect(shown.locator('.caption-first-text')).toHaveText(text('auth.left.gratitude'))
  await expect(shown.locator('img')).toHaveAttribute('src', '/img/template/Foto_01_2400_small.jpg')
  await expect(page.locator('.bg-txt-box a')).toHaveAttribute('href', 'https://gradido.net/de')

  await page.clock.runFor(13_000)
  await expect(shown.locator('.caption-first-text')).toHaveText(text('auth.left.dignity'))
  await page.clock.runFor(13_000)
  await expect(shown.locator('.caption-first-text')).toHaveText(text('auth.left.donation'))
  await page.clock.runFor(13_000)
  await expect(shown.locator('.caption-first-text')).toHaveText(text('auth.left.gratitude'))
})

test('fetches a picture of the carousel only shortly before its turn', async ({
  page,
  graphql: _backend,
}, info) => {
  test.skip(isPhone(info.project.name), 'no room for the picture on a phone')
  test.skip(info.project.name.startsWith('old'), 'the old wallet fetches all three at once')
  const fetched: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/img/template/Foto_')) {
      fetched.push(request.url().split('/').pop() ?? '')
    }
  })
  await page.clock.install()
  await page.goto('login')
  // the event of a request may come after the picture is shown
  await expect.poll(() => fetched).toEqual(['Foto_01_2400_small.jpg'])
  // a second before: the page's time runs on while it loads
  await page.clock.runFor(9_000)
  expect(fetched).toEqual(['Foto_01_2400_small.jpg'])
  // three seconds before the turn
  await page.clock.runFor(1_000)
  await expect.poll(() => fetched).toEqual(['Foto_01_2400_small.jpg', 'Foto_05_2400_small.jpg'])
  await page.clock.runFor(3_000)
  await expect(page.locator('.carousel-item.active .caption-first-text')).toHaveText(
    text('auth.left.dignity'),
  )
  // the third only shortly before its own turn
  expect(fetched).toEqual(['Foto_01_2400_small.jpg', 'Foto_05_2400_small.jpg'])
})

test('does not turn the carousel at the first sight of a tab opened behind another', async ({
  page,
  graphql: _backend,
}, info) => {
  test.skip(isPhone(info.project.name), 'no room for the picture on a phone')
  test.skip(info.project.name.startsWith('old'), 'held for the Mithril wallet')
  const fetched: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/img/template/Foto_')) {
      fetched.push(request.url().split('/').pop() ?? '')
    }
  })
  await page.clock.install()
  await page.goto('login')
  await expect.poll(() => fetched).toEqual(['Foto_01_2400_small.jpg'])
  // the tab is seen
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(1_000)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.carousel-item.active .caption-first-text')).toHaveText(
    text('auth.left.gratitude'),
  )
  expect(fetched).toEqual(['Foto_01_2400_small.jpg'])
})

test('fetches no picture the window does not show', async ({ page, graphql: _backend }, info) => {
  test.skip(info.project.name.startsWith('old'), 'the old wallet fetches the blob on a phone too')
  const fetched: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/img/')) {
      fetched.push(request.url().split('/img/')[1])
    }
  })
  await page.clock.install()
  await page.goto('login')
  await expect(page.locator('.svg-type')).toBeVisible()
  // past the turn of the carousel, and the picture fetched ahead of it
  await page.clock.runFor(13_000)
  await page.waitForLoadState('networkidle')
  // the sign of the letter size comes with the page
  expect(fetched).not.toContain('svg/type.svg')
  if (isPhone(info.project.name)) {
    // the blob behind the logo and the carousel stand beside the form on the desk only
    expect(fetched.filter((path) => path.startsWith('template/'))).toEqual([])
  } else {
    expect(fetched).toContain('template/gradido_background_header.png')
    expect(fetched).toContain('template/Foto_01_2400_small.jpg')
  }
})

test('names the member signed in instead of the two links', async ({ page, graphql }, info) => {
  await page.goto('login')
  await signInAndLandAt(page, graphql, /\/overview$/, bibi({ alias: 'bibi' }))

  await page.goto('u/somebody')
  const toAccount = page.getByTestId('auth-to-account')
  await expect(toAccount).toContainText(text('auth.toAccount'))
  await expect(toAccount.getByRole('link')).toHaveAttribute('href', '/overview')
  // the first two letters of the user name, hidden from a screen reader: the word says it
  await expect(toAccount.locator('.app-avatar')).toHaveText('BI')
  await expect(toAccount.locator('.app-avatar')).toHaveAttribute('aria-hidden', 'true')
  await expect(page.locator('.auth-header').getByText(text('signup'))).toHaveCount(0)
  await expect(
    page.getByTestId(isPhone(info.project.name) ? 'auth-home-small' : 'auth-home'),
  ).toHaveAttribute('href', '/overview')
  // the address names the port, which is another one for each wallet
  await samePicture(page, info, 'auth-signed-in', [page.getByTestId('gradido-address-host')])
})

test('says at the sign-in why a session ended', async ({ page, graphql }, info) => {
  test.skip(info.project.name.startsWith('old'), 'the old wallet says nothing after the reload')
  await page.goto('login')
  await signInAndLandAt(page, graphql, /\/overview$/)
  await page.goto('u/somebody')
  // the server takes the session back while the member saves a language
  graphql.answer({ updateUserInfos: new Failure('403.13 - Client certificate revoked') })
  await page.locator('.ls-trigger').click()
  await page.locator('.ls-item', { hasText: 'English' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('.gdd-toaster-body')).toHaveText(
    text('error.session-expired', {}, 'en'),
  )
  await expect(page.locator('#email-input-field')).toBeVisible()
  await expect(page.getByTestId('auth-to-account')).toHaveCount(0)
})

test('is dark, and in the language chosen, from its first frame', async ({
  page,
  graphql: _backend,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem('gradido-theme-mode', 'dark')
    localStorage.setItem('gradido-frontend', JSON.stringify({ language: 'fr' }))
  })
  await page.goto('login')
  await expect(page.locator('form button[type="submit"]')).toHaveText(text('login', {}, 'fr'))
  await expect(page.locator('body')).toHaveClass(/dark-mode/)
  await expect(page.locator('.auth-logo-small, .auth-home img').first()).toHaveAttribute(
    'src',
    '/img/brand/gradido-logo-white.png',
  )
  await samePicture(page, info, 'auth-dark-french')
})

test('shows the banner of the project a sign-in is for, and hands the member over to it', async ({
  page,
  graphql,
}, info) => {
  // a pixel, as a banner
  const banner =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  graphql.answer({
    projectBrandingBanner: banner,
    authenticateHumhubAutoLogin: '/u/project-space',
  })
  await page.goto('login?project=garden')
  const shown = page.getByAltText('project banner').nth(isPhone(info.project.name) ? 1 : 0)
  await expect(shown).toBeVisible()
  await expect(shown).toHaveAttribute('src', banner)
  // in the greeting's place
  await expect(page.locator('.auth-greeting')).toHaveCount(0)
  expect(graphql.sentFor('projectBrandingBanner')[0].variables).toEqual({ project: 'garden' })

  const handedOver = page.waitForURL(/\/u\/project-space$/)
  await signIn(page, graphql)
  await handedOver
  expect(graphql.sentFor('login')[0].variables).toMatchObject({ project: 'garden' })
  expect(graphql.sentFor('authenticateHumhubAutoLogin')[0].variables).toEqual({
    project: 'garden',
  })
})

test('greets where the server knows no such project, and signs in as ever', async ({
  page,
  graphql,
}) => {
  graphql.answer({ projectBrandingBanner: new Failure('no such project') })
  await page.goto('login?project=nothing')
  await expect(page.locator('.auth-greeting')).toBeVisible()
  await expect(page.getByAltText('project banner')).toHaveCount(0)

  await signInAndLandAt(page, graphql, /\/overview$/)
  expect(graphql.sentFor('login')[0].variables.project ?? null).toBeNull()
})
