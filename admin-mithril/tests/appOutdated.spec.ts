// AI-GENERATED — not an architecture reference
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

const counts = {
  waitingForModeration: { contributionCount: 0 },
  waitingForMember: { contributionCount: 0 },
  allOpen: { contributionCount: 0 },
}

test.beforeEach(async ({ page, graphql }) => {
  // the support's count (K3) is asked beside the creation's by the Mithril admin
  graphql.answer({
    ...signedInAnswers(),
    ...counts,
    adminCountOpenSupportTickets: { forModeration: 0, forMember: 0, onResubmission: 0 },
  })
  await serveWalletAssets(page)
})

test('offers a reload where the server no longer takes what this version asks', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    waitingForModeration: new Failure('Cannot query field', 'GRAPHQL_VALIDATION_FAILED'),
  })
  await signIn(page, '/')

  const bar = page.getByTestId('app-outdated-bar')
  await expect(bar).toHaveText(`${de.appOutdated.text}${de.appOutdated.reload}`)

  // the newer version answers as the moderator asks for it, never before
  graphql.answer(counts)
  await Promise.all([
    page.waitForEvent('load'),
    bar.getByRole('button', { name: de.appOutdated.reload }).click(),
  ])
  await expect(page.getByText(de.dashboard.welcome)).toBeVisible()
  await expect(bar).toHaveCount(0)
})

test('says nothing of a reload where something else failed', async ({ page, graphql }) => {
  graphql.answer({ waitingForModeration: new Failure('Not allowed', 'FORBIDDEN') })
  await signIn(page, '/')

  await expect(page.getByRole('alert')).toContainText('Not allowed')
  await expect(page.getByTestId('app-outdated-bar')).toHaveCount(0)
})
