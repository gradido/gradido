// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { setLocale } from '@/i18n'
import { closingLine, isOpenTicket, ticketDetailsState, ticketRowTone } from './SupportTicket.logic'
import type { ListedSupportTicket } from './SupportTicket.schema'

beforeEach(() => setLocale('de'))
afterEach(() => setLocale('en'))

const ticket = (more: Partial<ListedSupportTicket> = {}): ListedSupportTicket => ({
  id: 1,
  userId: 7,
  user: null,
  userEmail: null,
  text: 'Wie schöpfe ich?',
  status: 'OPEN',
  creationGroupTag: null,
  creationGroupName: null,
  createdAt: '2026-11-14T09:00:00.000Z',
  closedAt: null,
  closedBy: null,
  closedByUserName: null,
  lastMessageType: null,
  lastMessageByModerator: null,
  ...more,
})

describe('isOpenTicket', () => {
  it('is open while open or with a question back', () => {
    expect(isOpenTicket(ticket({ status: 'OPEN' }))).toBe(true)
    expect(isOpenTicket(ticket({ status: 'IN_PROGRESS' }))).toBe(true)
    expect(isOpenTicket(ticket({ status: 'CLOSED' }))).toBe(false)
    expect(isOpenTicket(ticket({ status: 'DELETED' }))).toBe(false)
  })
})

describe('ticketRowTone', () => {
  it('colours open blue, closed green and deleted red, as the creation page', () => {
    expect(ticketRowTone(ticket({ status: 'OPEN' }))).toBe('table-primary')
    expect(ticketRowTone(ticket({ status: 'IN_PROGRESS' }))).toBe('table-primary')
    expect(ticketRowTone(ticket({ status: 'CLOSED' }))).toBe('table-success')
    expect(ticketRowTone(ticket({ status: 'DELETED' }))).toBe('table-danger')
  })
})

describe('ticketDetailsState', () => {
  it('shows a question back while the member is to answer', () => {
    expect(ticketDetailsState(ticket({ status: 'IN_PROGRESS', lastMessageType: 'DIALOG' }))).toBe(
      'question',
    )
  })

  it('shows the answer of the member where an open request has their last word', () => {
    expect(
      ticketDetailsState(
        ticket({ status: 'OPEN', lastMessageType: 'DIALOG', lastMessageByModerator: false }),
      ),
    ).toBe('answer')
  })

  it('shows a conversation where the moderation had the last word, or the request is closed', () => {
    expect(
      ticketDetailsState(ticket({ lastMessageType: 'DIALOG', lastMessageByModerator: true })),
    ).toBe('conversation')
    expect(
      ticketDetailsState(
        ticket({ status: 'CLOSED', lastMessageType: 'DIALOG', lastMessageByModerator: false }),
      ),
    ).toBe('conversation')
  })

  it('shows nothing where nobody wrote in the thread yet', () => {
    expect(ticketDetailsState(ticket())).toBeNull()
  })
})

describe('closingLine', () => {
  it('names the member as the member where they closed their own request', () => {
    expect(
      closingLine(ticket({ status: 'CLOSED', closedBy: 7, closedByUserName: 'Bibi Bloxberg' })),
    ).toBe('Vom Mitglied geschlossen')
  })

  it('names the moderator who closed it, and the one who deleted it', () => {
    expect(
      closingLine(ticket({ status: 'CLOSED', closedBy: 3, closedByUserName: 'Peter Lustig' })),
    ).toBe('Geschlossen von Peter Lustig')
    expect(
      closingLine(ticket({ status: 'DELETED', closedBy: 3, closedByUserName: 'Peter Lustig' })),
    ).toBe('Gelöscht von Peter Lustig')
  })

  it('says nothing while it is open, or where nobody is known any more', () => {
    expect(closingLine(ticket())).toBe('')
    expect(closingLine(ticket({ status: 'DELETED', closedBy: 3, closedByUserName: null }))).toBe('')
  })
})
