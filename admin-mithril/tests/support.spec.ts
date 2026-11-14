// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { type Answer, expect, Failure, test } from './fixtures/graphql'
import { moderator, signedInAnswers, signIn } from './fixtures/signIn'
import { listedTicket, supportMember, ticketList, ticketMessage } from './fixtures/supportTickets'

// The support page (Support-Anfragen K2) is built in the Mithril admin only: the old admin is no
// longer brought along (AGENTS.md, SUA-002).
const ONLY_NEW = 'the support page exists in the Mithril admin only (SUA-002)'
const KEPT = 'gradido-admin-last-search'
const REMARK = {
  remark: 'Gärtnert seit Jahren',
  updatedAt: '2026-11-01T10:00:00.000Z',
  updatedByName: 'Peter',
}

const tickets = [
  // the member had the last word
  listedTicket(1, 1, {
    creationGroupTag: 'garten',
    creationGroupName: 'Garten',
    lastMessageType: 'DIALOG',
    lastMessageByModerator: false,
  }),
  // a question back
  listedTicket(2, 2, {
    status: 'IN_PROGRESS',
    lastMessageType: 'DIALOG',
    lastMessageByModerator: true,
  }),
  // the moderation had the last word
  listedTicket(3, 3, { lastMessageType: 'DIALOG', lastMessageByModerator: true }),
  // nobody wrote yet
  listedTicket(4, 4),
  // a deleted member's
  listedTicket(5, 5, { user: null, userEmail: null }),
]
// the moderator's own request
const own = listedTicket(6, 6, { user: supportMember(6, { gradidoID: moderator.gradidoID }) })

const closed = [
  listedTicket(7, 7, {
    status: 'CLOSED',
    closedAt: '2026-11-13T12:00:00.000Z',
    closedBy: 7,
    closedByUserName: 'First7 Last7',
  }),
  listedTicket(8, 8, {
    status: 'CLOSED',
    closedAt: '2026-11-13T12:00:00.000Z',
    closedBy: 99,
    closedByUserName: 'Peter Lustig',
  }),
]
const deleted = [
  listedTicket(9, 9, {
    status: 'DELETED',
    closedAt: '2026-11-13T13:00:00.000Z',
    closedBy: 99,
    closedByUserName: 'Peter Lustig',
  }),
]

const byTab: Answer = ({ statuses }: { statuses: string[] }) =>
  statuses.join() === 'CLOSED'
    ? ticketList(closed)
    : statuses.join() === 'DELETED'
      ? ticketList(deleted)
      : statuses.length === 4
        ? ticketList([...tickets, own, ...closed, ...deleted])
        : ticketList([...tickets, own], 30)

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    adminListSupportTickets: byTab,
    // the member line asks which members are the moderator's contacts (the bubble)
    contactRefs: [],
    userRemark: REMARK,
    adminListSupportTicketMessages: [],
  })
})

const rows = (page: Page) =>
  page.locator('.support-tickets-table > table > tbody > tr[class^="table-"]')
const row = (page: Page, index: number) => rows(page).nth(index)
const heads = (page: Page) => page.locator('.support-tickets-table > table > thead th')
const details = (page: Page, index: number) =>
  row(page, index).getByRole('button', { name: /^Details/ })
const card = (page: Page) => page.locator('.row-details-card')
const tab = (page: Page, name: string) => page.getByRole('tab', { name })
const asked = (graphql: { sentFor: (field: string) => { variables: object }[] }, field: string) =>
  graphql.sentFor(field).map((sent) => sent.variables)
const open = async (page: Page) => {
  await signIn(page, '/support')
  await expect(rows(page)).toHaveCount(6)
}

