// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { setLocale } from '@/i18n'
import {
  answerVariables,
  charactersOf,
  closingLine,
  isOpenTicket,
  MESSAGE_MAX_CHARS,
  memberSearchOf,
  refusalWords,
  SUPPORT_TICKET_MESSAGES_MAX,
  sendable,
  supportGroupFilterOptions,
  ticketDetailsState,
  ticketRowTone,
  waitingUntil,
} from './SupportTicket.logic'
import type { ListedSupportTicket } from './SupportTicket.schema'

beforeEach(() => setLocale('de'))
afterEach(() => setLocale('en'))

describe('the bounds of a thread', () => {
  // The server's file loads the native addon: read as text, the number after the name.
  const server = readFileSync(
    new URL('../../../shared/src/const/index.ts', import.meta.url),
    'utf8',
  )
  const serverValue = (name: string) =>
    Number(server.match(new RegExp(`export const ${name} = (\\d+)\\n`))?.[1])

  it('are those of the server', () => {
    expect(MESSAGE_MAX_CHARS).toBe(serverValue('MESSAGE_MAX_CHARS'))
    expect(SUPPORT_TICKET_MESSAGES_MAX).toBe(serverValue('SUPPORT_TICKET_MESSAGES_MAX'))
  })
})

describe('sendable', () => {
  it('counts as the server counts: without the blanks around, an emoji as one', () => {
    expect(charactersOf('  Hallo \n')).toBe(5)
    expect(charactersOf('😊😊')).toBe(2)
  })

  it('sends words up to the bound, and neither none nor more', () => {
    expect(sendable('Ja.')).toBe(true)
    expect(sendable(` ${'😊'.repeat(MESSAGE_MAX_CHARS)} `)).toBe(true)
    expect(sendable('a'.repeat(MESSAGE_MAX_CHARS + 1))).toBe(false)
    expect(sendable(' \n ')).toBe(false)
    expect(sendable('')).toBe(false)
  })
})

describe('answerVariables', () => {
  it('sends an answer, an answer that closes, and a note that closes nothing', () => {
    const none = { resubmissionAt: null }
    expect(answerVariables(7, 'Ja.', { note: false, close: false, ...none })).toEqual({
      supportTicketId: 7,
      message: 'Ja.',
      type: 'DIALOG',
      close: false,
      resubmissionAt: null,
    })
    expect(answerVariables(7, 'Ja.', { note: false, close: true, ...none })).toMatchObject({
      type: 'DIALOG',
      close: true,
    })
    expect(answerVariables(7, 'Intern', { note: true, close: true, ...none })).toMatchObject({
      type: 'MODERATOR',
      close: false,
    })
  })

  it('sends the resubmission as the box stands (K4)', () => {
    expect(
      answerVariables(7, 'Ich melde mich.', {
        note: true,
        close: false,
        resubmissionAt: '2026-11-20T08:00:00.000Z',
      }),
    ).toMatchObject({ type: 'MODERATOR', resubmissionAt: '2026-11-20T08:00:00.000Z' })
  })
})

describe('refusalWords', () => {
  it('says out of reach, a full thread of the kind sent, or that it did not work', () => {
    expect(refusalWords(['SUPPORT_TICKET_NOT_FOUND'], { note: false })).toBe(
      'Diese Anfrage gibt es nicht, oder sie liegt außerhalb Deiner Gruppen.',
    )
    expect(refusalWords(['SUPPORT_TICKET_MESSAGES_REACHED'], { note: false })).toBe(
      'In dieser Anfrage stehen schon 100 Nachrichten.',
    )
    expect(refusalWords(['SUPPORT_TICKET_MESSAGES_REACHED'], { note: true })).toBe(
      'In dieser Anfrage stehen schon 100 Notizen.',
    )
    for (const code of ['SUPPORT_TICKET_INVALID', 'SUPPORT_TICKET_NOT_STORED', 'Failed to fetch']) {
      expect(refusalWords([code], { note: false })).toBe(
        'Das hat nicht geklappt. Versuch es bitte noch einmal.',
      )
    }
  })
})

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
  resubmissionAt: null,
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

describe('supportGroupFilterOptions', () => {
  const GROUPS = [
    { tag: 'garden', name: 'Garten' },
    { tag: 'choir', name: null },
  ]
  const values = (moderator: Parameters<typeof supportGroupFilterOptions>[0]) =>
    supportGroupFilterOptions(moderator, GROUPS).map((option) => option.value)

  it('opens for everybody on the value that shows all they see', () => {
    // all groups: everything, with and without a group
    expect(
      values({ seesAllCreationGroups: true, visibleCreationGroups: [], seesUntagged: true }),
    ).toEqual(['', '*grouped', '*untagged', 'garden', 'choir'])
    // groups and the requests of none: both, which the creation page has no value for
    expect(
      values({
        seesAllCreationGroups: false,
        visibleCreationGroups: ['garden'],
        seesUntagged: true,
      }),
    ).toEqual(['', '*grouped', '*untagged', 'garden'])
    // groups alone: all of theirs
    expect(
      values({
        seesAllCreationGroups: false,
        visibleCreationGroups: ['garden'],
        seesUntagged: false,
      }),
    ).toEqual(['*grouped', 'garden'])
    // the requests of no group alone
    expect(
      values({ seesAllCreationGroups: false, visibleCreationGroups: [], seesUntagged: true }),
    ).toEqual(['*untagged'])
  })

  it('names the choices in the words of the creation page', () => {
    const [first] = supportGroupFilterOptions(
      { seesAllCreationGroups: false, visibleCreationGroups: ['garden'], seesUntagged: true },
      GROUPS,
    )
    expect(first.text).toBe('(mit und ohne Gruppe)')
  })
})

describe('memberSearchOf', () => {
  const member = (alias: string | null) =>
    ({ alias }) as unknown as NonNullable<ListedSupportTicket['user']>

  it('searches by the address, and without one by the username', () => {
    expect(memberSearchOf(ticket({ user: member('BBB'), userEmail: 'bibi@bloxberg.de' }))).toBe(
      'bibi@bloxberg.de',
    )
    expect(memberSearchOf(ticket({ user: member('BBB'), userEmail: null }))).toBe('BBB')
  })

  it('has nothing to search without a member, or with neither', () => {
    expect(memberSearchOf(ticket({ user: null, userEmail: 'bibi@bloxberg.de' }))).toBeNull()
    expect(memberSearchOf(ticket({ user: member(null), userEmail: null }))).toBeNull()
  })
})

describe('waitingUntil', () => {
  const NOW = new Date('2026-11-14T16:00:00.000Z')

  it('is the moment of a resubmission still to come', () => {
    expect(waitingUntil(ticket({ resubmissionAt: '2026-11-20T08:00:00.000Z' }), NOW)).toEqual(
      new Date('2026-11-20T08:00:00.000Z'),
    )
  })

  it('is none for a due one, and without one', () => {
    expect(waitingUntil(ticket({ resubmissionAt: '2026-11-14T15:59:00.000Z' }), NOW)).toBeNull()
    expect(waitingUntil(ticket({ resubmissionAt: NOW.toISOString() }), NOW)).toBeNull()
    expect(waitingUntil(ticket(), NOW)).toBeNull()
  })
})
