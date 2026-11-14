// AI-GENERATED — not an architecture reference
import type { Page } from '@playwright/test'
import de from '../../admin/src/locales/de.json' with { type: 'json' }
import { groups } from './fixtures/contributions'
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

// the two halves of the open tab (K3): the badges show their sum
const OPEN = { forModeration: 5, forMember: 1, onResubmission: 0 }

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    adminListSupportTickets: byTab,
    adminCountOpenSupportTickets: OPEN,
    // the member line asks which members are the moderator's contacts (the bubble)
    contactRefs: [],
    userRemark: REMARK,
    adminListSupportTicketMessages: [],
    // the groups of the filter and of handing a request on (K4)
    creationGroups: groups,
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

  await expect(page.locator('li.bg-color-creation + li')).toHaveText(`${de.navbar.support} 6`)
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.navbar.support }),
  ).toHaveClass(/\bactive\b/)
  expect(asked(graphql, 'adminListSupportTickets')).toEqual([
    {
      statuses: ['OPEN', 'IN_PROGRESS'],
      currentPage: 1,
      pageSize: 25,
      query: '',
      creationGroup: '',
      hideResubmission: true,
    },
  ])
  await expect(heads(page)).toHaveText([
    de.delete,
    '',
    de.name,
    de.support.request,
    de.support.sent,
    de.details,
    de.support.close,
  ])
  await expect(row(page, 0)).toHaveClass(/table-primary/)
  await expect(row(page, 0).locator('td').nth(2)).toContainText('First1 Last1')
  await expect(row(page, 0).locator('td').nth(2)).toContainText('member1')
  await expect(row(page, 0).locator('td').nth(3)).toContainText('Garten')
  await expect(row(page, 0).getByTestId('support-ticket-text')).toHaveText('Words of request 1')
  await expect(row(page, 0).locator('td').nth(4)).toHaveText('13.11.2026')
  await expect(row(page, 1).locator('td').nth(3)).toContainText(de.contribution.noGroup)
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
  // a deleted member's: it does not open, but it can be deleted and closed (K3) and handed on by
  // its group (K4); no member, no magnifier (K4)
  await expect(row(page, 4).getByRole('button')).toHaveText(['', de.contribution.noGroup, ''])
  await expect(row(page, 4).getByRole('button', { name: de.delete })).toBeVisible()
  await expect(row(page, 4).getByRole('button', { name: de.support.close })).toBeVisible()
  // the moderator's own: on it they are the member (SUA-018) -- no button that acts on the
  // request; the magnifier only searches (K4)
  await expect(row(page, 5).locator('td').nth(2)).toContainText('First6 Last6')
  await expect(row(page, 5).getByRole('button')).toHaveCount(1)
  await expect(row(page, 5).getByRole('button')).toHaveAttribute('title', de.support.searchMember)
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
    query: '',
    creationGroup: '',
    hideResubmission: false,
  })
  await expect(heads(page)).toHaveText([
    '',
    de.name,
    de.support.request,
    de.support.sent,
    de.support.closedAt,
    de.details,
  ])
  await expect(row(page, 0)).toHaveClass(/table-success/)
  await expect(row(page, 0).locator('td').nth(2)).toContainText(de.support.closedByMember)
  await expect(row(page, 1).locator('td').nth(2)).toContainText('Geschlossen von Peter Lustig')
  await expect(row(page, 1).locator('td').nth(4)).toHaveText('13.11.2026')

  await tab(page, de.support.tab.deleted).click()
  await expect(rows(page)).toHaveCount(1)
  await expect(row(page, 0)).toHaveClass(/table-danger/)
  await expect(row(page, 0).locator('td').nth(2)).toContainText('Gelöscht von Peter Lustig')

  await tab(page, de.support.tab.all).click()
  await expect(rows(page)).toHaveCount(9)
  await expect(heads(page)).toHaveText([
    de.status,
    '',
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
    query: '',
    creationGroup: '',
    hideResubmission: false,
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
    '/admin/user?search=member1%40example.org',
  )
  await expect(member.getByRole('link', { name: 'member1@example.org' })).toHaveAttribute(
    'href',
    'mailto:member1@example.org',
  )
  await expect(page.getByTestId('member-remark')).toHaveText(`Bemerkung: ${REMARK.remark}`)
  await expect(card(page).locator('.list-group-item').nth(2)).toHaveText(
    'Anfrage Nr. 1, Registriert: 15.1.2026, Gesendet: 13.11.2026',
  )

  await expect(bubbles.nth(0)).toHaveClass(/is-user/)
  await expect(bubbles.nth(0).locator('strong')).toHaveText('schöpfe')
  await expect(bubbles.nth(1)).toHaveClass(/is-moderator/)
  await expect(bubbles.nth(2)).toHaveClass(/is-note/)
  // and below the thread the form to answer (K3)
  await expect(card(page).getByRole('tab')).toHaveText([de.moderator.message, de.moderator.notice])

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
      // the own request does not open: its words stand in full
      listedTicket(6, 6, {
        text: 'Eigene lange Anfrage '.repeat(238),
        user: supportMember(6, { gradidoID: moderator.gradidoID }),
      }),
    ]),
  })
  await signIn(page, '/support')
  const words = row(page, 0).getByTestId('support-ticket-text')
  await expect(row(page, 1).getByTestId('support-ticket-text')).toHaveCSS(
    '-webkit-line-clamp',
    'none',
  )

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
      query: '',
      creationGroup: '',
      hideResubmission: true,
    })
})

