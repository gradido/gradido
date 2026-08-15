// AI-GENERATED — not an architecture reference
import { PublicContactRateLimit } from './PublicContactRateLimit'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const START = 1_700_000_000_000

describe('PublicContactRateLimit', () => {
  let limit: PublicContactRateLimit

  beforeEach(() => {
    limit = new PublicContactRateLimit()
  })

  it('lets the first three messages of an hour through', () => {
    expect(limit.allow('1.2.3.4', START)).toBe(true)
    expect(limit.allow('1.2.3.4', START)).toBe(true)
    expect(limit.allow('1.2.3.4', START)).toBe(true)
  })

  it('stops the fourth message within the hour', () => {
    for (let i = 0; i < 3; i++) {
      limit.allow('1.2.3.4', START)
    }
    expect(limit.allow('1.2.3.4', START)).toBe(false)
  })

  it('lets the same origin write again in the next hour', () => {
    for (let i = 0; i < 4; i++) {
      limit.allow('1.2.3.4', START)
    }
    expect(limit.allow('1.2.3.4', START + HOUR)).toBe(true)
  })

  it('holds one origin to ten messages a day, however patiently it waits', () => {
    let allowed = 0
    // one message an hour for a day - each on its own is well within the hourly bound
    for (let hour = 0; hour < 24; hour++) {
      if (limit.allow('1.2.3.4', START + hour * HOUR)) {
        allowed++
      }
    }
    expect(allowed).toBe(10)
  })

  it('starts the day over after a day', () => {
    for (let hour = 0; hour < 24; hour++) {
      limit.allow('1.2.3.4', START + hour * HOUR)
    }
    expect(limit.allow('1.2.3.4', START + DAY + HOUR)).toBe(true)
  })

  it('counts every origin for itself', () => {
    for (let i = 0; i < 4; i++) {
      limit.allow('1.2.3.4', START)
    }
    expect(limit.allow('5.6.7.8', START)).toBe(true)
  })
})
