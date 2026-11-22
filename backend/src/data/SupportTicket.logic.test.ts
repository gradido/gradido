// AI-GENERATED — not an architecture reference
import type { HandledCreationGroups } from './HandledCreationGroups.schema'
import {
  closingOf,
  moderatorMessageKind,
  reassignedLine,
  SUPPORT_TICKET_MAIL_RECIPIENTS_MAX,
  SUPPORT_TICKET_MAILED_PER_HOUR_MAX,
  SupportTicketMailCandidate,
  supportAnswerMailDecision,
  supportTicketGroupName,
  supportTicketMailRecipients,
  supportTicketMailsAllowed,
  supportTicketsWindowStart,
} from './SupportTicket.logic'

describe('moderatorMessageKind', () => {
  it('tells an answer, an answer that closes and a note', () => {
    expect(moderatorMessageKind('DIALOG', false, false)).toBe('ANSWER')
    expect(moderatorMessageKind('DIALOG', true, false)).toBe('ANSWER_AND_CLOSE')
    expect(moderatorMessageKind('MODERATOR', false, false)).toBe('NOTE')
  })

  it('knows no note that closes', () => {
    expect(moderatorMessageKind('MODERATOR', true, false)).toBeNull()
    expect(moderatorMessageKind('MODERATOR', true, true)).toBeNull()
  })

  it('knows no message of the kind a handing on leaves: only the server writes that line (K4)', () => {
    expect(moderatorMessageKind('REASSIGNED', false, false)).toBeNull()
    expect(moderatorMessageKind('REASSIGNED', true, false)).toBeNull()
  })

  it('lets an answer and a note set a resubmission, and no answer that closes (K4)', () => {
    expect(moderatorMessageKind('DIALOG', false, true)).toBe('ANSWER')
    expect(moderatorMessageKind('MODERATOR', false, true)).toBe('NOTE')
    expect(moderatorMessageKind('DIALOG', true, true)).toBeNull()
  })
})

describe('supportAnswerMailDecision', () => {
  const confirmed = { emailContact: { emailChecked: true } } as Parameters<
    typeof supportAnswerMailDecision
  >[1]
  const unconfirmed = { emailContact: { emailChecked: false } } as Parameters<
    typeof supportAnswerMailDecision
  >[1]

  it('mails an answer, with or without closing, to a confirmed address', () => {
    expect(supportAnswerMailDecision('ANSWER', confirmed)).toBe('MAIL')
    expect(supportAnswerMailDecision('ANSWER_AND_CLOSE', confirmed)).toBe('MAIL')
  })

  it('never mails a note, also to a confirmed address and without a member', () => {
    expect(supportAnswerMailDecision('NOTE', confirmed)).toBe('NOTE')
    expect(supportAnswerMailDecision('NOTE', null)).toBe('NOTE')
  })

  it('mails no address that is not confirmed', () => {
    expect(supportAnswerMailDecision('ANSWER', unconfirmed)).toBe('NOT_CONFIRMED')
    expect(supportAnswerMailDecision('ANSWER_AND_CLOSE', unconfirmed)).toBe('NOT_CONFIRMED')
  })

  it('has nobody to mail without a member: an account gone, no address in force', () => {
    expect(supportAnswerMailDecision('ANSWER', null)).toBe('NO_MEMBER')
  })
})

describe('supportTicketsWindowStart', () => {
  it('is 24 hours before the moment', () => {
    expect(supportTicketsWindowStart(new Date('2026-11-14T12:00:00.000Z'))).toEqual(
      new Date('2026-11-13T12:00:00.000Z'),
    )
  })
})

describe('closingOf', () => {
  const MORNING = new Date('2026-11-14T08:00:00.000Z')
  const NOON = new Date('2026-11-14T12:00:00.000Z')
  // closed in the morning by 7, deleted at noon by 9
  const row = { closedAt: MORNING, closedBy: 7, deletedAt: NOON, deletedBy: 9 }

  it('names the closing of a closed request', () => {
    expect(closingOf({ ...row, status: 'CLOSED' })).toEqual({ at: MORNING, by: 7 })
  })

  it('names the deleting of a deleted one, not an earlier closing', () => {
    expect(closingOf({ ...row, status: 'DELETED' })).toEqual({ at: NOON, by: 9 })
  })

  it('names nobody for an open one or one with a question back', () => {
    expect(closingOf({ ...row, status: 'OPEN' })).toEqual({ at: null, by: null })
    expect(closingOf({ ...row, status: 'IN_PROGRESS' })).toEqual({ at: null, by: null })
  })
})