test('stays on its page when the next one fails to come', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  graphql.answer({ adminListSupportTickets: new Failure('Too many support requests read at once') })
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()

  await expect(page.getByRole('alert').filter({ hasText: de.support.loadFailed })).toBeVisible()
  await expect(rows(page)).toHaveCount(6)
  await expect(page.getByRole('menuitem', { name: 'Go to page 1' })).toHaveAttribute(
    'tabindex',
    '0',
  )
  await expect(page.getByRole('menuitem', { name: 'Go to page 2' })).toHaveAttribute(
    'tabindex',
    '-1',
  )
})

test('offers no page of the tab before while the next tab loads', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await expect(page.getByRole('menuitem', { name: 'Go to page 2' })).toBeVisible()
  // the closed tab's answer is held back until the pager has been looked at
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  graphql.answer({
    adminListSupportTickets: async () => {
      await held
      return ticketList(closed)
    },
  })
  await tab(page, de.support.tab.closed).click()

  await expect(page.getByRole('menuitem', { name: 'Go to page 2' })).toHaveCount(0)
  release()
  await expect(rows(page)).toHaveCount(2)
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
    // to delete on the left, to open and to close on the right (K3)
    await expect(first.locator('.phone-actions button')).toHaveCount(3)
    await expect(first.locator('.phone-actions button').first()).toHaveAttribute('title', de.delete)
    await expect(first.locator('.phone-actions button').last()).toHaveAttribute(
      'title',
      de.support.close,
    )
    // the moderator's own: no button
    await expect(row(page, 5).locator('.phone-actions button')).toHaveCount(0)
    // the magnifier below the face, as on a contribution's card (K4)
    await expect(first.locator('.phone-head .phone-search button')).toHaveAttribute(
      'title',
      de.support.searchMember,
    )
    // the group to hand it on below the name (K4); the own request shows its group as text
    await expect(first.locator('.phone-head .phone-group .group-select')).toHaveCount(1)
    await expect(row(page, 5).locator('.phone-head .phone-group .group-select')).toHaveCount(0)
    await expect(row(page, 5).locator('.phone-head .phone-group')).toHaveText(
      de.contribution.noGroup,
    )
  })

  test('puts the number at the corner of the open tab, as the creation page does', async ({
    page,
  }, info) => {
    test.skip(info.project.name === 'old', ONLY_NEW)
    await open(page)
    const badge = tab(page, de.support.tab.open).locator('.tab-badge')
    await expect(badge).toHaveText('6')
    await expect(badge).toHaveCSS('position', 'absolute')
    // in the tab's upper right corner, not on a line of its own below the word
    const tabBox = await tab(page, de.support.tab.open).boundingBox()
    const badgeBox = await badge.boundingBox()
    expect(badgeBox && tabBox && badgeBox.y - tabBox.y).toBeLessThan(8)
    expect(
      badgeBox && tabBox && tabBox.x + tabBox.width - (badgeBox.x + badgeBox.width),
    ).toBeLessThan(12)
  })
})

// K3: the moderation answers, notes, closes with the tick and deletes; the count of the open tab.
const field = (page: Page) => card(page).locator('.tab-pane.active textarea')
// A form tab, chosen: Mithril draws the switch at the next frame, so what is typed right after a
// click would still go into the tab before.
const choose = async (page: Page, name: string) => {
  const formTab = card(page).getByRole('tab', { name })
  await formTab.click()
  await expect(formTab).toHaveAttribute('aria-selected', 'true')
}
const button = (page: Page, name: string) => card(page).getByRole('button', { name, exact: true })
const dialog = (page: Page) => page.getByRole('dialog')
const toast = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text })
const opened = async (page: Page, index = 0) => {
  await open(page)
  await details(page, index).click()
  await expect(field(page)).toBeVisible()
}

test('answers below the thread, and asks for the thread, the list and the count anew', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminCreateSupportTicketMessage: { id: 99 } })
  await opened(page)
  await expect(button(page, de.support.answer)).toBeDisabled()
  await field(page).fill('Am **Handy** oben rechts.')
  await button(page, de.support.answer).click()

  await expect(toast(page, de.message.request)).toBeVisible()
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    {
      supportTicketId: 1,
      message: 'Am **Handy** oben rechts.',
      type: 'DIALOG',
      close: false,
    },
  ])
  await expect(field(page)).toHaveValue('')
  // what the request is now, the server says: its thread, the list and the count, asked anew
  await expect.poll(() => asked(graphql, 'adminListSupportTicketMessages').length).toBe(2)
  await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)
  await expect.poll(() => asked(graphql, 'adminCountOpenSupportTickets').length).toBe(2)
  expect(asked(graphql, 'adminListSupportTickets').at(-1)).toEqual({
    statuses: ['OPEN', 'IN_PROGRESS'],
    currentPage: 1,
    pageSize: 25,
    query: '',
    creationGroup: '',
    hideResubmission: true,
  })
  // the row stays open where it is still in the list
  await expect(field(page)).toBeVisible()
})

test('answers and closes with the green button, and the row goes where the list no longer has it', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminCreateSupportTicketMessage: { id: 99 } })
  await opened(page)
  graphql.answer({ adminListSupportTickets: ticketList([...tickets.slice(1), own], 29) })
  await field(page).fill('Ja, genau so.')
  await button(page, de.support.answerAndClose).click()

  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    {
      supportTicketId: 1,
      message: 'Ja, genau so.',
      type: 'DIALOG',
      close: true,
    },
  ])
  await expect(rows(page)).toHaveCount(5)
  await expect(card(page)).toHaveCount(0)
})

