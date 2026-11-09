// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { setLocale } from '@/i18n'
import { linkState } from './TransactionLink.logic'

beforeEach(() => setLocale('de'))
afterEach(() => setLocale('en'))

const link = {
  id: 1,
  amount: '50',
  memo: 'memo',
  createdAt: '2026-10-01T09:00:00.000Z',
  validUntil: '2026-10-15T09:00:00.000Z',
  redeemedAt: null,
  deletedAt: null,
}
const before = new Date('2026-10-10T00:00:00.000Z')

describe('linkState', () => {
  it('calls a link open until it expires', () => {
    expect(linkState(link, before)).toBe('offen')
    expect(linkState(link, new Date('2026-10-16T00:00:00.000Z'))).toBe('abgelaufen: 15.10.2026')
  })

  it('names a deletion before a redemption, and a redemption before the expiry', () => {
    const redeemed = { ...link, redeemedAt: '2026-10-03T09:00:00.000Z' }
    expect(linkState(redeemed, before)).toBe('eingelöst: 3.10.2026')
    expect(linkState({ ...redeemed, deletedAt: '2026-10-04T09:00:00.000Z' }, before)).toBe(
      'gelöscht: 4.10.2026',
    )
  })
})
