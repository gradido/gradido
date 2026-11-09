// AI-GENERATED — not an architecture reference
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { communityFigureSeries, communityFigures, communityStatistics } from './fixtures/figures'
import { expect, Failure, test } from './fixtures/graphql'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

// Berlin: the first moment of a day there lies on the evening before in UTC
test.use({ timezoneId: 'Europe/Berlin' })

const NOW = new Date('2026-11-09T12:00:00.000Z')

// the answers as the server gives them: each for the moment it was asked
test.beforeEach(async ({ page, graphql }) => {
  await page.clock.setFixedTime(NOW)
  graphql.answer({
    ...signedInAnswers(),
    communityFigures: ({ since }: Record<string, unknown>) => communityFigures(since as string),
    communityStatistics,
    communityFigureSeries: ({ since }: Record<string, unknown>) =>
      communityFigureSeries(since as string),
  })
  await serveWalletAssets(page)
})

const cells = (row: import('@playwright/test').Locator) => row.locator('th, td')

test('asks for the figures of the last four weeks, and shows them in their groups', async ({
  page,
  graphql,
}) => {
  await signIn(page, '/statistic')

  const field = page.getByTestId('figures-since')
  await expect(field).toHaveValue('2026-10-12')
  await expect(field).toHaveAttribute('max', '2026-11-09')
  const table = page.getByTestId('figures')
  await expect(table.locator('thead th')).toHaveText(['', 'seit 12.10.2026', '7 Tage', 'gesamt'])
  await expect(cells(table.getByTestId('figure-accountsNew'))).toHaveText([
    'Neue Konten',
    '3',
    '1',
    '1.234',
  ])
  // a figure without a value in a column, and one this admin has no label for
  await expect(cells(table.getByTestId('figure-accountsViaLink'))).toContainText(['–'])
  await expect(table.getByTestId('figure-futureFigure')).toHaveCount(0)
  // the groups that came, in their order; one whose rows did not come stands not at all
  await expect(table.locator('.figures-group')).toHaveText([
    de.figures.group.accounts,
    de.figures.group.thanks,
    de.figures.group.totals,
  ])

  // the first moment of the day in Berlin; the weeks from the day at 00:00 UTC
  await expect
    .poll(() =>
      graphql
        .sent()
        .map(({ field }) => field)
        .sort(),
    )
    .toEqual(['communityFigureSeries', 'communityFigures', 'communityStatistics', 'verifyLogin'])
  expect(graphql.sentFor('communityFigures')[0].variables).toEqual({
    since: '2026-10-11T22:00:00.000Z',
  })
  expect(graphql.sentFor('communityFigureSeries')[0].variables).toEqual({
    since: '2026-10-12T00:00:00.000Z',
  })
})

test('shows the totals in their column only, as GDD with two places', async ({ page }) => {
  await signIn(page, '/statistic')
  const table = page.getByTestId('figures')
  await expect(cells(table.getByTestId('figure-totalGradidoCreated'))).toHaveText([
    de.figures.row.totalGradidoCreated,
    '–',
    '–',
    '1.234,50',
  ])
  await expect(cells(table.getByTestId('figure-activeUsers'))).toHaveText([
    de.figures.row.activeUsers,
    '–',
    '–',
    '1.100',
  ])
})

test('shows the weeks below, the running one marked', async ({ page }) => {
  await signIn(page, '/statistic')
  const weeks = page.getByTestId('figures-weeks')

  await expect(weeks.locator('thead th')).toHaveText([
    '',
    '26.10.2026',
    '2.11.2026',
    `9.11.2026 ${de.figures.weekCurrent}`,
  ])
  await expect(cells(weeks.getByTestId('week-figure-accountsNew'))).toHaveText([
    'Neue Konten',
    '1',
    '0',
    '2',
  ])
  await expect(cells(weeks.getByTestId('week-figure-activeAccounts'))).toHaveText([
    de.figures.row.activeAccountsWeekly,
    '4',
    '5',
    '6',
  ])
  await expect(weeks.locator('.figures-group th')).toHaveText([
    de.figures.group.accounts,
    de.figures.group.thanks,
  ])
})

test('leaves out the totals where they fail, the rest stands', async ({ page, graphql }) => {
  graphql.answer({ communityStatistics: new Failure('too slow') })
  await signIn(page, '/statistic')

  await expect(page.getByRole('alert')).toContainText('too slow')
  await expect(page.getByTestId('figures-weeks')).toBeVisible()
  await expect(page.getByTestId('figure-totalGradidoCreated')).toHaveCount(0)
  await expect(page.getByTestId('figure-accountsNew')).toBeVisible()
})