test('writes a note under its own tab with "Speichern", and offers no answer there', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminCreateSupportTicketMessage: { id: 99 } })
  await opened(page)
  await choose(page, de.moderator.notice)
  await expect(card(page).locator('.row.mt-4 button')).toHaveText([de.form.cancel, de.save])
  await field(page).fill('Rückruf vereinbart')
  await button(page, de.save).click()

  await expect(toast(page, de.message.request)).toBeVisible()
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    {
      supportTicketId: 1,
      message: 'Rückruf vereinbart',
      type: 'MODERATOR',
      close: false,
    },
  ])
})

test('sends nothing empty or too long, and says how long a message may be', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await opened(page)
  const answer = button(page, de.support.answer)
  const andClose = button(page, de.support.answerAndClose)
  await expect(card(page).locator('.row.mt-4 button')).toHaveText([
    de.form.cancel,
    de.support.answer,
    de.support.answerAndClose,
  ])
  await field(page).fill(' \n ')
  await expect(answer).toBeDisabled()
  await expect(andClose).toBeDisabled()
  await field(page).fill('a'.repeat(5001))
  await expect(answer).toBeDisabled()
  await expect(card(page).getByText(de.support.tooLong.replace('{max}', '5000'))).toBeVisible()
  await expect(field(page)).toHaveAttribute('aria-invalid', 'true')
  // counted as the server counts: an emoji is one character, the blanks around are none
  await field(page).fill(` ${'😊'.repeat(5000)} `)
  await expect(answer).toBeEnabled()
  await expect(andClose).toBeEnabled()
  await expect(card(page).getByText(de.support.tooLong.replace('{max}', '5000'))).toHaveCount(0)
})

test('keeps a draft to each tab: words begun as a note never go to the member', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminCreateSupportTicketMessage: { id: 99 } })
  await opened(page)
  await choose(page, de.moderator.notice)
  await field(page).fill('Intern: hat sich selbst geholfen.')
  await choose(page, de.moderator.message)
  await expect(field(page)).toHaveValue('')
  await expect(button(page, de.support.answer)).toBeDisabled()
  await field(page).fill('Schön, dass es klappt!')
  await button(page, de.support.answer).click()

  await expect(toast(page, de.message.request)).toBeVisible()
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    {
      supportTicketId: 1,
      message: 'Schön, dass es klappt!',
      type: 'DIALOG',
      close: false,
    },
  ])
  // the note's draft is still there, and "Abbrechen" empties only the draft shown
  await choose(page, de.moderator.notice)
  await expect(field(page)).toHaveValue('Intern: hat sich selbst geholfen.')
  await choose(page, de.moderator.message)
  await field(page).fill('Doch nicht')
  await button(page, de.form.cancel).click()
  await choose(page, de.moderator.notice)
  await expect(field(page)).toHaveValue('Intern: hat sich selbst geholfen.')
})

test('keeps words typed while an answer goes', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  graphql.answer({
    adminCreateSupportTicketMessage: async () => {
      await held
      return { id: 99 }
    },
  })
  await opened(page)
  await field(page).fill('Erster Gedanke')
  await button(page, de.support.answer).click()
  await expect.poll(() => asked(graphql, 'adminCreateSupportTicketMessage').length).toBe(1)
  await field(page).fill('Erster Gedanke, und noch etwas')
  release()

  await expect(toast(page, de.message.request)).toBeVisible()
  await expect(field(page)).toHaveValue('Erster Gedanke, und noch etwas')
})

test('lets no answer to an earlier count put back a count from before a write', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  let counted = 0
  graphql.answer({
    adminCloseSupportTicket: true,
    // the page's first question is answered last, with the count from before the tick
    adminCountOpenSupportTickets: async () => {
      counted += 1
      if (counted === 1) {
        await held
        return { forModeration: 5, forMember: 1, onResubmission: 0 }
      }
      return { forModeration: 4, forMember: 1, onResubmission: 0 }
    },
  })
  const entry = page.locator('nav.navbar').getByRole('link', { name: de.navbar.support })
  await open(page)
  await row(page, 0).getByRole('button', { name: de.support.close }).click()
  await dialog(page).getByRole('button', { name: de.support.confirmClose.yes }).click()
  await expect(entry.locator('.badge')).toHaveText('5')

  const late = page.waitForResponse((response) =>
    (response.request().postData() ?? '').includes('adminCountOpenSupportTickets'),
  )
  release()
  await late
  // two frames: the late answer is read and drawn
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)))
  await expect(entry.locator('.badge')).toHaveText('5')
  await expect(tab(page, de.support.tab.open).locator('.badge')).toHaveText('5')
})

test('empties the field with "Abbrechen", and sends nothing', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await opened(page)
  await field(page).fill('Doch nicht')
  await button(page, de.form.cancel).click()
  await expect(field(page)).toHaveValue('')
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([])
})

test('keeps the words and says why where the server refuses', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminCreateSupportTicketMessage: new Failure('SUPPORT_TICKET_MESSAGES_REACHED'),
  })
  await opened(page)
  await field(page).fill('Noch eine Antwort')
  await button(page, de.support.answer).click()
  await expect(toast(page, de.support.messagesReached.replace('{max}', '100'))).toBeVisible()
  await expect(field(page)).toHaveValue('Noch eine Antwort')
  // done or refused, the list is asked for anew
  await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)

  await choose(page, de.moderator.notice)
  await field(page).fill('Noch eine Notiz')
  await button(page, de.save).click()
  await expect(toast(page, de.support.notesReached.replace('{max}', '100'))).toBeVisible()
  await expect(field(page)).toHaveValue('Noch eine Notiz')

  graphql.answer({ adminCreateSupportTicketMessage: new Failure('SUPPORT_TICKET_NOT_FOUND') })
  await button(page, de.save).click()
  await expect(toast(page, de.support.notFound)).toBeVisible()
})