describe('reassignedLine', () => {
  it('names the two groups a line each, by name, without one by its tag, none as empty', () => {
    expect(reassignedLine({ tag: 'garden', name: 'Garten' }, { tag: null, name: null })).toBe(
      'Garten\n',
    )
    expect(reassignedLine({ tag: null, name: null }, { tag: 'choir', name: null })).toBe('\n#choir')
    expect(reassignedLine({ tag: 'garden', name: '' }, { tag: 'choir', name: 'Chor' })).toBe(
      '#garden\nChor',
    )
  })

  it('writes exactly two lines, also where a name has a line break in it', () => {
    expect(
      reassignedLine({ tag: 'garden', name: 'Garten\r\nam Hang' }, { tag: 'choir', name: 'Chor' }),
    ).toBe('Garten am Hang\nChor')
  })
})

// the group in the mail to the moderation (K5), named as everywhere in the admin
describe('supportTicketGroupName', () => {
  it('names a group by its name, one without a name by its tag, and no group as none', () => {
    expect(supportTicketGroupName({ tag: 'garden', name: 'Garten' })).toBe('Garten')
    expect(supportTicketGroupName({ tag: 'choir', name: null })).toBe('#choir')
    expect(supportTicketGroupName({ tag: 'choir', name: '' })).toBe('#choir')
    expect(supportTicketGroupName(null)).toBeNull()
  })
})

