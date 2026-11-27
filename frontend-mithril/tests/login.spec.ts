// AI-GENERATED — not an architecture reference
import { expect, Failure, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'
import { BIBI_TOKEN, bibi, landAt, signIn, signInAndLandAt } from './fixtures/session'
import { text } from './fixtures/texts'

const toast = '.gdd-toaster-body'

test('offers the sign-in, and takes nothing before something is entered', async ({
  page,
  // asked for so that it answers: a request nobody expected fails the spec
  graphql: _backend,
}, info) => {
  await page.goto('login')

  await expect(page.getByTestId('forgot-password-link')).toBeVisible()
  await expect(page.locator('form button[type="submit"]')).toBeDisabled()
  await samePicture(page, info, 'login')
})

test('the start of the wallet leads to the sign-in', async ({ page, graphql: _backend }) => {
  await page.goto('')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.locator('#email-input-field')).toBeVisible()
})

test('signs in with address and password, and goes on to the overview', async ({
  page,
  graphql,
}) => {
  await page.goto('login')
  await signInAndLandAt(page, graphql, /\/overview$/)
  expect(graphql.sentFor('login')[0].variables).toMatchObject({
    email: 'bibi@bloxberg.de',
    password: 'Aa12345_',
  })
  // the token the answer carried is the session's, where both apps read it
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem('auth-token') ?? '{}'))
  expect(kept.token).toBe(BIBI_TOKEN)
})

test('does not ask for the sign-in again where the wallet starts with a session', async ({
  page,
  graphql,
}) => {
  await page.goto('login')
  await signInAndLandAt(page, graphql, /\/overview$/)
  await landAt(page, graphql, /\/overview$/, () => page.goto('login'))
  await landAt(page, graphql, /\/overview$/, () => page.goto(''))
})

test('is sent by Enter', async ({ page, graphql }) => {
  graphql.answer({ login: bibi() })
  graphql.renewToken(BIBI_TOKEN)
  await page.goto('login')
  await page.locator('#email-input-field').fill('bibi@bloxberg.de')
  await page.locator('#password-input-field').fill('Aa12345_')
  await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  await page.locator('#password-input-field').press('Enter')
  await expect.poll(() => graphql.sentFor('login').length).toBe(1)
  await page.waitForLoadState('networkidle')
  graphql.unanswered.length = 0
})

test('goes on to the page that was asked for before the sign-in, with its query', async ({
  page,
  graphql,
}) => {
  await page.goto('send/Gradido%20Entwicklung/bibi?amount=5')
  await expect(page).toHaveURL(/\/login$/)
  await signInAndLandAt(page, graphql, /\/send\/Gradido%20Entwicklung\/bibi\?amount=5$/)
})

test('goes on to the link whose code the address of the sign-in carries', async ({
  page,
  graphql,
}) => {
  await page.goto('login/c0de')
  await signInAndLandAt(page, graphql, /\/redeem\/c0de$/)
})

test('says so where address and password fit no account', async ({ page, graphql }) => {
  await page.goto('login')
  await signIn(page, graphql, new Failure('No user with this credentials'))

  await expect(page.locator(toast)).toHaveText(text('error.no-user'))
  // the form stays, with what was typed, and can be sent again
  await expect(page.locator('#email-input-field')).toHaveValue('bibi@bloxberg.de')
  await expect(page.locator('form button[type="submit"]')).toBeEnabled()
  await expect(page).toHaveURL(/\/login$/)
})

test('says what the server said where it is none of the sentences known', async ({
  page,
  graphql,
}) => {
  await page.goto('login')
  await signIn(page, graphql, new Failure('database on fire'))
  await expect(page.locator(toast)).toHaveText(`${text('error.unknown-error')} database on fire`)
})

// The two sentences are the backend's (`login` in UserResolver): one half of a contract.
for (const [sentence, subtitle] of [
  ['The Users email is not validate yet', 'message.activateEmail'],
  ['The User has not set a password yet', 'message.unsetPassword'],
] as const) {
  test(`leads to a new password where the server says "${sentence}"`, async ({
    page,
    graphql,
  }, info) => {
    await page.goto('login')
    await signIn(page, graphql, new Failure(sentence))

    await expect(page.locator(toast)).toHaveText(text('error.no-account'))
    await expect(page.locator('.test-message-headline')).toHaveText(text('message.errorTitle'))
    await expect(page.locator('.test-message-subtitle')).toHaveText(text(subtitle))
    await expect(page.locator('#email-input-field')).toHaveCount(0)
    if (subtitle === 'message.activateEmail') {
      // without the toast, which goes by itself
      await expect(page.locator(toast)).toHaveCount(0, { timeout: 10_000 })
      await samePicture(page, info, 'login-message')
    }
    await page.locator('.test-message-button').click()
    await expect(page).toHaveURL(/\/forgot-password$/)
  })
}

test('leads to the forgotten password and to the registration', async ({
  page,
  graphql: _backend,
}) => {
  await page.goto('login')
  await page.getByTestId('forgot-password-link').click()
  await expect(page).toHaveURL(/\/forgot-password$/)

  await page.goto('login')
  await page
    .locator('.login-form')
    .getByRole('link', { name: text('signup') })
    .click()
  await expect(page).toHaveURL(/\/register$/)
})
