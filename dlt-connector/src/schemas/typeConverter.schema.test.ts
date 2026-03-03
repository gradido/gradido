// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Static, TypeBoxFromValibot } from '@sinclair/typemap'
import { AddressType_COMMUNITY_AUF, InMemoryBlockchainProvider } from 'gradido-blockchain-js'
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
    it('addressType with type box', () => {
      const AddressTypeSchema = TypeBoxFromValibot(addressTypeSchema)
      const check = TypeCompiler.Compile(AddressTypeSchema)
      expect(check.Check(AccountType.COMMUNITY_AUF)).toBe(true)
      // type box will throw an error, because it cannot handle valibots custom validation
      expect(() => check.Check(AddressType_COMMUNITY_AUF)).toThrow(
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
      expect(() => check.Check(AddressType_COMMUNITY_AUF)).toThrow(
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
    const confirmedTransaction = v.parse(
      confirmedTransactionSchema,
      {
        base64: 'CAcS4AEKZgpkCiCBZwMplGmI7fRR9MQkaR2Dz1qQQ5BCiC1btyJD71Ue9BJABODQ9sS70th9yHn8X3K+SNv2gsiIdX/V09baCvQCb+zo7nEQgCUXOEe/tN7YaRppwt6TDcXBPxkwnw4gfpCODhJ0ChkIAhIVRGFua2UgZnVlciBkZWluIFNlaW4hEgYIgMy5/wUaAzMuNTJKCiYKINsO1hJaFPAwq+0b/IMeCiGM+fq/zufs1YHAwOeI8BfHEJSYPRIgJE0o18xb6P6PsNjh0bkN52AzhggteTzoh09jV+blMq0aABoGCMLyuf8FIgMzLjcqIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMhUIAhoRCgkIqemnUhD+4wESBBj8sgc6Jgog2w7WEloU8DCr7Rv8gx4KIYz5+r/O5+zVgcDA54jwF8cQwIQ9OicKICRNKNfMW+j+j7DY4dG5DedgM4YILXk86IdPY1fm5TKtEOuUpQRAAg==',
        communityId,
      },
    )
    expect(confirmedTransaction.getId()).toBe(7)
    expect(confirmedTransaction.getConfirmedAt().getSeconds()).toBe(1609464130)
  })
})