test('reports failed figures, and shows no table', async ({ page, graphql }) => {
  graphql.answer({ communityFigures: new Failure('no database') })
  await signIn(page, '/statistic')

  await expect(page.getByRole('alert').first()).toContainText('no database')
  await expect(page.getByTestId('figures-since')).toBeVisible()
  await expect(page.getByTestId('figures')).toHaveCount(0)
  await expect(page.getByTestId('figures-copy')).toHaveCount(0)
})

test('asks anew for another day, and keeps the day on this device', async ({ page, graphql }) => {
  await signIn(page, '/statistic')
  await expect(page.getByTestId('figure-accountsNew')).toBeVisible()

  await page.getByTestId('figures-since').fill('2026-11-02')
  await expect(page.getByTestId('figures').locator('thead th').nth(1)).toHaveText('seit 2.11.2026')
  expect(graphql.sentFor('communityFigures').at(-1)?.variables).toEqual({
    since: '2026-11-01T23:00:00.000Z',
  })
  expect(graphql.sentFor('communityFigureSeries').at(-1)?.variables).toEqual({
    since: '2026-11-02T00:00:00.000Z',
  })

  await page.reload()
  await expect(page.getByTestId('figures-since')).toHaveValue('2026-11-02')
})

test('asks nothing while the field holds no day', async ({ page, graphql }) => {
  await signIn(page, '/statistic')
  await expect(page.getByTestId('figures-weeks')).toBeVisible()
  const asked = graphql.sent().length

  await page.getByTestId('figures-since').fill('')
  await expect(page.getByTestId('figure-accountsNew')).toBeVisible()
  await expect(page.getByTestId('figures').locator('thead th').nth(1)).toHaveText('seit 12.10.2026')
  expect(graphql.sent().length).toBe(asked)
})

// The block for the weekly mail: what the tables say, as lines of text.
const REVIEW = [
  'Statistik · 9.11.2026',
  'seit 12.10.2026 · 7 Tage · gesamt',
  '',
  'Konten',
  'Neue Konten: 3 · 1 · 1.234',
  'davon über Einlöse-Link: 2 · – · 40',
  'Aktive Konten (gesamt: 30 Tage): 7 · 5 · 9',
  '',
  'Danken',
  'Sendungen: 12 · 4 · 5.600',
  'GDD gesendet: 300 · 100 · 25.000',
  '',
  'Gesamt',
  'GDD insgesamt geschöpft, genau: – · – · 1.234,50',
  'GDD insgesamt verfallen: – · – · 80,25',
  'GDD insgesamt im Umlauf: – · – · 1.100,10',
  'noch nicht gebuchter Verfall: – · – · 3,00',
  'Konten mit Buchungen: – · – · 1.100',
  '',
  'Nach Wochen',
  '26.10.2026 · 2.11.2026 · 9.11.2026 (läuft)',
  '',
  'Konten',
  'Neue Konten: 1 · 0 · 2',
  'Konten mit Anmeldung je Woche: 4 · 5 · 6',
  '',
  'Danken',
  'GDD gesendet: 10 · 20 · 1.500',
].join('\n')

test('copies the tables as text for the review', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await signIn(page, '/statistic')
  await expect(page.getByTestId('figures-weeks')).toBeVisible()

  await page.getByTestId('figures-copy').click()
  await expect(page.getByTestId('figures-copy-status')).toHaveText(de.figures.copied)
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(REVIEW)
  await expect(page.getByTestId('figures-copy-text')).toHaveCount(0)
})

test('offers the block to copy by hand where the clipboard refuses', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined })
  })
  await signIn(page, '/statistic')
  await expect(page.getByTestId('figures-weeks')).toBeVisible()

  await page.getByTestId('figures-copy').click()
  await expect(page.getByTestId('figures-copy-status')).toHaveText(de.figures.copyByHand)
  const block = page.getByTestId('figures-copy-text')
  await expect(block).toHaveValue(REVIEW)
  // marked, ready to copy
  expect(
    await block.evaluate((field: HTMLTextAreaElement) => field.selectionEnd - field.selectionStart),
  ).toBe(REVIEW.length)

  // new numbers take the block away
  await page.getByTestId('figures-since').fill('2026-11-02')
  await expect(block).toHaveCount(0)
  await expect(page.getByTestId('figures-copy-status')).toHaveText('')
})
