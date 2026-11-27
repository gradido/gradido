// AI-GENERATED — not an architecture reference
import de from '../src/locales/de.json' with { type: 'json' }
import { foreignCommunity, homeCommunity } from './fixtures/communities'
import { expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

// the communities as allCommunities answers them: a page, and how many there are in all
const listOf = (communities: object[], count = communities.length) => ({ count, communities })

test.beforeEach(async ({ page, graphql }) => {
  await page.clock.setFixedTime(new Date('2026-11-09T12:00:00.000Z'))
  graphql.answer({
    ...signedInAnswers(),
    allCommunities: listOf([homeCommunity, foreignCommunity]),
  })
  await serveWalletAssets(page)
})

const rows = (page: import('@playwright/test').Page) =>
  page.locator('.federation-visualize > .list-group > .list-group-item')

test('lists the communities, the own one first', async ({ page, graphql }) => {
  await signIn(page, '/federation')

  await expect(page.getByText(de.federation.gradidoInstances)).toBeVisible()
  await expect(rows(page)).toHaveCount(2)
  const home = rows(page).nth(0)
  await expect(home).toHaveClass(/list-group-item-primary/)
  await expect(rows(page).nth(1)).toHaveClass(/list-group-item-warning/)
  // verified: the own community always, a foreign one while it answered lately
  await expect(home.locator('[style*="--bs-success"]').first()).toBeVisible()
  await expect(rows(page).nth(1).locator('[style*="--bs-danger"]').first()).toBeVisible()
  await expect(home.getByRole('link', { name: 'http://localhost/api/' })).toHaveAttribute(
    'href',
    'http://localhost/api/',
  )
  await expect(home).toContainText(`${'a'.repeat(26)}…`)
  await expect(home).toContainText('Home')
  await expect(home).toContainText('vor 10 Monaten')
  await expect(rows(page).nth(1)).toContainText('vor 2 Tagen')
  expect(graphql.sentFor('allCommunities')).toEqual([
    { field: 'allCommunities', variables: { currentPage: 1, pageSize: 25 } },
  ])
})

test('says how long ago without "about", in the words of the browser', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    allCommunities: listOf([
      { ...homeCommunity, createdAt: '2026-11-09T09:00:00.000Z' },
      foreignCommunity,
    ]),
  })
  await signIn(page, '/federation')

  await expect(rows(page).nth(0)).toContainText('vor 3 Stunden')
  await expect(rows(page).nth(0)).not.toContainText('etwa')
})

test('tells the description of a community on its name', async ({ page }) => {
  await signIn(page, '/federation')
  await rows(page).nth(1).getByText('Elsewhere', { exact: true }).hover()
  await expect(page.getByRole('tooltip').filter({ hasText: 'A community far away' })).toBeVisible()
})

test('asks anew on refresh', async ({ page, graphql }) => {
  await signIn(page, '/federation')
  await expect(rows(page)).toHaveCount(2)
  await page.getByTestId('federation-communities-refresh-btn').click()
  await expect.poll(() => graphql.sentFor('allCommunities').length).toBe(2)
})

test('reports a failed list', async ({ page, graphql }) => {
  graphql.answer({ allCommunities: new Failure('no database') })
  await signIn(page, '/federation')
  await expect(page.getByRole('alert')).toContainText('no database')
})

test('opens the details of a foreign community on a click, and closes them', async ({ page }) => {
  await signIn(page, '/federation')
  const foreign = rows(page).nth(1)
  await foreign.getByText('Elsewhere', { exact: true }).click()

  const details = foreign.locator('.details')
  await expect(details).toContainText(`${de.federation.communityUuid} ${foreignCommunity.uuid}`)
  await expect(details).toContainText(
    `${de.federation.authenticatedAt} ${foreignCommunity.authenticatedAt}`,
  )
  await expect(details).toContainText(`${de.federation.publicKey} ${'b'.repeat(64)}`)
  await expect(details).toContainText(`${de.federation.hieroTopicId} 0.0.5678`)
  // a foreign community cannot be edited here
  await expect(details.getByRole('button', { name: de.edit })).toHaveCount(0)

  await foreign.getByText('Elsewhere', { exact: true }).click()
  await expect(details).toHaveCount(0)
})

test('shows a foreign community verified lately as reachable, with the date on it', async ({
  page,
  graphql,
}) => {
  graphql.answer({
    allCommunities: listOf([
      homeCommunity,
      { ...foreignCommunity, verifiedAt: '2026-11-09T11:55:00.000Z' },
    ]),
  })
  await signIn(page, '/federation')
  const foreign = rows(page).nth(1)

  await expect(foreign.locator('[style*="--bs-success"]').first()).toBeVisible()
  await foreign.getByText('vor 5 Minuten').hover()
  await expect(
    page.getByRole('tooltip').filter({ hasText: '2026-11-09T11:55:00.000Z' }),
  ).toBeVisible()
})

test('pages through the communities, 25 to a page', async ({ page, graphql }) => {
  graphql.answer({ allCommunities: listOf([homeCommunity, foreignCommunity], 30) })
  await signIn(page, '/federation')
  await expect(rows(page)).toHaveCount(2)

  await page.locator('.pagination').getByText('2', { exact: true }).click()

  await expect
    .poll(() => graphql.sentFor('allCommunities').map(({ variables }) => variables))
    .toEqual([
      { currentPage: 1, pageSize: 25 },
      { currentPage: 2, pageSize: 25 },
    ])
})