test('answers a closed request too, and none that is deleted', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await tab(page, de.support.tab.closed).click()
  await expect(rows(page)).toHaveCount(2)
  await details(page, 0).click()
  await expect(field(page)).toBeVisible()
  // a closed request has neither the tick nor a delete
  await expect(row(page, 0).getByRole('button', { name: de.support.close })).toHaveCount(0)

  await tab(page, de.support.tab.deleted).click()
  await expect(rows(page)).toHaveCount(1)
  await details(page, 0).click()
  // the thread is drawn, and in the same pass the form would be
  await expect(card(page).locator('.contribution-messages-list')).toBeVisible()
  await expect.poll(() => asked(graphql, 'adminListSupportTicketMessages').length).toBe(2)
  await expect(card(page).locator('textarea')).toHaveCount(0)
})

for (const [decision, mutation, words, done] of [
  ['close', 'adminCloseSupportTicket', de.support.confirmClose, de.support.closed],
  ['delete', 'adminDeleteSupportTicket', de.support.confirmDelete, de.support.deleted],
] as const) {
  test(`asks before it ${decision}s a request, then asks for the list and the count anew`, async ({
    page,
    graphql,
  }, info) => {
    test.skip(info.project.name === 'old', ONLY_NEW)
    graphql.answer({ [mutation]: true })
    await open(page)
    await row(page, 2)
      .getByRole('button', { name: decision === 'close' ? de.support.close : de.delete })
      .click()

    await expect(dialog(page).locator('.modal-title')).toHaveText(words.title)
    await expect(dialog(page).locator('.modal-body')).toHaveText(words.body)
    await dialog(page).getByRole('button', { name: words.yes }).click()
    await expect(dialog(page)).toHaveCount(0)
    await expect(toast(page, done)).toBeVisible()
    expect(asked(graphql, mutation)).toEqual([{ supportTicketId: 3 }])
    await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)
    await expect.poll(() => asked(graphql, 'adminCountOpenSupportTickets').length).toBe(2)
  })
}

test('sends nothing where the question is answered no', async ({ page, graphql }, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await row(page, 0).getByRole('button', { name: de.delete }).click()
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(dialog(page)).toHaveCount(0)
  expect(asked(graphql, 'adminDeleteSupportTicket')).toEqual([])
})

test('sends a decision once, also where its button is pressed again while it goes', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  graphql.answer({
    adminCloseSupportTicket: async () => {
      await held
      return true
    },
  })
  await open(page)
  for (let pressed = 0; pressed < 2; pressed++) {
    await row(page, 0).getByRole('button', { name: de.support.close }).click()
    await dialog(page).getByRole('button', { name: de.support.confirmClose.yes }).click()
  }
  release()
  await expect(toast(page, de.support.closed)).toBeVisible()
  expect(asked(graphql, 'adminCloseSupportTicket')).toEqual([{ supportTicketId: 1 }])
})

test('says in words when a decision is refused, and asks for the list anew', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminDeleteSupportTicket: new Failure('SUPPORT_TICKET_NOT_FOUND') })
  await open(page)
  await row(page, 0).getByRole('button', { name: de.delete }).click()
  await dialog(page).getByRole('button', { name: de.support.confirmDelete.yes }).click()
  await expect(toast(page, de.support.notFound)).toBeVisible()
  await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)
})

test('counts the open requests at the menu entry and at the open tab', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  const entry = page.locator('nav.navbar').getByRole('link', { name: de.navbar.support })
  await open(page)
  await expect(entry.locator('.badge')).toHaveText('6')
  await expect(entry.locator('.badge')).toHaveClass(/text-bg-danger/)
  await expect(tab(page, de.support.tab.open).locator('.badge')).toHaveText('6')

  // after a write, the count as it is now
  graphql.answer({ adminCloseSupportTicket: true })
  graphql.answer({
    adminCountOpenSupportTickets: { forModeration: 4, forMember: 1, onResubmission: 0 },
  })
  await row(page, 0).getByRole('button', { name: de.support.close }).click()
  await dialog(page).getByRole('button', { name: de.support.confirmClose.yes }).click()
  await expect(entry.locator('.badge')).toHaveText('5')
  await expect(tab(page, de.support.tab.open).locator('.badge')).toHaveText('5')

  graphql.answer({
    adminCountOpenSupportTickets: { forModeration: 0, forMember: 0, onResubmission: 0 },
  })
  await page.reload()
  await expect(rows(page)).toHaveCount(6)
  await expect(entry.locator('.badge')).toHaveCount(0)
})

test('steps back a page where the last request of the last page goes', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  // 26 open requests: the second page holds one, until it is closed
  let openCount = 26
  graphql.answer({
    adminCloseSupportTicket: () => {
      openCount = 25
      return true
    },
    adminListSupportTickets: ({ currentPage }: { currentPage: number }) =>
      currentPage === 2 && openCount === 26
        ? ticketList([listedTicket(26, 26)], openCount)
        : currentPage === 2
          ? ticketList([], openCount)
          : ticketList([...tickets, own], openCount),
  })
  await signIn(page, '/support')
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()
  await expect(rows(page)).toHaveCount(1)
  await row(page, 0).getByRole('button', { name: de.support.close }).click()
  await dialog(page).getByRole('button', { name: de.support.confirmClose.yes }).click()

  await expect(rows(page)).toHaveCount(6)
  expect(
    asked(graphql, 'adminListSupportTickets').map(
      (variables) => (variables as { currentPage: number }).currentPage,
    ),
  ).toEqual([1, 2, 2, 1])
  await expect(page.getByRole('menuitem', { name: 'Go to page 2' })).toHaveCount(0)
})

