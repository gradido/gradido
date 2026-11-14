// AI-GENERATED — not an architecture reference
import { supportTicketsWindowStart } from './SupportTicket.logic'

describe('supportTicketsWindowStart', () => {
  it('is 24 hours before the moment', () => {
    expect(supportTicketsWindowStart(new Date('2026-11-14T12:00:00.000Z'))).toEqual(
      new Date('2026-11-13T12:00:00.000Z'),
    )
  })
})