test('edits the GMS key of the own community', async ({ page, graphql }) => {
  graphql.answer({ updateHomeCommunity: { uuid: homeCommunity.uuid } })
  await signIn(page, '/federation')
  const home = rows(page).nth(0)
  await home.getByText('Home', { exact: true }).click()

  await expect(home).toContainText(`${de.federation.gmsApiKey} gms-key`)
  await expect(home).toContainText(`${de.federation.coordinates} 49.28, 9.74`)
  await home.getByRole('button', { name: de.edit }).click()

  const save = home.getByRole('button', { name: de.save })
  await expect(save).toBeDisabled()
  await home.locator('#home-community-api-key').fill('new-key')
  await expect(save).toBeEnabled()
  await save.click()

  await expect(page.getByRole('alert')).toContainText(de.federation.toast_gmsApiKeyUpdated)
  await expect(home).toContainText(`${de.federation.gmsApiKey} new-key`)
  expect(graphql.sentFor('updateHomeCommunity')).toEqual([
    {
      field: 'updateHomeCommunity',
      variables: {
        uuid: homeCommunity.uuid,
        gmsApiKey: 'new-key',
        location: { latitude: 49.28, longitude: 9.74 },
        hieroTopicId: '0.0.1234',
      },
    },
  ])
})

test('splits coordinates pasted as one, and saves them', async ({ page, graphql }) => {
  graphql.answer({ updateHomeCommunity: { uuid: homeCommunity.uuid } })
  await signIn(page, '/federation')
  const home = rows(page).nth(0)
  await home.getByText('Home', { exact: true }).click()
  await home.getByRole('button', { name: de.edit }).click()

  await home.locator('#home-community-latitude-longitude-smart').fill('52.52, 13.405')
  await expect(home.locator('#home-community-latitude')).toHaveValue('52.52')
  await expect(home.locator('#home-community-longitude')).toHaveValue('13.405')
  await home.getByRole('button', { name: de.save }).click()

  await expect(page.getByRole('alert')).toContainText(de.federation.toast_gmsLocationUpdated)
  expect(graphql.sentFor('updateHomeCommunity')[0].variables.location).toEqual({
    latitude: 52.52,
    longitude: 13.405,
  })
})

test('clears the coordinates as none', async ({ page, graphql }) => {
  graphql.answer({ updateHomeCommunity: { uuid: homeCommunity.uuid } })
  await signIn(page, '/federation')
  const home = rows(page).nth(0)
  await home.getByText('Home', { exact: true }).click()
  await home.getByRole('button', { name: de.edit }).click()

  await home.locator('#home-community-latitude').fill('')
  await home.locator('#home-community-longitude').fill('')
  await home.getByRole('button', { name: de.save }).click()

  await expect.poll(() => graphql.sentFor('updateHomeCommunity').length).toBe(1)
  expect(graphql.sentFor('updateHomeCommunity')[0].variables.location).toBeNull()
})

test('keeps the save away while only one coordinate is given', async ({ page }) => {
  await signIn(page, '/federation')
  const home = rows(page).nth(0)
  await home.getByText('Home', { exact: true }).click()
  await home.getByRole('button', { name: de.edit }).click()

  await home.locator('#home-community-longitude').fill('')
  await expect(home.getByText(de['geo-coordinates']['both-or-none'])).toBeVisible()
  await expect(home.getByRole('button', { name: de.save })).toBeDisabled()
})

test('closing an edit takes back what was typed', async ({ page, graphql }) => {
  await signIn(page, '/federation')
  const home = rows(page).nth(0)
  await home.getByText('Home', { exact: true }).click()
  await home.getByRole('button', { name: de.edit }).click()
  await home.locator('#home-community-api-key').fill('typed')
  await home.getByRole('button', { name: de.close }).click()

  await expect(home).toContainText(`${de.federation.gmsApiKey} gms-key`)
  expect(graphql.sentFor('updateHomeCommunity')).toEqual([])
})

test('keeps what is typed into a field, the others follow it', async ({ page }) => {
  await signIn(page, '/federation')
  const home = rows(page).nth(0)
  await home.getByText('Home', { exact: true }).click()
  await home.getByRole('button', { name: de.edit }).click()
  const line = home.locator('#home-community-latitude-longitude-smart')
  const latitude = home.locator('#home-community-latitude')
  const longitude = home.locator('#home-community-longitude')

  await latitude.fill('')
  await latitude.pressSequentially('52.75')
  await expect(latitude).toHaveValue('52.75')
  await expect(line).toHaveValue('52.75, 9.74')

  // the line emptied leaves the two numbers as they are
  await line.fill('')
  await expect(latitude).toHaveValue('52.75')
  await expect(longitude).toHaveValue('9.74')

  await line.pressSequentially('1.5, 2.5')
  await expect(line).toHaveValue('1.5, 2.5')
  await expect(latitude).toHaveValue('1.5')
  await expect(longitude).toHaveValue('2.5')
})