// K4: the search, the group filter and the magnifier, as on the creation page
const groupFilter = (page: Page) => page.getByTestId('support-group-filter')
const searchField = (page: Page) => page.getByPlaceholder(de.user_memo_search)
const listAsked = (graphql: { sentFor: (field: string) => { variables: object }[] }) =>
  asked(graphql, 'adminListSupportTickets') as Record<string, unknown>[]
const OPEN_TAB = {
  statuses: ['OPEN', 'IN_PROGRESS'],
  currentPage: 1,
  pageSize: 25,
  hideResubmission: true,
}
// a search finds nothing in these tests, no search what the tab holds
const nothingFound: Answer = (variables: { query: string; statuses: string[] }) =>
  variables.query ? ticketList([]) : (byTab as (asked: object) => unknown)(variables)

test('searches from the first page, and keeps the search over the tabs and for the moderator', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()
  await expect.poll(() => listAsked(graphql).length).toBe(2)
  await searchField(page).fill('Garten Bibi')
  await expect
    .poll(() => listAsked(graphql).at(-1))
    .toEqual({ ...OPEN_TAB, query: 'Garten Bibi', creationGroup: '' })

  await tab(page, de.support.tab.closed).click()
  await expect
    .poll(() => listAsked(graphql).at(-1))
    .toEqual({
      ...OPEN_TAB,
      statuses: ['CLOSED'],
      hideResubmission: false,
      query: 'Garten Bibi',
      creationGroup: '',
    })
  const kept = await page.evaluate((key) => localStorage.getItem(key), KEPT)
  expect(JSON.parse(kept ?? '{}')[moderator.gradidoID]).toEqual({
    '/support': 'Garten Bibi',
    '/support#tab': 1,
  })
  await page.reload()
  await expect(searchField(page)).toHaveValue('Garten Bibi')
  await expect(rows(page)).toHaveCount(2)

  // the × empties it
  await page.getByRole('button', { name: de.search.clear }).click()
  await expect
    .poll(() => listAsked(graphql).at(-1))
    .toEqual({
      ...OPEN_TAB,
      statuses: ['CLOSED'],
      hideResubmission: false,
      query: '',
      creationGroup: '',
    })
})

test('lets a kept search that finds nothing give way, and keeps one typed here', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await page.evaluate(
    ([key, id]) => localStorage.setItem(key, JSON.stringify({ [id]: { '/support': 'vergessen' } })),
    [KEPT, moderator.gradidoID],
  )
  graphql.answer({ adminListSupportTickets: nothingFound })
  const before = listAsked(graphql).length
  await page.reload()
  await expect(rows(page)).toHaveCount(6)
  await expect(searchField(page)).toHaveValue('')
  expect(
    listAsked(graphql)
      .slice(before)
      .map((variables) => variables.query),
  ).toEqual(['vergessen', ''])
  const kept = await page.evaluate((key) => localStorage.getItem(key), KEPT)
  expect(JSON.parse(kept ?? '{}')[moderator.gradidoID]).toEqual({})

  await searchField(page).fill('niemand')
  await expect(rows(page)).toHaveCount(0)
  await expect(searchField(page)).toHaveValue('niemand')
})

test('filters by group from the first page, and opens on all the moderator sees', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()
  await expect.poll(() => listAsked(graphql).length).toBe(2)
  await groupFilter(page).locator('.dropdown-toggle').click()
  await expect(groupFilter(page).locator('.dropdown-item')).toHaveText([
    de.creationGroupFilter.all,
    de.creationGroupFilter.grouped,
    de.creationGroupFilter.untagged,
    'Garten',
    '#kueche',
  ])
  await groupFilter(page).locator('.dropdown-item', { hasText: 'Garten' }).click()
  await expect
    .poll(() => listAsked(graphql).at(-1))
    .toEqual({ ...OPEN_TAB, query: '', creationGroup: 'garten' })
  await expect(groupFilter(page).locator('.dropdown-toggle')).toHaveText('Garten')

  // the filter is not kept: the page opens on all again
  await page.reload()
  await expect(rows(page)).toHaveCount(6)
  expect(listAsked(graphql).at(-1)).toEqual({ ...OPEN_TAB, query: '', creationGroup: '' })
  await expect(groupFilter(page).locator('.dropdown-toggle')).toHaveText(de.creationGroupFilter.all)
})

for (const [who, scope, first, choices] of [
  [
    'a moderator of a group and of the requests without one',
    { visibleCreationGroups: ['kueche'], seesUntagged: true },
    '',
    [
      de.creationGroupFilter.all,
      de.creationGroupFilter.grouped,
      de.creationGroupFilter.untagged,
      '#kueche',
    ],
  ],
  [
    'a moderator of a group alone',
    { visibleCreationGroups: ['kueche'], seesUntagged: false },
    '*grouped',
    [de.creationGroupFilter.grouped, '#kueche'],
  ],
  [
    'a moderator of the requests without a group alone',
    { visibleCreationGroups: [], seesUntagged: true },
    '*untagged',
    [de.creationGroupFilter.untagged],
  ],
] as const) {
  test(`opens ${who} on all they see`, async ({ page, graphql }, info) => {
    test.skip(info.project.name === 'old', ONLY_NEW)
    const scoped = {
      ...moderator,
      role: 'MODERATOR',
      seesAllCreationGroups: false,
      visibleCreationGroups: [...scope.visibleCreationGroups],
      seesUntagged: scope.seesUntagged,
    }
    graphql.answer(signedInAnswers(scoped))
    await signIn(page, '/support', scoped)
    await expect(rows(page)).toHaveCount(6)

    expect(listAsked(graphql)).toEqual([{ ...OPEN_TAB, query: '', creationGroup: first }])
    await groupFilter(page).locator('.dropdown-toggle').click()
    await expect(groupFilter(page).locator('.dropdown-item')).toHaveText([...choices])
  })
}

