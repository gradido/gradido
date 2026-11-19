// AI-GENERATED — not an architecture reference
import { expect, test } from './fixtures/graphql'
import { samePicture } from './fixtures/picture'

// The first spec, and the proof that the harness reaches the wallet: nobody signed in, no answer
// of the backend needed. What signing in does belongs to the pull request that ports the page.
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
