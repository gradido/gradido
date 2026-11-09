// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { contributionLinkFormOf } from './ContributionLink.schema'

const link = {
  id: 1,
  amount: '200',
  name: 'Welcome',
  memo: 'Memo',
  code: 'code1',
  link: 'http://localhost/redeem/CL-code1',
  createdAt: '2026-10-01T10:00:00.000Z',
  validFrom: '2026-10-01T00:00:00.000Z',
  validTo: null,
  maxAmountPerMonth: null,
  cycle: 'DAILY',
  maxPerCycle: 1,
}

describe('contributionLinkFormOf', () => {
  it('takes the days of the validity, as the date inputs want them', () => {
    expect(contributionLinkFormOf(link)).toEqual({
      name: 'Welcome',
      memo: 'Memo',
      amount: '200',
      validFrom: '2026-10-01',
      validTo: null,
      cycle: 'DAILY',
      maxPerCycle: 1,
    })
  })
})
