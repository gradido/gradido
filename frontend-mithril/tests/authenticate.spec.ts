// AI-GENERATED — not an architecture reference
// The way in for somebody the admin interface hands over: it shares the wallet's origin, and
// with it the token (`auth-token` in localStorage).
import { expect, Failure, test } from './fixtures/graphql'
import { BIBI_TOKEN, bibi, landAt, signInAndLandAt } from './fixtures/session'
import { text } from './fixtures/texts'

// once a tab: a sign-out loads the wallet anew, and the token is gone then
const handedOver = (token: string) => {
  if (!sessionStorage.getItem('handed-over')) {
    sessionStorage.setItem('handed-over', 'yes')
    localStorage.setItem('auth-token', JSON.stringify({ token, at: Date.now() }))
  }
}

test('takes the session the admin interface left, and goes on to the overview', async ({
  page,
  graphql,
}) => {
  graphql.answer({ verifyLogin: bibi({ alias: 'bibi', emailContact: null }) })
  graphql.renewToken(BIBI_TOKEN)
  await page.addInitScript(handedOver, BIBI_TOKEN)
  await landAt(page, graphql, /\/overview$/, () => page.goto('authenticate'))
  expect(graphql.sentFor('verifyLogin')).toHaveLength(1)

  // the member is the one the server named
  await page.goto('u/somebody')
  await expect(page.getByTestId('auth-to-account')).toContainText(text('auth.toAccount'))
  await expect(page.getByTestId('auth-to-account').locator('.app-avatar')).toHaveText('BI')
})

test('goes on to the page of the wallet the address names', async ({ page, graphql }) => {
  graphql.answer({ verifyLogin: bibi({ emailContact: null }) })
  graphql.renewToken(BIBI_TOKEN)
  await page.addInitScript(handedOver, BIBI_TOKEN)
  await landAt(page, graphql, /\/send\/Gradido%20Entwicklung\/bibi\?amount=5$/, () =>
    page.goto(
      `authenticate?redirect=${encodeURIComponent('/send/Gradido%20Entwicklung/bibi?amount=5')}`,
    ),
  )
})

test('follows no address outside of the wallet', async ({ page, graphql }) => {
  graphql.answer({ verifyLogin: bibi({ emailContact: null }) })
  graphql.renewToken(BIBI_TOKEN)
  await page.addInitScript(handedOver, BIBI_TOKEN)
  await landAt(page, graphql, /\/overview$/, () =>
    page.goto(`authenticate?redirect=${encodeURIComponent('//evil.example/x')}`),
  )
})

test('goes on to the page the address names after the sign-in, where the session has run out', async ({
  page,
  graphql,
}) => {
  graphql.answer({ verifyLogin: new Failure('401 Unauthorized') })
  await page.addInitScript(handedOver, BIBI_TOKEN)
  await page.goto(
    `authenticate?redirect=${encodeURIComponent('/send/Gradido%20Entwicklung/bibi?amount=5')}`,
  )
  await expect(page).toHaveURL(/\/login$/)
  await signInAndLandAt(page, graphql, /\/send\/Gradido%20Entwicklung\/bibi\?amount=5$/)
})

test('opens the page the address names, where the session has run out and the page is for anybody', async ({
  page,
  graphql,
}) => {
  graphql.answer({ verifyLogin: new Failure('401 Unauthorized') })
  await page.addInitScript(handedOver, BIBI_TOKEN)
  // what the page itself asks is not this spec's
  await landAt(page, graphql, /\/redeem\/abc123$/, () =>
    page.goto(`authenticate?redirect=${encodeURIComponent('/redeem/abc123')}`),
  )
  // and stays there: not led on to the sign-in
  await expect(page).toHaveURL(/\/redeem\/abc123$/)
})