test('searches for the member of a row with its magnifier: the address, else the username', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminListSupportTickets: ticketList([
      listedTicket(1, 1),
      listedTicket(2, 2, { userEmail: null }),
    ]),
  })
  await signIn(page, '/support')
  await expect(rows(page)).toHaveCount(2)
  await row(page, 0).getByRole('button', { name: de.support.searchMember }).click()
  await expect(searchField(page)).toHaveValue('member1@example.org')
  await expect
    .poll(() => listAsked(graphql).at(-1))
    .toEqual({ ...OPEN_TAB, query: 'member1@example.org', creationGroup: '' })

  await row(page, 1).getByRole('button', { name: de.support.searchMember }).click()
  await expect(searchField(page)).toHaveValue('member2')
})

// K4: the resubmission -- the box of the form, the line of the row, and the open tab without
const box = (page: Page) => card(page).getByTestId('support-resubmission-box')
const day = (page: Page) => card(page).getByTestId('support-resubmission-day')
const time = (page: Page) => card(page).getByTestId('support-resubmission-time')
const hideBox = (page: Page) => page.getByLabel(de.hide_resubmission)

test('hides on the open tab what waits for a resubmission, at every opening, and shows it once asked', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await expect(hideBox(page)).toBeChecked()
  await page.getByRole('menuitem', { name: 'Go to page 2' }).click()
  await expect.poll(() => listAsked(graphql).length).toBe(2)
  await hideBox(page).uncheck()
  await expect
    .poll(() => listAsked(graphql).at(-1))
    .toEqual({ ...OPEN_TAB, hideResubmission: false, query: '', creationGroup: '' })

  // the other tabs hide nothing, and have no box
  await tab(page, de.support.tab.closed).click()
  await expect(rows(page)).toHaveCount(2)
  await expect(hideBox(page)).toHaveCount(0)
  expect(listAsked(graphql).at(-1)).toMatchObject({ hideResubmission: false })
  // not kept: the next opening hides again
  await tab(page, de.support.tab.open).click()
  await page.reload()
  await expect(hideBox(page)).toBeChecked()
  expect(listAsked(graphql).at(-1)).toMatchObject({ hideResubmission: true })
})

test('says below the words when a request is wanted back, while that is still to come', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminListSupportTickets: ticketList([
      listedTicket(1, 1, { resubmissionAt: '2030-11-20T08:00:00.000Z' }),
      listedTicket(2, 2, { resubmissionAt: '2020-01-01T08:00:00.000Z' }),
    ]),
  })
  await signIn(page, '/support')
  await expect(rows(page)).toHaveCount(2)
  await expect(row(page, 0)).toContainText('Wiedervorlage: 20.11.2030, 09:00')
  await expect(row(page, 1)).not.toContainText(de.hide_resubmission.split(' ')[0])
  await expect(row(page, 1)).not.toContainText('Wiedervorlage:')
})

test('opens the box as the request came: its moment while still to come, empty once due', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminListSupportTickets: ticketList([
      listedTicket(1, 1, { resubmissionAt: '2030-11-20T08:00:00.000Z' }),
      listedTicket(2, 2, { resubmissionAt: '2020-01-01T08:00:00.000Z' }),
    ]),
  })
  await signIn(page, '/support')
  await details(page, 0).click()
  await expect(box(page)).toBeChecked()
  await expect(day(page)).toHaveValue('2030-11-20')
  await expect(time(page)).toHaveValue('09:00')
  await details(page, 0).click()
  await details(page, 1).click()
  await expect(box(page)).not.toBeChecked()
  await expect(day(page)).toHaveCount(0)
})

test('answers with a resubmission as an ISO moment, and closes nothing while the box is set', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminCreateSupportTicketMessage: { id: 99 } })
  await opened(page)
  await field(page).fill('Ich melde mich nächste Woche.')
  await box(page).check()
  // without a day nothing goes
  await expect(button(page, de.support.answer)).toBeDisabled()
  await day(page).fill('2030-11-20')
  await time(page).fill('09:00')
  await expect(button(page, de.support.answer)).toBeEnabled()
  await expect(button(page, de.support.answerAndClose)).toBeDisabled()
  await expect(
    card(page).locator('span[title]', {
      has: page.getByRole('button', { name: de.support.answerAndClose, exact: true }),
    }),
  ).toHaveAttribute('title', de.support.closingWaits)
  await button(page, de.support.answer).click()

  await expect(toast(page, de.message.request)).toBeVisible()
  // the moment where the moderator sits (Berlin, winter time): 09:00 is 08:00 UTC
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    {
      supportTicketId: 1,
      message: 'Ich melde mich nächste Woche.',
      type: 'DIALOG',
      close: false,
      resubmissionAt: '2030-11-20T08:00:00.000Z',
    },
  ])
})

