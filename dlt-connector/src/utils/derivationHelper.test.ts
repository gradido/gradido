import { Timestamp } from '../proto/3_3/Timestamp'
import { hardenDerivationIndex, HARDENED_KEY_BITMASK } from './derivationHelper'
import { timestampToDate } from './typeConverter'

describe('utils', () => {
  it('test bitmask for hardened keys', () => {
    const derivationIndex = hardenDerivationIndex(1)
    expect(derivationIndex).toBeGreaterThan(HARDENED_KEY_BITMASK)
  })
  it('test TimestampToDate', () => {
    const date = new Date('2011-04-17T12:01:10.109')
    expect(timestampToDate(new Timestamp(date))).toEqual(date)
  })
})
