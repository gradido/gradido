// AI-GENERATED — not an architecture reference
import {
  CREATION_RIGHT_REQUEST_INTERVAL_HOURS,
  CreationRightRequestRefused,
  isCreationRightRequestTooSoon,
  nextCreationRightRequestAt,
  ProjectAccountRefused,
} from './ProjectAccount.logic'

describe('ProjectAccount.logic', () => {
  const lastRequestAt = new Date('2026-09-06T10:00:00.000Z')

  it('places the next allowed request one interval after the last one', () => {
    expect(nextCreationRightRequestAt(lastRequestAt).getTime()).toBe(
      lastRequestAt.getTime() + CREATION_RIGHT_REQUEST_INTERVAL_HOURS * 60 * 60 * 1000,
    )
  })

  it('is never too soon without an earlier request', () => {
    expect(isCreationRightRequestTooSoon(null)).toBe(false)
  })

  it('is too soon inside the interval, and free again from its end', () => {
    const justBefore = new Date(nextCreationRightRequestAt(lastRequestAt).getTime() - 60 * 1000)
    expect(isCreationRightRequestTooSoon(lastRequestAt, justBefore)).toBe(true)
    expect(
      isCreationRightRequestTooSoon(lastRequestAt, nextCreationRightRequestAt(lastRequestAt)),
    ).toBe(false)
  })

  it('hands the wallet codes, not sentences', () => {
    expect(new ProjectAccountRefused('OPEN_CONTRIBUTIONS').message).toBe(
      'PROJECT_ACCOUNT_REFUSED: OPEN_CONTRIBUTIONS',
    )
    expect(new CreationRightRequestRefused('RATE_LIMITED').message).toBe(
      'CREATION_RIGHT_REQUEST_REFUSED: RATE_LIMITED',
    )
  })
})