test('sends no resubmission in the past, and none with a time that is no time', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminCreateSupportTicketMessage: { id: 99 } })
  await opened(page)
  await choose(page, de.moderator.notice)
  await field(page).fill('Rückruf vereinbart')
  await box(page).check()
  await day(page).fill('2020-01-01')
  await button(page, de.save).click()
  await expect(toast(page, de.contributionMessagesForm.resubmissionDateInPast)).toBeVisible()
  await day(page).fill('2030-11-20')
  await time(page).fill('9')
  await expect(button(page, de.save)).toBeDisabled()
  // made whole as the field is left
  await time(page).blur()
  await expect(time(page)).toHaveValue('09:00')
  await button(page, de.save).click()
  await expect(toast(page, de.message.request)).toBeVisible()
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    {
      supportTicketId: 1,
      message: 'Rückruf vereinbart',
      type: 'MODERATOR',
      close: false,
      resubmissionAt: '2030-11-20T08:00:00.000Z',
    },
  ])
})

test('sends nothing of a box it did not touch: the request keeps what it has, and the box follows it', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  // waiting until Monday; after the first note the list says the member took it away meanwhile
  let waits = true
  graphql.answer({
    adminCreateSupportTicketMessage: () => {
      waits = false
      return { id: 99 }
    },
    adminListSupportTickets: () =>
      ticketList([
        listedTicket(1, 1, { resubmissionAt: waits ? '2030-11-20T08:00:00.000Z' : null }),
        listedTicket(2, 2),
      ]),
  })
  await signIn(page, '/support')
  await details(page, 0).click()
  await expect(box(page)).toBeChecked()
  await choose(page, de.moderator.notice)
  await field(page).fill('Rückruf vereinbart')
  await button(page, de.save).click()
  await expect(toast(page, de.message.request)).toBeVisible()
  const [first] = asked(graphql, 'adminCreateSupportTicketMessage')
  expect(first).toEqual({
    supportTicketId: 1,
    message: 'Rückruf vereinbart',
    type: 'MODERATOR',
    close: false,
  })
  expect('resubmissionAt' in first).toBe(false)
  // the new list has none: the untouched box follows it, and the next note sends nothing either
  await expect(box(page)).not.toBeChecked()
  await field(page).fill('Noch ein Vermerk')
  await button(page, de.save).click()
  await expect.poll(() => asked(graphql, 'adminCreateSupportTicketMessage').length).toBe(2)
  expect('resubmissionAt' in asked(graphql, 'adminCreateSupportTicketMessage')[1]).toBe(false)
  // touched, it goes: ticked off it takes the resubmission away
  await box(page).check()
  await box(page).uncheck()
  await field(page).fill('Doch nicht warten')
  await button(page, de.save).click()
  await expect.poll(() => asked(graphql, 'adminCreateSupportTicketMessage').length).toBe(3)
  expect(asked(graphql, 'adminCreateSupportTicketMessage')[2]).toMatchObject({
    resubmissionAt: null,
  })
})

test('has no box for a note under a closed request, and one for an answer there', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  await tab(page, de.support.tab.closed).click()
  await expect(rows(page)).toHaveCount(2)
  await details(page, 0).click()
  await expect(box(page)).toBeVisible()
  await choose(page, de.moderator.notice)
  await expect(box(page)).toHaveCount(0)
})

// K4: handing a request on to another group, from the dropdown of its row
const pickGroup = async (page: Page, index: number, group: string) => {
  await row(page, index).locator('.group-select .dropdown-toggle').click()
  await row(page, index).locator('.group-select .dropdown-item', { hasText: group }).click()
}
const shownGroup = (page: Page, index: number) =>
  row(page, index).locator('.group-select .dropdown-toggle')

test('hands an open request on to another group once asked, then asks for the list and the count anew', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminReassignSupportTicket: true })
  await open(page)
  await expect(shownGroup(page, 0)).toHaveText('Garten')
  await expect(shownGroup(page, 0)).toHaveAttribute('aria-label', de.support.reassign)

  await pickGroup(page, 0, '#kueche')
  await expect(dialog(page).locator('.modal-title')).toHaveText(de.support.reassign)
  await expect(dialog(page).locator('.modal-body p')).toHaveText([
    'Diese Anfrage von Garten an #kueche weiterreichen?',
    de.support.reassignHint,
  ])
  // what is asked stands in the dropdown meanwhile
  await expect(shownGroup(page, 0)).toHaveText('#kueche')
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()

  await expect(dialog(page)).toHaveCount(0)
  await expect(toast(page, de.support.reassigned)).toBeVisible()
  expect(asked(graphql, 'adminReassignSupportTicket')).toEqual([
    { supportTicketId: 1, creationGroupTag: 'kueche' },
  ])
  // whether the request is still in the list is the server's to say
  await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)
  await expect.poll(() => asked(graphql, 'adminCountOpenSupportTickets').length).toBe(2)
})

test('hands on from "(ohne Gruppe)" and to it, a deleted member\'s request too', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminReassignSupportTicket: true })
  await open(page)

  await expect(shownGroup(page, 1)).toHaveText(de.contribution.noGroup)
  await pickGroup(page, 1, 'Garten')
  await expect(dialog(page).locator('.modal-body p').first()).toHaveText(
    `Diese Anfrage von ${de.contribution.noGroup} an Garten weiterreichen?`,
  )
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await expect(toast(page, de.support.reassigned)).toBeVisible()
  await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)

  await pickGroup(page, 4, 'Garten')
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await pickGroup(page, 0, de.contribution.noGroup)
  await expect(dialog(page).locator('.modal-body p').first()).toHaveText(
    `Diese Anfrage von Garten an ${de.contribution.noGroup} weiterreichen?`,
  )
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await expect
    .poll(() => asked(graphql, 'adminReassignSupportTicket'))
    .toEqual([
      { supportTicketId: 2, creationGroupTag: 'garten' },
      { supportTicketId: 5, creationGroupTag: 'garten' },
      { supportTicketId: 1, creationGroupTag: '' },
    ])
})

