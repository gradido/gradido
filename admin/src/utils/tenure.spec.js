import { describe, it, expect } from 'vitest'
import { tenureBucket } from './tenure'

const now = new Date('2026-07-11T10:00:00')
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000)

describe('tenureBucket', () => {
  it('returns today for the same day', () => {
    expect(tenureBucket(now, now)).toEqual({ unit: 'today', count: 0 })
  })

  it('counts single days below a week', () => {
    expect(tenureBucket(daysAgo(1), now)).toEqual({ unit: 'days', count: 1 })
    expect(tenureBucket(daysAgo(6), now)).toEqual({ unit: 'days', count: 6 })
  })

  it('switches to weeks from seven days', () => {
    expect(tenureBucket(daysAgo(7), now)).toEqual({ unit: 'weeks', count: 1 })
    expect(tenureBucket(daysAgo(21), now)).toEqual({ unit: 'weeks', count: 3 })
  })

  it('counts full months', () => {
    const bucket = tenureBucket(new Date('2026-02-11T10:00:00'), now)
    expect(bucket).toEqual({ unit: 'months', count: 5 })
  })

  it('counts full years', () => {
    const bucket = tenureBucket(new Date('2024-03-15T10:00:00'), now)
    expect(bucket).toEqual({ unit: 'years', count: 2 })
  })

  it('returns null for a missing or invalid date', () => {
    expect(tenureBucket(null, now)).toBeNull()
    expect(tenureBucket('nonsense', now)).toBeNull()
  })
})
