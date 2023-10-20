import 'reflect-metadata'
import { Timestamp } from '@/data/proto/3_3/Timestamp'
import { accountTypeToAddressType, timestampToDate } from './typeConverter'
import { AccountType } from '@/graphql/enum/AccountType'
import { AddressType } from '@/data/proto/3_3/enum/AddressType'

describe('utils/typeConverter', () => {
  it('timestampToDate', () => {
    const now = new Date('Thu, 05 Oct 2023 11:55:18 +0000')
    const timestamp = new Timestamp(now)
    expect(timestamp.seconds).toBe(Math.round(now.getTime() / 1000))
    expect(timestampToDate(timestamp)).toEqual(now)
  })

  it('accountTypeToAddressType', () => {
    expect(accountTypeToAddressType(AccountType.COMMUNITY_HUMAN)).toBe(AddressType.COMMUNITY_HUMAN)
  })
})
