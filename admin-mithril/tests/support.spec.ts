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

// the two halves of the open tab (K3): the badges show their sum
const OPEN = { forModeration: 5, forMember: 1 }

test.beforeEach(async ({ graphql }) => {
  graphql.answer({
    ...signedInAnswers(),
    adminListSupportTickets: byTab,
    adminCountOpenSupportTickets: OPEN,
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

  await expect(page.locator('li.bg-color-creation + li')).toHaveText(`${de.navbar.support} 6`)
  await expect(
    page.locator('nav.navbar').getByRole('link', { name: de.navbar.support }),
  ).toHaveClass(/\bactive\b/)
  expect(asked(graphql, 'adminListSupportTickets')).toEqual([
    { statuses: ['OPEN', 'IN_PROGRESS'], currentPage: 1, pageSize: 25 },
  ])
  await expect(heads(page)).toHaveText([
    de.delete,
    de.name,
    de.support.request,
    de.support.sent,
    de.details,
    de.support.close,
  ])
  await expect(row(page, 0)).toHaveClass(/table-primary/)
  await expect(row(page, 0).locator('td').nth(1)).toContainText('First1 Last1')
  await expect(row(page, 0).locator('td').nth(1)).toContainText('member1')
  await expect(row(page, 0).locator('td').nth(2)).toContainText('Garten')
  await expect(row(page, 0).getByTestId('support-ticket-text')).toHaveText('Words of request 1')
  await expect(row(page, 0).locator('td').nth(3)).toHaveText('13.11.2026')
  await expect(row(page, 1).locator('td').nth(2)).toContainText(de.contribution.noGroup)
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
  // a deleted member's: it does not open, but it can be deleted and closed (K3)
  await expect(row(page, 4).getByRole('button')).toHaveText(['', ''])
  await expect(row(page, 4).getByRole('button', { name: de.delete })).toBeVisible()
  await expect(row(page, 4).getByRole('button', { name: de.support.close })).toBeVisible()
  // the moderator's own: on it they are the member (SUA-018)
  await expect(row(page, 5).locator('td').nth(1)).toContainText('First6 Last6')
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
    '/admin/user?search=member1%40example.org',
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
  })
})

// K3: the moderation answers, notes, closes with the tick and deletes; the count of the open tab.
const field = (page: Page) => card(page).locator('.tab-pane.active textarea')
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
    { supportTicketId: 1, message: 'Am **Handy** oben rechts.', type: 'DIALOG', close: false },
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
    { supportTicketId: 1, message: 'Ja, genau so.', type: 'DIALOG', close: true },
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
  await card(page).getByRole('tab', { name: de.moderator.notice }).click()
  await expect(card(page).locator('.row.mt-4 button')).toHaveText([de.form.cancel, de.save])
  await field(page).fill('Rückruf vereinbart')
  await button(page, de.save).click()

  await expect(toast(page, de.message.request)).toBeVisible()
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    { supportTicketId: 1, message: 'Rückruf vereinbart', type: 'MODERATOR', close: false },
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
  const notice = card(page).getByRole('tab', { name: de.moderator.notice })
  const message = card(page).getByRole('tab', { name: de.moderator.message })
  await notice.click()
  await field(page).fill('Intern: hat sich selbst geholfen.')
  await message.click()
  await expect(field(page)).toHaveValue('')
  await expect(button(page, de.support.answer)).toBeDisabled()
  await field(page).fill('Schön, dass es klappt!')
  await button(page, de.support.answer).click()

  await expect(toast(page, de.message.request)).toBeVisible()
  expect(asked(graphql, 'adminCreateSupportTicketMessage')).toEqual([
    { supportTicketId: 1, message: 'Schön, dass es klappt!', type: 'DIALOG', close: false },
  ])
  // the note's draft is still there, and "Abbrechen" empties only the draft shown
  await notice.click()
  await expect(field(page)).toHaveValue('Intern: hat sich selbst geholfen.')
  await message.click()
  await field(page).fill('Doch nicht')
  await button(page, de.form.cancel).click()
  await notice.click()
  await expect(field(page)).toHaveValue('Intern: hat sich selbst geholfen.')
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

  await card(page).getByRole('tab', { name: de.moderator.notice }).click()
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
  graphql.answer({ adminCountOpenSupportTickets: { forModeration: 4, forMember: 1 } })
  await row(page, 0).getByRole('button', { name: de.support.close }).click()
  await dialog(page).getByRole('button', { name: de.support.confirmClose.yes }).click()
  await expect(entry.locator('.badge')).toHaveText('5')
  await expect(tab(page, de.support.tab.open).locator('.badge')).toHaveText('5')

  graphql.answer({ adminCountOpenSupportTickets: { forModeration: 0, forMember: 0 } })
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
