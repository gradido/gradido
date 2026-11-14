// AI-GENERATED — not an architecture reference
import { closingOf, supportTicketsWindowStart } from './SupportTicket.logic'

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
