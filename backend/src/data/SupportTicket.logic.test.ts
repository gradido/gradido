// AI-GENERATED — not an architecture reference
import {
  closingOf,
  moderatorMessageKind,
  supportAnswerMailDecision,
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
