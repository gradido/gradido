// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useCreationMonths } from './useCreationMonths'

vi.mock('@vue/apollo-composable', () => ({
  useQuery: () => ({ result: ref(null), error: ref(null) }),
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    // The short name of a month, as the admin's `monthShort` gives it in English (i18n.ts).
    d: (date, format) =>
      format === 'monthShort' ? date.toLocaleString('en', { month: 'short' }) : date.toISOString(),
  }),
}))

describe('useCreationMonths', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-23T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The months a member can still be credited for: the two before this one, and this one. The
  // card of a member on a phone names each amount of `creation` by one of them.
  it('names the three months of `creation` by their short names, the oldest first', () => {
    expect(useCreationMonths().creationMonthShorts()).toEqual(['Aug', 'Sep', 'Oct'])
  })

  it('heads the column of the member search with the same three, as before', () => {
    expect(useCreationMonths().creationLabel()).toBe('Aug | Sep | Oct')
  })

  it('reaches back into the year before in January', () => {
    vi.setSystemTime(new Date('2027-01-10T12:00:00.000Z'))
    expect(useCreationMonths().creationMonthShorts()).toEqual(['Nov', 'Dec', 'Jan'])
  })
})
