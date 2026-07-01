// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Static, TypeBoxFromValibot } from '@sinclair/typemap'
import { GRDT_ADDRESS_COMMUNITY_AUF, InMemoryBlockchainProvider } from 'gradido-blockchain-js'
import * as v from 'valibot'
import { AccountType } from '../data/AccountType.enum'
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
    it('with type box', () => {
      // Derive TypeBox Schema from the Valibot Schema
      const DateSchema = TypeBoxFromValibot(dateSchema)

      // Build the compiler
      const check = TypeCompiler.Compile(DateSchema)

      // Valid value (String)
      expect(check.Check('2021-01-01T10:10:00.000Z')).toBe(true)

      // typebox cannot use valibot custom validation and transformations, it will check only the input types
      expect(check.Check('invalid date')).toBe(true)

      // Type inference (TypeScript)
      type DateType = Static<typeof DateSchema>
      const _validDate: DateType = '2021-01-01T10:10:00.000Z'
      const _validDate2: DateType = new Date('2021-01-01')

      // @ts-expect-error
      const _invalidDate: DateType = 123 // should fail in TS
    })
  })

  describe('AddressType and AccountType', () => {
    it('AddressType from string', () => {
      const addressType = v.parse(addressTypeSchema, 'COMMUNITY_AUF')
      expect(addressType).toBe(GRDT_ADDRESS_COMMUNITY_AUF)
    })
    it('AddressType from AddressType', () => {
      const addressType = v.parse(addressTypeSchema, GRDT_ADDRESS_COMMUNITY_AUF)
      expect(addressType).toBe(GRDT_ADDRESS_COMMUNITY_AUF)
    })
    it('AddressType from AccountType', () => {
      const accountType = v.parse(addressTypeSchema, AccountType.COMMUNITY_AUF)
      expect(accountType).toBe(GRDT_ADDRESS_COMMUNITY_AUF)
    })
    it('AccountType from AccountType', () => {
      const accountType = v.parse(accountTypeSchema, AccountType.COMMUNITY_AUF)
      expect(accountType).toBe(AccountType.COMMUNITY_AUF)
    })
    it('AccountType from AddressType', () => {
      const accountType = v.parse(accountTypeSchema, GRDT_ADDRESS_COMMUNITY_AUF)
      expect(accountType).toBe(AccountType.COMMUNITY_AUF)
    })
    it('addressType with type box', () => {
      const AddressTypeSchema = TypeBoxFromValibot(addressTypeSchema)
      const check = TypeCompiler.Compile(AddressTypeSchema)
      expect(check.Check(AccountType.COMMUNITY_AUF)).toBe(true)
      // type box will throw an error, because it cannot handle valibots custom validation
      expect(() => check.Check(GRDT_ADDRESS_COMMUNITY_AUF)).toThrow(
        new TypeError(`undefined is not an object (evaluating 'schema["~run"]')`),
      )
      expect(() => check.Check('invalid')).toThrow(
        new TypeError(`undefined is not an object (evaluating 'schema["~run"]')`),
      )
    })
    it('accountType with type box', () => {
      const AccountTypeSchema = TypeBoxFromValibot(accountTypeSchema)
      const check = TypeCompiler.Compile(AccountTypeSchema)
      expect(check.Check(AccountType.COMMUNITY_AUF)).toBe(true)
      // type box will throw an error, because it cannot handle valibots custom validation
      expect(() => check.Check(GRDT_ADDRESS_COMMUNITY_AUF)).toThrow(
        new TypeError(`undefined is not an object (evaluating 'schema["~run"]')`),
      )
      expect(() => check.Check('invalid')).toThrow(
        new TypeError(`undefined is not an object (evaluating 'schema["~run"]')`),
      )
    })
  })

  it('confirmedTransactionSchema', () => {
    // create blockchain in native module
    const communityId = 'fcd48487-6d31-4f4c-be9b-b3c8ca853912'
    InMemoryBlockchainProvider.getInstance().getBlockchain(communityId)
    const confirmedTransaction = v.parse(confirmedTransactionSchema, {
      base64:
        'CAcS8AEKZgpkCiCq0SuoJrkRRFdVTExVf6OoeK+fIfgWIbDD5hYVBhEoKRJAU+r2GbfvP+qF97TTbVqHTnbX5iuoI4lB9ADs6d6UobxHN1nv9YxQIZ82Xu6lx5QM3SmoFHlw7+qsLOP1w9WbAhKFATJcCjgKIO/ykZNQpTrID4mAYrfGf/gCgkX0zETgjvIviFFxVU87EJSYPRoQAZ40fFQKc9KYhn/s4A1aLhIgfvV+405Mrl4BQDS3+AQ7pkDRom8H1iKsNC5krXW59g0KGQgCEhVEYW5rZSBmdWVyIGRlaW4gU2VpbiESBgiAzLn/BRiIgAwaBgjC8rn/BSCIgAwqIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMhUaEQoJCKnpp1IQ/uMBEgQY/LIHCAI6OAog7/KRk1ClOsgPiYBit8Z/+AKCRfTMROCO8i+IUXFVTzsQwIQ9GhABnjR8VApz0piGf+zgDVouOjkKIH71fuNOTK5eAUA0t/gEO6ZA0aJvB9YirDQuZK11ufYNEOuUpQQaEAGeNHxUCnPSmIZ/7OANWi5AAg==',
      communityId,
    })
    expect(confirmedTransaction.getId()).toBe(7)
    expect(confirmedTransaction.getConfirmedAt().getSeconds()).toBe(1609464130n)
  })
})
