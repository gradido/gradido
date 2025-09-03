// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'
import { AddressType_COMMUNITY_AUF, AddressType_COMMUNITY_PROJECT } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { AccountType } from '../enum/AccountType'
import {
  accountTypeSchema,
  addressTypeSchema,
  confirmedTransactionSchema,
  dateSchema,
} from './typeConverter.schema'

describe('basic.schema', () => {
  describe('date', () => {
    it('from string', () => {
      const date = v.parse(dateSchema, '2021-01-01:10:10')
      expect(date.toISOString()).toBe('2021-01-01T10:10:00.000Z')
    })
    it('from Date', () => {
      const date = v.parse(dateSchema, new Date('2021-01-01'))
      expect(date.toISOString()).toBe('2021-01-01T00:00:00.000Z')
    })
    it('invalid date', () => {
      expect(() => v.parse(dateSchema, 'invalid date')).toThrow(new Error('invalid date'))
    })
  })

  describe('AddressType and AccountType', () => {
    it('AddressType from string', () => {
      const addressType = v.parse(addressTypeSchema, 'COMMUNITY_AUF')
      expect(addressType).toBe(AddressType_COMMUNITY_AUF)
    })
    it('AddressType from AddressType', () => {
      const addressType = v.parse(addressTypeSchema, AddressType_COMMUNITY_AUF)
      expect(addressType).toBe(AddressType_COMMUNITY_AUF)
    })
    it('AddressType from AccountType', () => {
      const accountType = v.parse(addressTypeSchema, AccountType.COMMUNITY_AUF)
      expect(accountType).toBe(AddressType_COMMUNITY_AUF)
    })
    it('AccountType from AccountType', () => {
      const accountType = v.parse(accountTypeSchema, AccountType.COMMUNITY_AUF)
      expect(accountType).toBe(AccountType.COMMUNITY_AUF)
    })
    it('AccountType from AddressType', () => {
      const accountType = v.parse(accountTypeSchema, AddressType_COMMUNITY_AUF)
      expect(accountType).toBe(AccountType.COMMUNITY_AUF)
    })
  })

  it('confirmedTransactionSchema', () => {
    const confirmedTransaction = v.parse(
      confirmedTransactionSchema,
      'CAcSAgoAGgYIwvK5/wUiAzMuNCogAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAyIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    )
    expect(confirmedTransaction.getId()).toBe(7)
    expect(confirmedTransaction.getConfirmedAt().getSeconds()).toBe(1609464130)
    expect(confirmedTransaction.getVersionNumber()).toBe('3.4')
  })
})
