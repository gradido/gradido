// AI-GENERATED — not an architecture reference
import {
  CONFIRMATION_GRACE_PERIOD_HOURS,
  confirmationDeadline,
  isConfirmationOverdue,
} from './EmailConfirmation.logic'

describe('EmailConfirmation.logic', () => {
  const createdAt = new Date('2026-08-25T10:00:00.000Z')

  it('places the deadline one grace period after account creation', () => {
    expect(confirmationDeadline(createdAt).getTime()).toBe(
      createdAt.getTime() + CONFIRMATION_GRACE_PERIOD_HOURS * 60 * 60 * 1000,
    )
  })

  it('is not overdue inside the grace period — the last minute included', () => {
    const justBefore = new Date(confirmationDeadline(createdAt).getTime() - 60 * 1000)
    expect(isConfirmationOverdue(createdAt, justBefore)).toBe(false)
    expect(isConfirmationOverdue(createdAt, confirmationDeadline(createdAt))).toBe(false)
  })

  it('is overdue one minute past the deadline', () => {
    const justAfter = new Date(confirmationDeadline(createdAt).getTime() + 60 * 1000)
    expect(isConfirmationOverdue(createdAt, justAfter)).toBe(true)
  })
})
