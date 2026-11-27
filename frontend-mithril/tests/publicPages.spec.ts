// AI-GENERATED — not an architecture reference
// The pages anybody may open that ask the server nothing: a Gradido address, the page of the
// community, and the one behind every address the wallet does not know.
import { expect, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'
import { text } from './fixtures/texts'

const toast = '.gdd-toaster-body'

test('a Gradido address leads on to sending and to an account, and asks nothing', async ({
  page,
  graphql,
  baseURL,
  context,
}, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('u/bibi')
  await expect(page.getByTestId('public-profile-shows')).toHaveText(
    text('public-profile.shows', { name: 'bibi' }),
  )
  await expect(page.getByTestId('public-profile-lead')).toHaveText(text('public-profile.lead'))
  await expect(page.getByTestId('public-profile-send')).toHaveAttribute(
    'href',
    '/send/Gradido%20Entwicklung/bibi',
  )
  await expect(page.getByTestId('public-profile-register')).toHaveAttribute(
    'href',
    '/register?referrer=bibi',
  )
  await expect(page.getByTestId('public-profile-duration')).toHaveText(
    text('public-profile.duration', { communityName: 'Gradido Entwicklung' }),
  )
  await expect(page.getByTestId('public-profile-echo-hint')).toHaveText(
    text('public-profile.echoHint', { name: 'bibi' }),
  )
  const host = new URL(baseURL ?? '').host
  await expect(page.getByTestId('gradido-address-host')).toHaveText(host)
  await expect(page.getByTestId('gradido-address-path')).toHaveText('/u/bibi')
  // the address names the port, which is another one for each wallet
  await samePicture(page, info, 'public-profile', [page.getByTestId('gradido-address-host')])

  // copied with its scheme: without it a phone does not offer to open it
  await page.getByTestId('gradido-address-copy').click()
  await expect(page.locator(toast)).toHaveText(text('gradidoid-copied-to-clipboard'))
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}u/bibi`)
  expect(graphql.sent()).toEqual([])
})

test('a Gradido address with an ID greets nobody by it, and promises no trace', async ({
  page,
  graphql: _backend,
}) => {
  await page.goto('u/1b2c3d4e-5f60-4a7b-8c9d-0e1f2a3b4c5d')
  await expect(page.getByTestId('public-profile-shows')).toHaveText(
    text('public-profile.showsSomebody'),
  )
  await expect(page.getByTestId('public-profile-echo-hint')).toHaveCount(0)
  await expect(page.getByTestId('public-profile-register')).toHaveAttribute('href', '/register')
})

test('a guarantor code in a Gradido address goes on to the registration with the name', async ({
  page,
  graphql: _backend,
}) => {
  await page.goto('u/bibi?guarantor=1790000600.seal-AAAA_BBBB')
  const withBoth =
    /^\/register\?(guarantor=1790000600\.seal-AAAA_BBBB&referrer=bibi|referrer=bibi&guarantor=1790000600\.seal-AAAA_BBBB)$/
  await expect(page.getByTestId('public-profile-register')).toHaveAttribute('href', withBoth)
  await expect(
    page.locator('.auth-header').getByRole('link', { name: text('signup') }),
  ).toHaveAttribute('href', withBoth)
  await expect(
    page.locator('.auth-header').getByRole('link', { name: text('signin') }),
  ).toHaveAttribute('href', /^\/login\?.*guarantor=1790000600\.seal-AAAA_BBBB/)
})

test('sending from a Gradido address asks for the sign-in first', async ({
  page,
  graphql: _backend,
}) => {
  await page.goto('u/bibi')
  await page.getByTestId('public-profile-send').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('the page of the community leads to the registration and back', async ({
  page,
  graphql: _backend,
}, info) => {
  await page.goto('register-community')
  await expect(page.locator('#register-community h1')).toHaveText('Gradido Entwicklung')
  await samePicture(page, info, 'register-community', [page.locator('.community-location')])
  await page.getByRole('link', { name: text('community.continue-to-registration') }).click()
  await expect(page).toHaveURL(/\/register$/)
  await page.goto('register-community')
  await page
    .locator('#register-community')
    .getByRole('link', { name: text('back') })
    .click()
  await expect(page).toHaveURL(/\/login$/)
})

test('an address the wallet does not know shows the drawing, and a way back', async ({
  page,
  graphql: _backend,
}, info) => {
  await page.goto('no/such/page')
  await expect(page.locator('#handboy')).toBeVisible()
  await samePicture(page, info, 'not-found')
  // the wallet started here: there is no page to go back to, so on to the overview, which
  // asks whoever is not signed in to sign in
  await page.locator('.test-back').click()
  await expect(page).toHaveURL(/\/login$/)
})

test('the way back from an unknown address is the page before it', async ({
  page,
  graphql: _backend,
}) => {
  await page.goto('register-community')
  await page.getByRole('link', { name: text('community.choose-another-community') }).click()
  await expect(page).toHaveURL(/\/select-community$/)
  await page.locator('.test-back').click()
  await expect(page).toHaveURL(/\/register-community$/)
})
