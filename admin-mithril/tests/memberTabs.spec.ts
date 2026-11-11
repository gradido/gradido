// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { expect, Failure, test } from './fixtures/graphql'
import { memberDetailsAnswers } from './fixtures/memberDetails'
import { contribution, transactionLink } from './fixtures/memberLists'
import { signedInAnswers, signIn } from './fixtures/signIn'
import { member, searchUsers } from './fixtures/users'

const unconfirmed = member(1, {
  emailChecked: false,
  emailConfirmationSend: '2026-10-20T08:30:00.000Z',
})
const neverSent = member(2, { emailChecked: false })
const confirmed = member(3)
const status = {
  gdtEmail: 'member1@example.org',
  currentConfirmed: false,
  elopageBuysOnCurrent: false,
  pendingEmail: null,
  pendingSince: null,
}

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    ...memberDetailsAnswers,
    adminEmailStatus: status,
    searchUsers: searchUsers([unconfirmed, neverSent, confirmed]),
    contactRefs: [],
  })
})

const row = (page: Page, index: number) =>
  page.locator('.search-user-table > table > tbody > tr.pointer').nth(index)
const details = (page: Page) => page.locator('.row-details-card')
const openTab = async (page: Page, index: number, tab: string) => {
  await row(page, index).locator('td').first().click()
  await details(page).getByRole('tab', { name: tab, exact: true }).click()
}
const pane = (page: Page) => details(page).getByRole('tabpanel').and(page.locator('.active'))

test.describe('the address', () => {
  test('says the address is confirmed', async ({ page }) => {
    await signIn(page, '/user')
    await openTab(page, 2, de.e_mail)

    await expect(pane(page)).toContainText(de.unregister_mail.text_true.trim())
    await expect(pane(page).getByTestId('email-replace')).toHaveCount(0)
  })

  test('sends the confirmation mail again', async ({ page, graphql }) => {
    graphql.answer({ sendActivationEmail: true })
    await signIn(page, '/user')
    await openTab(page, 0, de.e_mail)
    await expect(pane(page)).toContainText(
      de.unregister_mail.text_false
        .trim()
        .replace('{date}', 'Dienstag, 20. Oktober 2026 um 10:30')
        .replace('{email}', 'member1@example.org'),
    )
    await pane(page).getByRole('button', { name: de.unregister_mail.button }).click()

    await expect(page.getByRole('alert')).toContainText(
      de.unregister_mail.success.replace('{email}', 'member1@example.org'),
    )
    expect(graphql.sentFor('sendActivationEmail').map((sent) => sent.variables)).toEqual([
      { email: 'member1@example.org' },
    ])
  })

  test('says where no mail was ever sent, and reports a failed one', async ({ page, graphql }) => {
    graphql.answer({ sendActivationEmail: new Failure('mail server down') })
    await signIn(page, '/user')
    await openTab(page, 1, de.e_mail)
    await expect(pane(page)).toContainText(
      de.unregister_mail.never_sent.replace('{email}', 'member2@example.org'),
    )
    await pane(page).getByRole('button', { name: de.unregister_mail.button }).click()

    await expect(page.getByRole('alert')).toContainText(
      de.unregister_mail.error.replace('{message}', 'mail server down'),
    )
  })

  test('corrects a never confirmed address, in the row as well', async ({ page, graphql }) => {
    graphql.answer({ adminReplaceUnconfirmedEmail: 'member1@example.com' })
    await signIn(page, '/user')
    await openTab(page, 0, de.e_mail)
    const button = pane(page).getByTestId('email-replace-button')
    await expect(button).toBeDisabled()
    await pane(page).getByTestId('email-replace-input').fill('member1@example.com')
    await button.click()

    await expect(page.getByRole('alert')).toContainText(
      de.unregister_mail.replace.success.replace('{email}', 'member1@example.com'),
    )
    expect(graphql.sentFor('adminReplaceUnconfirmedEmail').map((sent) => sent.variables)).toEqual([
      { userId: 1, email: 'member1@example.com' },
    ])
    await expect(row(page, 0).locator('td').first()).toHaveText('member1@example.com')
    await expect(pane(page).getByTestId('email-replace-input')).toHaveValue('')
    // what the server knows of the addresses now
    await expect.poll(() => graphql.sentFor('adminEmailStatus').length).toBe(2)
  })

  test('says in its own words why an address was not corrected', async ({ page, graphql }) => {
    graphql.answer({ adminReplaceUnconfirmedEmail: new Failure('Email address already in use') })
    await signIn(page, '/user')
    await openTab(page, 0, de.e_mail)
    await pane(page).getByTestId('email-replace-input').fill('taken@example.org')
    await pane(page).getByTestId('email-replace-button').click()

    await expect(page.getByRole('alert')).toContainText(
      de.unregister_mail.replace.taken.replace('{email}', 'taken@example.org'),
    )
    await expect(row(page, 0).locator('td').first()).toHaveText('member1@example.org')
  })

  test('shows what the support needs beside the address', async ({ page, graphql }) => {
    graphql.answer({
      adminEmailStatus: {
        ...status,
        gdtEmail: 'first@example.org',
        elopageBuysOnCurrent: true,
        pendingEmail: 'next@example.org',
        pendingSince: '2026-11-01T10:00:00.000Z',
      },
    })
    await signIn(page, '/user')
    await openTab(page, 0, de.e_mail)

    await expect(pane(page).getByTestId('email-gdt')).toHaveText(
      de.unregister_mail.gdt_email.replace('{email}', 'first@example.org'),
    )
    await expect(pane(page).getByTestId('email-pending')).toHaveText(
      de.unregister_mail.pending
        .replace('{email}', 'next@example.org')
        .replace('{date}', 'Sonntag, 1. November 2026 um 11:00'),
    )
    await expect(pane(page).getByTestId('email-replace-warning')).toBeVisible()
  })

  test('offers no correction where the server has the address confirmed', async ({
    page,
    graphql,
  }) => {
    graphql.answer({ adminEmailStatus: { ...status, currentConfirmed: true } })
    await signIn(page, '/user')
    await openTab(page, 0, de.e_mail)

    await expect(pane(page).getByTestId('email-status')).toBeAttached()
    await expect(pane(page).getByTestId('email-replace')).toHaveCount(0)
  })
})

