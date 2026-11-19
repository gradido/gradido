// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it } from 'bun:test'
import { setLocale } from '@/i18n'
import { creationMonthShorts, creationMonths } from './CreationMonths.logic'

afterEach(() => setLocale('en'))

describe('creationMonthShorts', () => {
  it('names the two months before and this one, the oldest first', async () => {
    await setLocale('de')
    expect(creationMonthShorts(new Date(2026, 10, 9))).toEqual(['Sep', 'Okt', 'Nov'])
  })

  it('goes back over the turn of the year', () => {
    expect(creationMonthShorts(new Date(2026, 0, 31))).toEqual(['Nov', 'Dec', 'Jan'])
  })
})

describe('creationMonths', () => {
  it('tells the server the first of the months before, and today for this one', async () => {
    await setLocale('de')
    expect(creationMonths(new Date(2026, 10, 9, 15))).toEqual([
      { month: 'September', year: '2026', date: '9/1/2026' },
      { month: 'Oktober', year: '2026', date: '10/1/2026' },
      { month: 'November', year: '2026', date: '11/9/2026' },
    ])
  })
})