describe('supportTicketMailRecipients', () => {
  // the scopes as describeModeratorCreationGroups reads them
  const everything = { tags: [], seesAllCreationGroups: true, seesUntagged: true }
  const groups = (tags: string[], seesUntagged = false) => ({
    tags,
    seesAllCreationGroups: false,
    seesUntagged,
  })
  const moderator = (
    id: number,
    scope: Pick<SupportTicketMailCandidate, 'tags' | 'seesAllCreationGroups' | 'seesUntagged'>,
    handledGroups: HandledCreationGroups | null = null,
  ): SupportTicketMailCandidate => ({
    id,
    handlesSupportTickets: true,
    isAdmin: false,
    ...scope,
    handledGroups,
  })
  // an administrator's scope reads as everything, and counts for nothing here
  const admin = (
    id: number,
    handledGroups: HandledCreationGroups | null = null,
  ): SupportTicketMailCandidate => ({
    id,
    handlesSupportTickets: true,
    isAdmin: true,
    ...everything,
    handledGroups,
  })
  const ids = (recipients: SupportTicketMailCandidate[]) => recipients.map(({ id }) => id)

  // a request's group as the resolver hands it on: a scope names its tag, "Meine Gruppen" its number
  const NUMBER: Record<string, number> = { garden: 1, choir: 2, orchard: 3 }
  const inGroup = (tag: string) => ({ id: NUMBER[tag] ?? 9, tag })
  const ticked = (tags: string[], untagged = false): HandledCreationGroups => ({
    groupIds: tags.map((tag) => NUMBER[tag]),
    untagged,
    off: false,
  })
  const OFF: HandledCreationGroups = { groupIds: [], untagged: false, off: true }

  const garden = moderator(11, groups(['garden']))
  const untagged = moderator(12, groups([], true))
  const both = moderator(13, groups(['choir'], true))
  const all = moderator(14, everything)
  const peter = admin(1)
  const cast = [all, both, untagged, garden, peter]

  // a staircase (SUA-027): the next step only where the one before has nobody left
  it('mails, for a request of a group, those it is assigned to, and only them', () => {
    expect(ids(supportTicketMailRecipients(cast, inGroup('garden'), []))).toEqual([11])
    expect(ids(supportTicketMailRecipients(cast, inGroup('choir'), []))).toEqual([13])
  })

  it('mails, for a request without a group, those with "no group", and only them', () => {
    expect(ids(supportTicketMailRecipients(cast, null, []))).toEqual([12, 13])
  })

  it('mails those who see everything where the group has nobody, and only then', () => {
    expect(ids(supportTicketMailRecipients(cast, inGroup('orchard'), []))).toEqual([14])
    expect(ids(supportTicketMailRecipients([all, untagged, peter], inGroup('garden'), []))).toEqual(
      [14],
    )
    expect(ids(supportTicketMailRecipients([all, garden, both, peter], null, []))).toEqual([13])
  })

  it('mails nobody who does not find the request in their list', () => {
    // a moderator of "no group" sees no request of a group, a moderator of a group none without
    expect(ids(supportTicketMailRecipients([untagged, peter], inGroup('garden'), []))).toEqual([1])
    expect(ids(supportTicketMailRecipients([garden, peter], null, []))).toEqual([1])
    // a scope of no group and no "no group" reaches nothing, as the list's condition does
    expect(ids(supportTicketMailRecipients([moderator(15, groups([])), peter], null, []))).toEqual([
      1,
    ])
  })

  // MG5: of those who see everything only whose "Meine Gruppen" takes the request in -- its group is
  // ticked, or nothing is (Bernd, 22.11.2026)
  it('mails of those who see everything only whose ticks name the group, or who ticked nothing', () => {
    const gardener = moderator(21, everything, ticked(['garden']))
    const chorister = moderator(22, everything, ticked(['choir'], true))
    const unticked = moderator(23, everything)
    const some = [gardener, chorister, unticked, peter]
    expect(ids(supportTicketMailRecipients(some, inGroup('garden'), []))).toEqual([21, 23])
    expect(ids(supportTicketMailRecipients(some, inGroup('choir'), []))).toEqual([22, 23])
    expect(ids(supportTicketMailRecipients(some, inGroup('orchard'), []))).toEqual([23])
    expect(ids(supportTicketMailRecipients(some, null, []))).toEqual([22, 23])
  })

  it('asks the administrators by their ticks where no moderator took the request in', () => {
    const gardener = moderator(21, everything, ticked(['garden']))
    const choirAdmin = admin(2, ticked(['choir']))
    const orchardAdmin = admin(3, ticked(['orchard'], true))
    const some = [gardener, choirAdmin, orchardAdmin]
    expect(ids(supportTicketMailRecipients(some, inGroup('choir'), []))).toEqual([2])
    expect(ids(supportTicketMailRecipients(some, inGroup('orchard'), []))).toEqual([3])
    expect(ids(supportTicketMailRecipients(some, null, []))).toEqual([3])
    // a moderator before an administrator, also where both ticked it
    const both21 = moderator(21, everything, ticked(['choir']))
    expect(ids(supportTicketMailRecipients([both21, choirAdmin], inGroup('choir'), []))).toEqual([
      21,
    ])
    // who ticked nothing handles everything
    expect(
      ids(supportTicketMailRecipients([gardener, choirAdmin, peter], inGroup('choir'), [])),
    ).toEqual([1, 2])
  })

  // a request reaches somebody: ticked by nobody, it goes where it went without any tick
  it('mails as if nothing were ticked where nobody took the request in', () => {
    const gardener = moderator(21, everything, ticked(['garden']))
    const choirAdmin = admin(2, ticked(['choir']))
    expect(
      ids(supportTicketMailRecipients([gardener, choirAdmin], inGroup('orchard'), [])),
    ).toEqual([21])
    // without moderators the administrators, and not the one who switched the support off
    expect(
      ids(supportTicketMailRecipients([choirAdmin, admin(3, OFF)], inGroup('orchard'), [])),
    ).toEqual([2])
    expect(ids(supportTicketMailRecipients([choirAdmin, gardener], null, [21]))).toEqual([2])
  })

  it('asks nothing of the ticks where the group is assigned: the scope is their list', () => {
    const scoped = moderator(11, groups(['garden']), ticked(['choir']))
    expect(ids(supportTicketMailRecipients([scoped, peter], inGroup('garden'), []))).toEqual([11])
    expect(ids(supportTicketMailRecipients([scoped, peter], inGroup('choir'), []))).toEqual([1])
  })

  // an administrator who switched the support off hears nothing, the others do; where all of them
  // did, all hear all the same (Bernd, 22.11.2026)
  it('leaves out an administrator who switched the support off', () => {
    const off = admin(2, OFF)
    expect(
      ids(supportTicketMailRecipients([off, peter, admin(3)], inGroup('orchard'), [])),
    ).toEqual([1, 3])
    // off, the ticks behind it count not
    expect(
      ids(
        supportTicketMailRecipients(
          [admin(2, { ...ticked(['orchard']), off: true }), peter],
          inGroup('orchard'),
          [],
        ),
      ),
    ).toEqual([1])
    // the steps before the administrators are mailed as ever
    expect(ids(supportTicketMailRecipients([off, peter, all], inGroup('orchard'), []))).toEqual([
      14,
    ])
  })

  it('mails every administrator where all of them switched the support off', () => {
    const off = admin(2, OFF)
    const offToo = admin(3, OFF)
    expect(ids(supportTicketMailRecipients([off, offToo], inGroup('orchard'), []))).toEqual([2, 3])
    // the asking member not among them, as always -- also where they are the one who is on
    expect(ids(supportTicketMailRecipients([off, offToo], inGroup('orchard'), [2]))).toEqual([3])
    expect(ids(supportTicketMailRecipients([off, peter], inGroup('orchard'), [peter.id]))).toEqual([
      2,
    ])
  })

  it('compares the tags without case and accents, as the list does in SQL', () => {
    const cafe = moderator(16, groups(['Café']))
    expect(ids(supportTicketMailRecipients([cafe], inGroup('cafe'), []))).toEqual([16])
    expect(ids(supportTicketMailRecipients([cafe], inGroup('CAFE'), []))).toEqual([16])
    expect(ids(supportTicketMailRecipients([cafe], inGroup('cafes'), []))).toEqual([])
  })

  it('mails the administrators only where no moderator is left, whatever their scope', () => {
    expect(ids(supportTicketMailRecipients([peter, admin(2)], inGroup('garden'), []))).toEqual([
      1, 2,
    ])
    expect(ids(supportTicketMailRecipients([peter, garden], inGroup('garden'), []))).toEqual([11])
    expect(ids(supportTicketMailRecipients([peter, all], inGroup('garden'), []))).toEqual([14])
  })

  it('never mails the asking member, nor who handed on -- and then looks who is left', () => {
    // the group's only moderator asks: the next step, those who see everything
    expect(ids(supportTicketMailRecipients(cast, inGroup('garden'), [11]))).toEqual([14])
    expect(ids(supportTicketMailRecipients(cast, inGroup('garden'), [11, 14]))).toEqual([1])
    // the only moderator of the group asks, and nobody sees everything: the administrators hear
    expect(ids(supportTicketMailRecipients([garden, peter], inGroup('garden'), [11]))).toEqual([1])
    expect(ids(supportTicketMailRecipients([garden, peter], inGroup('garden'), [11, 1]))).toEqual(
      [],
    )
  })

  it('mails nobody whose role may not handle requests', () => {
    const notAllowed = { ...all, id: 17, handlesSupportTickets: false }
    expect(ids(supportTicketMailRecipients([notAllowed, peter], inGroup('garden'), []))).toEqual([
      1,
    ])
    expect(
      ids(supportTicketMailRecipients([{ ...peter, handlesSupportTickets: false }], null, [])),
    ).toEqual([])
  })

  it('mails at most twenty of a step, each by number', () => {
    const assigned = Array.from({ length: 30 }, (_, i) => moderator(200 - i, groups(['garden'])))
    const many = Array.from({ length: 30 }, (_, i) => moderator(100 + i, everything))
    const chosen = ids(supportTicketMailRecipients([...many, ...assigned], inGroup('garden'), []))
    expect(chosen).toEqual(
      Array.from({ length: SUPPORT_TICKET_MAIL_RECIPIENTS_MAX }, (_, i) => 171 + i),
    )
    // the next step also counts only up to twenty
    expect(ids(supportTicketMailRecipients(many, inGroup('garden'), []))).toEqual(
      Array.from({ length: SUPPORT_TICKET_MAIL_RECIPIENTS_MAX }, (_, i) => 100 + i),
    )
  })
})