test.describe('the creation list', () => {
  test('lists the contributions of the member', async ({ page, graphql }) => {
    graphql.answer({
      adminListContributions: {
        contributionCount: 2,
        contributionList: [
          contribution(1),
          contribution(2, { confirmedAt: null, contributionStatus: 'PENDING' }),
        ],
      },
    })
    await signIn(page, '/user')
    await openTab(page, 0, de.creationList)

    const rows = pane(page).locator('tbody tr')
    await expect(rows).toHaveCount(2)
    const cells = rows.nth(0).locator('td')
    await expect(cells.nth(1)).toHaveText(/September\s*1\.9\.2026/)
    await expect(cells.nth(3)).toHaveText('CONFIRMED')
    await expect(cells.nth(4)).toHaveText('100 GDD')
    await expect(cells.nth(5)).toHaveText('Memo of contribution 1')
    await expect(rows.nth(1).locator('td').nth(2)).toHaveText('')
    expect(graphql.sentFor('adminListContributions').at(-1)?.variables).toEqual({
      filter: { userId: 1 },
      paginated: { currentPage: 1, pageSize: 10, order: 'DESC' },
    })
  })

  test('explains its columns on demand', async ({ page }) => {
    await signIn(page, '/user')
    await openTab(page, 0, de.creationList)
    const explanation = `${de.transactionlist.period} ${de.math.equals} ${de.help.transactionlist.periods}`
    await expect(pane(page).getByText(explanation)).toBeHidden()
    await pane(page).getByRole('button', { name: de.help.help }).click()

    await expect(pane(page).getByText(explanation)).toBeVisible()
  })

  test('asks for the page turned to', async ({ page, graphql }, info) => {
    test.skip(info.project.name === 'old', 'the old admin asks for the first page again')
    graphql.answer({
      adminListContributions: { contributionCount: 12, contributionList: [contribution(1)] },
    })
    await signIn(page, '/user')
    await openTab(page, 0, de.creationList)
    await pane(page).getByRole('menuitem', { name: 'Go to page 2' }).click()

    await expect
      .poll(() => graphql.sentFor('adminListContributions').at(-1)?.variables)
      .toEqual({
        filter: { userId: 1 },
        paginated: { currentPage: 2, pageSize: 10, order: 'DESC' },
      })
  })
})

test.describe('the transaction links', () => {
  test('lists the links of the member with what became of them', async ({ page, graphql }) => {
    graphql.answer({
      listTransactionLinksAdmin: {
        count: 3,
        links: [
          transactionLink(1),
          transactionLink(2, { redeemedAt: '2026-10-03T09:00:00.000Z' }),
          transactionLink(3, { validUntil: '2026-10-15T09:00:00.000Z' }),
        ],
      },
    })
    await signIn(page, '/user')
    await openTab(page, 0, de.transactionlink.name)

    const rows = pane(page).locator('tbody tr')
    await expect(rows.nth(0).locator('td')).toHaveText([
      '1.10.2026',
      '50 GDD',
      'Memo of link 1',
      '15.10.2099',
      de.open,
    ])
    await expect(rows.nth(1).locator('td').nth(4)).toHaveText(`${de.redeemed}: 3.10.2026`)
    await expect(rows.nth(2).locator('td').nth(4)).toHaveText(`${de.expired}: 15.10.2026`)
  })

  test('shows no table where the member made no link', async ({ page }) => {
    await signIn(page, '/user')
    await openTab(page, 0, de.transactionlink.name)

    await expect(pane(page).locator('.transaction-link-list')).toBeAttached()
    await expect(pane(page).locator('table')).toHaveCount(0)
  })

  test('asks for the page turned to', async ({ page, graphql }) => {
    graphql.answer({
      listTransactionLinksAdmin: { count: 12, links: [transactionLink(1)] },
    })
    await signIn(page, '/user')
    await openTab(page, 0, de.transactionlink.name)
    await pane(page).getByRole('menuitem', { name: 'Go to page 3' }).click()

    await expect
      .poll(() => graphql.sentFor('listTransactionLinksAdmin').at(-1)?.variables)
      .toEqual({ currentPage: 3, pageSize: 5, userId: 1 })
  })

  test('reports a failed list', async ({ page, graphql }, info) => {
    test.skip(info.project.name === 'old', 'the old admin shows an empty toast')
    graphql.answer({ listTransactionLinksAdmin: new Failure('database down') })
    await signIn(page, '/user')
    await openTab(page, 0, de.transactionlink.name)

    await expect(page.getByRole('alert')).toContainText('database down')
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 1200 } })

  test('names each cell of a contribution by its column', async ({ page, graphql }) => {
    graphql.answer({
      adminListContributions: { contributionCount: 1, contributionList: [contribution(1)] },
    })
    await signIn(page, '/user')
    await row(page, 0).getByRole('button', { name: de.show_details }).click()
    await details(page).getByRole('tab', { name: de.creationList }).click()

    await expect(pane(page).locator('tbody td').nth(4)).toHaveText(
      `${de.transactionlist.amount}100 GDD`,
    )
    await expect(pane(page).locator('thead')).toBeHidden()
  })
})