test('stands in the menu behind the creation, and lists the open requests', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)

  await expect(page.locator('li.bg-color-creation + li')).toHaveText(de.navbar.support)
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.navbar.support, exact: true }),
  ).toHaveClass(/\bactive\b/)
  expect(asked(graphql, 'adminListSupportTickets')).toEqual([
    { statuses: ['OPEN', 'IN_PROGRESS'], currentPage: 1, pageSize: 25 },
  ])
  await expect(heads(page)).toHaveText([de.name, de.support.request, de.support.sent, de.details])
  await expect(row(page, 0)).toHaveClass(/table-primary/)
  await expect(row(page, 0).locator('td').nth(0)).toContainText('First1 Last1')
  await expect(row(page, 0).locator('td').nth(0)).toContainText('member1')
  await expect(row(page, 0).locator('td').nth(1)).toContainText('Garten')
  await expect(row(page, 0).getByTestId('support-ticket-text')).toHaveText('Words of request 1')
  await expect(row(page, 0).locator('td').nth(2)).toHaveText('13.11.2026')
  await expect(row(page, 1).locator('td').nth(1)).toContainText(de.contribution.noGroup)
})

test('tells by the details button who is to answer, and opens neither the own request nor one without a member', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)

  await expect(details(page, 0)).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.answer}`,
  )
  await expect(details(page, 1)).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.question}`,
  )
  await expect(details(page, 2)).toHaveAttribute(
    'title',
    `${de.details} – ${de.contribution.detailsState.conversation}`,
  )
  await expect(details(page, 3)).toHaveAttribute('title', de.details)
  await expect(row(page, 4).getByRole('button')).toHaveCount(0)
  // the moderator's own: on it they are the member (SUA-018)
  await expect(row(page, 5).locator('td').nth(0)).toContainText('First6 Last6')
  await expect(row(page, 5).getByRole('button')).toHaveCount(0)
})

test('shows the closed, the deleted and all requests with their columns, colours and who closed', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)

  await tab(page, de.support.tab.closed).click()
  await expect(rows(page)).toHaveCount(2)
  expect(asked(graphql, 'adminListSupportTickets').at(-1)).toEqual({
    statuses: ['CLOSED'],
    currentPage: 1,
    pageSize: 25,
  })
  await expect(heads(page)).toHaveText([
    de.name,
    de.support.request,
    de.support.sent,
    de.support.closedAt,
    de.details,
  ])
  await expect(row(page, 0)).toHaveClass(/table-success/)
  await expect(row(page, 0).locator('td').nth(1)).toContainText(de.support.closedByMember)
  await expect(row(page, 1).locator('td').nth(1)).toContainText('Geschlossen von Peter Lustig')
  await expect(row(page, 1).locator('td').nth(3)).toHaveText('13.11.2026')

  await tab(page, de.support.tab.deleted).click()
  await expect(rows(page)).toHaveCount(1)
  await expect(row(page, 0)).toHaveClass(/table-danger/)
  await expect(row(page, 0).locator('td').nth(1)).toContainText('Gelöscht von Peter Lustig')

  await tab(page, de.support.tab.all).click()
  await expect(rows(page)).toHaveCount(9)
  await expect(heads(page)).toHaveText([
    de.status,
    de.name,
    de.support.request,
    de.support.sent,
    de.support.closedAt,
    de.details,
  ])
})

test('keeps the tab for the moderator on this device', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await tab(page, de.support.tab.closed).click()
  await expect(rows(page)).toHaveCount(2)

  const kept = await page.evaluate((key) => localStorage.getItem(key), KEPT)
  expect(JSON.parse(kept ?? '{}')[moderator.gradidoID]).toEqual({ '/support#tab': 1 })
  await page.reload()
  await expect(tab(page, de.support.tab.closed)).toHaveAttribute('aria-selected', 'true')
  await expect(rows(page)).toHaveCount(2)
  expect(asked(graphql, 'adminListSupportTickets').at(-1)).toEqual({
    statuses: ['CLOSED'],
    currentPage: 1,
    pageSize: 25,
  })
})