describe('supportTicketMailsAllowed', () => {
  const HOUR = 60 * 60 * 1000
  const NOW = Date.parse('2026-11-14T12:00:00.000Z')

  it('lets a request start mails while fewer than twenty did in the hour before', () => {
    const before = Array.from({ length: SUPPORT_TICKET_MAILED_PER_HOUR_MAX - 1 }, (_, i) => NOW - i)
    expect(supportTicketMailsAllowed(before, NOW)).toEqual({
      allowed: true,
      mailedAt: [...before, NOW],
    })
  })

  it('lets no twenty-first start mails within the hour, and keeps the moments as they are', () => {
    const before = Array.from({ length: SUPPORT_TICKET_MAILED_PER_HOUR_MAX }, (_, i) => NOW - i)
    expect(supportTicketMailsAllowed(before, NOW)).toEqual({ allowed: false, mailedAt: before })
  })

  it('counts nothing older than an hour', () => {
    const before = Array.from({ length: SUPPORT_TICKET_MAILED_PER_HOUR_MAX }, () => NOW - HOUR)
    expect(supportTicketMailsAllowed(before, NOW)).toEqual({ allowed: true, mailedAt: [NOW] })
    const justInside = [...before.slice(1), NOW - HOUR + 1]
    expect(supportTicketMailsAllowed(justInside, NOW).mailedAt).toEqual([NOW - HOUR + 1, NOW])
  })
})