test('offers the dropdown on open requests only, on "Alle" too, and never on the own', async ({
  page,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  await open(page)
  for (const index of [0, 1, 2, 3, 4]) {
    await expect(row(page, index).locator('.group-select')).toHaveCount(1)
  }
  // the own request: its group as text (SUA-018)
  await expect(row(page, 5).locator('.group-select')).toHaveCount(0)
  await expect(row(page, 5).locator('td').nth(3)).toContainText(de.contribution.noGroup)

  await tab(page, de.support.tab.closed).click()
  await expect(rows(page)).toHaveCount(2)
  await expect(page.locator('.support-tickets-table .group-select')).toHaveCount(0)

  await tab(page, de.support.tab.all).click()
  await expect(rows(page)).toHaveCount(9)
  // the five open ones that are not the own
  await expect(page.locator('.support-tickets-table .group-select')).toHaveCount(5)
})

test('puts the dropdown back where the question is answered no, or the server refuses', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ adminReassignSupportTicket: new Failure('SUPPORT_TICKET_MESSAGES_REACHED') })
  await open(page)

  await pickGroup(page, 0, '#kueche')
  await dialog(page).getByRole('button', { name: de.overlay.cancel }).click()
  await expect(dialog(page)).toHaveCount(0)
  await expect(shownGroup(page, 0)).toHaveText('Garten')
  expect(asked(graphql, 'adminReassignSupportTicket')).toEqual([])

  await pickGroup(page, 0, '#kueche')
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await expect(toast(page, 'Diese Anfrage ist schon 100 Mal weitergereicht worden.')).toBeVisible()
  await expect(shownGroup(page, 0)).toHaveText('Garten')
  await expect.poll(() => asked(graphql, 'adminListSupportTickets').length).toBe(2)

  graphql.answer({ adminReassignSupportTicket: new Failure('SUPPORT_TICKET_UNKNOWN_GROUP') })
  await pickGroup(page, 0, '#kueche')
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await expect(toast(page, de.support.unknownGroup)).toBeVisible()
})

test('sends a handing on once: while it goes, its dropdown takes no other pick', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  graphql.answer({
    adminReassignSupportTicket: async () => {
      await held
      return true
    },
  })
  await open(page)
  await pickGroup(page, 0, '#kueche')
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await expect(dialog(page)).toHaveCount(0)
  await pickGroup(page, 0, de.contribution.noGroup)
  await expect(dialog(page)).toHaveCount(0)
  await expect(shownGroup(page, 0)).toHaveText('#kueche')

  release()
  await expect(toast(page, de.support.reassigned)).toBeVisible()
  expect(asked(graphql, 'adminReassignSupportTicket')).toEqual([
    { supportTicketId: 1, creationGroupTag: 'kueche' },
  ])
})

test("keeps the row's own group among the choices while the groups do not come", async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({ creationGroups: new Failure('the groups did not come') })
  await open(page)
  await expect(shownGroup(page, 0)).toHaveText('Garten')
  await shownGroup(page, 0).click()
  await expect(row(page, 0).locator('.group-select .dropdown-item')).toHaveText([
    de.contribution.noGroup,
    'Garten',
  ])
})

test('shows in the thread who handed a request on, from which group to which', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  graphql.answer({
    adminListSupportTicketMessages: [
      ticketMessage(1),
      ticketMessage(2, {
        type: 'REASSIGNED',
        message: 'Garten\n',
        userAlias: 'peter',
        userId: 99,
        isModerator: true,
      }),
      // words in another shape: the head alone
      ticketMessage(3, {
        type: 'REASSIGNED',
        message: 'Garten',
        userAlias: 'peter',
        userId: 99,
        isModerator: true,
      }),
    ],
  })
  await open(page)
  await details(page, 0).click()

  const lines = card(page).locator('.contribution-messages-list-item')
  await expect(lines).toHaveCount(3)
  await expect(lines.nth(1).locator('[data-test="message-kind"]')).toHaveText(
    de.support.reassignedHead,
  )
  await expect(lines.nth(1).locator('[data-test="moderator-message"]')).toHaveText(
    `von Garten an ${de.contribution.noGroup}`,
  )
  await expect(lines.nth(1).locator('[data-test="moderator-name"]')).toHaveText('peter')
  await expect(lines.nth(2).locator('[data-test="message-kind"]')).toHaveText(
    de.support.reassignedHead,
  )
  await expect(lines.nth(2).locator('[data-test="moderator-message"]')).toHaveCount(0)
})

test('loads the thread of an opened request anew once it comes back in another group', async ({
  page,
  graphql,
}, info) => {
  test.skip(info.project.name === 'old', ONLY_NEW)
  let moved = false
  graphql.answer({
    adminReassignSupportTicket: () => {
      moved = true
      return true
    },
    adminListSupportTickets: () =>
      ticketList(
        [
          listedTicket(
            1,
            1,
            moved
              ? { creationGroupTag: 'kueche' }
              : { creationGroupTag: 'garten', creationGroupName: 'Garten' },
          ),
          ...tickets.slice(1),
          own,
        ],
        30,
      ),
  })
  await open(page)
  await details(page, 0).click()
  await expect.poll(() => asked(graphql, 'adminListSupportTicketMessages').length).toBe(1)

  await pickGroup(page, 0, '#kueche')
  await dialog(page).getByRole('button', { name: de.support.reassignConfirm }).click()
  await expect(toast(page, de.support.reassigned)).toBeVisible()
  await expect(shownGroup(page, 0)).toHaveText('#kueche')
  await expect.poll(() => asked(graphql, 'adminListSupportTicketMessages').length).toBe(2)
  // the row stays open
  await expect(card(page)).toBeVisible()
})
