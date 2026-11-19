// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { timeAgo } from './RelativeTime.logic'

describe('timeAgo', () => {
  const now = new Date('2026-11-09T12:00:00Z')
  const before = (seconds: number) => new Date(now.getTime() - seconds * 1000)
  const DAY = 86400

  it('takes the largest unit that fits', () => {
    expect(timeAgo(before(59), now)).toEqual([-59, 'second'])
    expect(timeAgo(before(60), now)).toEqual([-1, 'minute'])
    expect(timeAgo(before(3599), now)).toEqual([-60, 'minute'])
    expect(timeAgo(before(3600), now)).toEqual([-1, 'hour'])
    expect(timeAgo(before(DAY - 1), now)).toEqual([-24, 'hour'])
    expect(timeAgo(before(DAY), now)).toEqual([-1, 'day'])
    expect(timeAgo(before(30 * DAY - 1), now)).toEqual([-30, 'day'])
    expect(timeAgo(before(30 * DAY), now)).toEqual([-1, 'month'])
    expect(timeAgo(before(365 * DAY - 1), now)).toEqual([-12, 'month'])
    expect(timeAgo(before(365 * DAY), now)).toEqual([-1, 'year'])
    expect(timeAgo(before(3 * 365 * DAY), now)).toEqual([-3, 'year'])
  })

  it('says at least a second, where the server clock runs ahead', () => {
    expect(timeAgo(now, now)).toEqual([-1, 'second'])
    expect(timeAgo(before(-30), now)).toEqual([-1, 'second'])
  })
})
