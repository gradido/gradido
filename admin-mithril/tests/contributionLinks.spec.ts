// AI-GENERATED — not an architecture reference
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { contributionLink, listContributionLinks } from './fixtures/contributionLinks'
import { expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { serveWalletAssets } from './fixtures/walletAssets'

const firstPage = { currentPage: 1, pageSize: 25, order: 'DESC' }

test.beforeEach(async ({ page, graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    listContributionLinks: listContributionLinks([
      contributionLink(1, 'Welcome'),
      contributionLink(2, 'Meetup'),
    ]),
  })
  await serveWalletAssets(page)
})

test('lists the contribution links, asking once for the first page', async ({ page, graphql }) => {
  await signIn(page, '/contribution-links')

  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.nth(0)).toContainText('Welcome')
  await expect(rows.nth(0)).toContainText('Memo of Welcome')
  await expect(rows.nth(0)).toContainText('ONCE')
  // the validity as a day in the moderator's language
  await expect(rows.nth(0)).toContainText('1.10.2026')
  await expect(rows.nth(0)).toContainText('31.12.2026')
  await expect(rows.nth(1)).toContainText('Meetup')
  expect(graphql.sentFor('listContributionLinks')).toEqual([
    { field: 'listContributionLinks', variables: firstPage },
  ])
})

test('says so where there are no contribution links', async ({ page, graphql }) => {
  graphql.answer({ listContributionLinks: listContributionLinks([]) })
  await signIn(page, '/contribution-links')

  await expect(page.getByText(de.contributionLink.noContributionLinks)).toBeVisible()
  await expect(page.locator('tbody tr')).toHaveCount(0)
})

test('reports a failed list', async ({ page, graphql }) => {
  graphql.answer({ listContributionLinks: new Failure('database down') })
  await signIn(page, '/contribution-links')

  await expect(page.getByRole('alert')).toContainText(
    'listContributionLinks has no result, use default data',
  )
})

test('deletes a link once confirmed, and lists anew', async ({ page, graphql }) => {
  graphql.answer({ deleteContributionLink: true })
  await signIn(page, '/contribution-links')
  await page.locator('tbody tr').nth(0).locator('.test-delete-link').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(de.contributionLink.deleteNow.replace('{name}', 'Welcome'))
  await dialog.getByRole('button', { name: 'OK' }).click()

  await expect(page.getByRole('alert')).toContainText(de.contributionLink.deleted)
  await expect(dialog).toBeHidden()
  expect(graphql.sentFor('deleteContributionLink')).toEqual([
    { field: 'deleteContributionLink', variables: { id: 1 } },
  ])
  await expect.poll(() => graphql.sentFor('listContributionLinks').length).toBe(2)
})

test('deletes nothing where the moderator cancels', async ({ page, graphql }) => {
  await signIn(page, '/contribution-links')
  await page.locator('tbody tr').nth(0).locator('.test-delete-link').click()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()

  await expect(page.getByRole('dialog')).toBeHidden()
  expect(graphql.sentFor('deleteContributionLink')).toEqual([])
})

test('creates a link, shows it, closes the form and lists anew', async ({ page, graphql }) => {
  graphql.answer({ createContributionLink: { link: 'http://localhost/redeem/CL-new' } })
  await signIn(page, '/contribution-links')
  await page.getByTestId('new-contribution-link-button').click()

  const form = page.locator('.contribution-link-form')
  await expect(form).toBeVisible()
  await form.locator('.test-validFrom').fill('2026-11-10')
  await form.locator('.test-validTo').fill('2026-11-30')
  await form.locator('.test-name').fill('Autumn')
  await form.locator('.test-memo').fill('Autumn meetup')
  await form.locator('.test-amount').fill('50')
  await form.getByRole('button', { name: de.contributionLink.create }).click()

  await expect(page.getByRole('alert')).toContainText('http://localhost/redeem/CL-new')
  await expect(form).toBeHidden()
  expect(graphql.sentFor('createContributionLink')).toEqual([
    {
      field: 'createContributionLink',
      variables: {
        validFrom: '2026-11-10',
        validTo: '2026-11-30',
        name: 'Autumn',
        amount: '50',
        memo: 'Autumn meetup',
        cycle: 'ONCE',
        maxPerCycle: 1,
      },
    },
  ])
  await expect.poll(() => graphql.sentFor('listContributionLinks').length).toBe(2)
})