test('opens a request with its member, the remark and the whole thread, to read', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminListSupportTicketMessages: [
      ticketMessage(1, { message: 'Wie **schöpfe** ich?' }),
      ticketMessage(2, {
        message: 'Am Handy?',
        userAlias: moderator.alias,
        userId: 99,
        userGradidoID: moderator.gradidoID,
        isModerator: true,
      }),
      ticketMessage(3, {
        message: 'Rückruf vereinbart',
        type: 'MODERATOR',
        userAlias: moderator.alias,
        userId: 99,
        userGradidoID: moderator.gradidoID,
        isModerator: true,
      }),
    ],
  })
  await open(page)
  await details(page, 0).click()
  const bubbles = card(page).locator('.message-bubble')
  await expect(bubbles).toHaveCount(3)

  // one question for the thread and the remark
  expect(asked(graphql, 'adminListSupportTicketMessages')).toEqual([
    { supportTicketId: 1, userId: 1 },
  ])
  await expect(details(page, 0)).toHaveAttribute('title', de.hide_details)
  await expect(details(page, 0)).toHaveAttribute('aria-expanded', 'true')
  const member = card(page).locator('.list-group-item').first()
  await expect(member.getByRole('link', { name: 'First1 Last1' })).toHaveAttribute(
    'href',
    '/admin/user?search=member1@example.org',
  )
  await expect(member.getByRole('link', { name: 'member1@example.org' })).toHaveAttribute(
    'href',
    'mailto:member1@example.org',
  )
  await expect(page.getByTestId('member-remark')).toHaveText(`Bemerkung: ${REMARK.remark}`)
  await expect(card(page).locator('.list-group-item').nth(2)).toHaveText(
    'Registriert: 15.1.2026, Gesendet: 13.11.2026',
  )

  await expect(bubbles.nth(0)).toHaveClass(/is-user/)
  await expect(bubbles.nth(0).locator('strong')).toHaveText('schöpfe')
  await expect(bubbles.nth(1)).toHaveClass(/is-moderator/)
  await expect(bubbles.nth(2)).toHaveClass(/is-note/)
  // to read only: the form to answer comes with K3
  await expect(card(page).locator('textarea')).toHaveCount(0)

  await details(page, 0).click()
  await expect(card(page)).toHaveCount(0)
})

test('lists and opens a member without an address in force', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminListSupportTickets: ticketList([listedTicket(1, 1, { userEmail: null })]) })
  await signIn(page, '/support')
  await expect(rows(page)).toHaveCount(1)
  await details(page, 0).click()

  const member = card(page).locator('.list-group-item').first()
  // the search looks for the username, and there is no address to write to
  await expect(member.getByRole('link', { name: 'First1 Last1' })).toHaveAttribute(
    'href',
    '/admin/user?search=member1',
  )
  await expect(member.locator('a[href^="mailto:"]')).toHaveCount(0)
  await expect(member).not.toContainText('@')
})

test('says in words when the list cannot be loaded, and when a request is out of reach', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  graphql.answer({ adminListSupportTicketMessages: new Failure('SUPPORT_TICKET_NOT_FOUND') })
  await details(page, 0).click()
  await expect(page.getByRole('alert')).toContainText(de.support.notFound)

  graphql.answer({ adminListSupportTickets: new Failure('Too many support requests read at once') })
  await tab(page, de.support.tab.closed).click()
  await expect(page.getByRole('alert').filter({ hasText: de.support.loadFailed })).toBeVisible()
})

test('shows a long request in six lines until its row is opened', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminListSupportTickets: ticketList([
      listedTicket(1, 1, { text: 'Lange Anfrage '.repeat(357) }),
    ]),
  })
  await signIn(page, '/support')
  const words = row(page, 0).getByTestId('support-ticket-text')

  await expect(words).toHaveCSS('-webkit-line-clamp', '6')
  await details(page, 0).click()
  await expect(words).toHaveCSS('-webkit-line-clamp', 'none')
})

test('asks for the next page', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()

  await expect
    .poll(() => asked(graphql, 'adminListSupportTickets').at(-1))
    .toEqual({
      statuses: ['OPEN', 'IN_PROGRESS'],
      currentPage: 2,
      pageSize: 25,
    })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 1200 } })

  test('shows each request as a card with its button', async ({ page }, info) => {
    test.skip(info.project.name === 'old', ONLY_NEW)
    await open(page)

    const first = row(page, 0)
    await expect(first.locator('td')).toHaveCount(3)
    await expect(first.locator('.phone-head')).toContainText('First1 Last1')
    await expect(first.locator('.phone-head')).toContainText('13.11.2026')
    await expect(first.locator('.phone-head')).toContainText('Garten')
    await expect(first.locator('td').nth(1)).toHaveText('Words of request 1')
    await expect(first.locator('.phone-actions button')).toHaveCount(1)
    // the moderator's own: no details
    await expect(row(page, 5).locator('.phone-actions button')).toHaveCount(0)
  })
})
