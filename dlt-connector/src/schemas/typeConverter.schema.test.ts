// only for IDE, bun don't need this to work
import { describe, expect, it } from 'bun:test'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Static, TypeBoxFromValibot } from '@sinclair/typemap'
import { AddressType_COMMUNITY_AUF } from 'gradido-blockchain-js'
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
    const confirmedTransaction = v.parse(
      confirmedTransactionSchema,
      'CAcS5AEKZgpkCiCBZwMplGmI7fRR9MQkaR2Dz1qQQ5BCiC1btyJD71Ue9BJABODQ9sS70th9yHn8X3K+SNv2gsiIdX/V09baCvQCb+yEj2Dd/fzShIYqf3pooIMwJ01BkDJdNGBZs5MDzEAkChJ6ChkIAhIVRGFua2UgZnVlciBkZWluIFNlaW4hEggIgMy5/wUQABoDMy41IAAyTAooCiDbDtYSWhTwMKvtG/yDHgohjPn6v87n7NWBwMDniPAXxxCUmD0aABIgJE0o18xb6P6PsNjh0bkN52AzhggteTzoh09jV+blMq0aCAjC8rn/BRAAIgMzLjUqICiljeEjGHifWe4VNzoe+DN9oOLNZvJmv3VlkP+1RH7MMiAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADomCiDbDtYSWhTwMKvtG/yDHgohjPn6v87n7NWBwMDniPAXxxDAhD06JwogJE0o18xb6P6PsNjh0bkN52AzhggteTzoh09jV+blMq0Q65SlBA==',
    )
    expect(confirmedTransaction.getId()).toBe(7)
    expect(confirmedTransaction.getConfirmedAt().getSeconds()).toBe(1609464130)
  })
})
