// AI-GENERATED — not an architecture reference
// The way in for somebody the admin interface hands over: it shares the wallet's origin, and
// with it the token (`auth-token` in localStorage).
import { expect, test } from './fixtures/graphql'
import { BIBI_TOKEN, bibi, landAt } from './fixtures/session'
import { text } from './fixtures/texts'

const handedOver = (token: string) => {
  localStorage.setItem('auth-token', JSON.stringify({ token, at: Date.now() }))
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