test('reports a link the server refuses, and keeps the form', async ({ page, graphql }) => {
  graphql.answer({ createContributionLink: new Failure('amount too high') })
  await signIn(page, '/contribution-links')
  await page.getByTestId('new-contribution-link-button').click()

  const form = page.locator('.contribution-link-form')
  await form.locator('.test-validFrom').fill('2026-11-10')
  await form.locator('.test-validTo').fill('2026-11-30')
  await form.locator('.test-name').fill('Autumn')
  await form.locator('.test-memo').fill('Autumn meetup')
  await form.locator('.test-amount').fill('5000')
  await form.getByRole('button', { name: de.contributionLink.create }).click()

  await expect(page.getByRole('alert')).toContainText('amount too high')
  await expect(form).toBeVisible()
  await expect(form.locator('.test-name')).toHaveValue('Autumn')
})

test('edits a link with its days filled in', async ({ page, graphql }) => {
  graphql.answer({ updateContributionLink: contributionLink(1, 'Welcome back') })
  await signIn(page, '/contribution-links')
  await page.locator('tbody tr').nth(0).locator('.test-edit-link').click()

  const form = page.locator('.contribution-link-form')
  await expect(form.locator('.test-validFrom')).toHaveValue('2026-10-01')
  await expect(form.locator('.test-validTo')).toHaveValue('2026-12-31')
  await expect(form.locator('.test-name')).toHaveValue('Welcome')
  await expect(form.locator('.test-memo')).toHaveValue('Memo of Welcome')
  await expect(form.locator('.test-amount')).toHaveValue('200')
  // no second link while one is edited
  await expect(page.getByTestId('new-contribution-link-button')).toHaveCount(0)

  await form.locator('.test-name').fill('Welcome back')
  await form.getByRole('button', { name: de.contributionLink.saveChange }).click()

  await expect(page.getByRole('alert')).toContainText(de.contributionLink.changeSaved)
  await expect(form).toBeHidden()
  expect(graphql.sentFor('updateContributionLink')).toEqual([
    {
      field: 'updateContributionLink',
      variables: {
        amount: '200',
        name: 'Welcome back',
        memo: 'Memo of Welcome',
        cycle: 'ONCE',
        validFrom: '2026-10-01',
        validTo: '2026-12-31',
        maxPerCycle: 1,
        id: 1,
      },
    },
  ])
})

test('closing an edit gives a new link an empty form', async ({ page }) => {
  await signIn(page, '/contribution-links')
  await page.locator('tbody tr').nth(0).locator('.test-edit-link').click()
  const form = page.locator('.contribution-link-form')
  await form.getByRole('button', { name: de.close }).click()
  await expect(form).toBeHidden()

  await page.getByTestId('new-contribution-link-button').click()
  await expect(form.locator('.test-name')).toHaveValue('')
  await expect(form.getByRole('button', { name: de.contributionLink.create })).toBeVisible()
})

test('shows a link with its QR code', async ({ page }) => {
  await signIn(page, '/contribution-links')
  await page.locator('tbody tr').nth(0).locator('.test-show').click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Welcome')
  await expect(dialog).toContainText('Memo of Welcome')
  await expect(dialog).toContainText('http://localhost/redeem/CL-code1')
  await expect(dialog.locator('canvas')).toBeVisible()
  await dialog.getByRole('button', { name: 'OK' }).click()
  await expect(dialog).toBeHidden()
})

test('downloads the cheque of a link', async ({ page }) => {
  await signIn(page, '/contribution-links')
  const download = page.waitForEvent('download')
  await page.locator('tbody tr').nth(0).locator('.test-download-cheque').click()

  expect((await download).suggestedFilename()).toBe('200 GDD - Welcome.png')
})

test('a moderator may show and print the links, not change them', async ({ page, graphql }) => {
  const notAnAdmin = { ...moderator, role: 'MODERATOR' }
  graphql.answer(signedInAnswers(notAnAdmin))
  await signIn(page, '/contribution-links', notAnAdmin)
  const row = page.locator('tbody tr').nth(0)
  await expect(row.locator('.test-show')).toBeVisible()
  await expect(row.locator('.test-download-cheque')).toBeVisible()
  await expect(row.locator('.test-delete-link, .test-edit-link')).toHaveCount(0)
  await expect(page.getByTestId('new-contribution-link-button')).toHaveCount(0)
})
