// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import {
  amountSchema,
  emailFieldSchema,
  memoSchema,
  messageSchema,
  newPasswordSchema,
  subjectSchema,
  supportTicketTextSchema,
} from './Form.schema'

/** What the schema says to `typed`: its value where it fits, else the sentences. */
function read(schema: v.GenericSchema, typed: string) {
  const result = v.safeParse(schema, typed)
  return result.success ? result.output : result.issues.map((issue) => issue.message)
}
/** The first sentence, of a value that does not fit. */
function firstOf(schema: v.GenericSchema, typed: string) {
  return v.safeParse(schema, typed).issues?.[0].message
}

describe('amountSchema', () => {
  const amount = amountSchema(1000)

  it('gives the amount out as a number, a comma taken as a point', () => {
    expect(read(amount, '12,5')).toBe(12.5)
    expect(read(amount, '0.01')).toBe(0.01)
    expect(read(amount, '1000')).toBe(1000)
    expect(read(amount, ',5')).toBe(0.5)
    expect(read(amount, ' 5, ')).toBe(5)
    expect(read(amount, '0,07')).toBe(0.07)
    expect(read(amount, '1,50')).toBe(1.5)
  })

  it('takes digits only for a number', () => {
    const noNumber = [
      'The amount should be a number between 0.01 and 1000 with at most two digits after the decimal point.',
    ]
    for (const typed of ['much', '1e3', '0x10', '1.2.3', ',', '-']) {
      expect(read(amount, typed)).toEqual(noNumber)
    }
  })

  it('says what is wrong with it', () => {
    expect(firstOf(amount, '')).toBe('The Amount field is required')
    expect(firstOf(amount, '   ')).toBe('The Amount field is required')
    expect(read(amount, '0')).toEqual(['The amount should be at least 0.01 in size.'])
    expect(firstOf(amount, '0,001')).toBe('The amount should be at least 0.01 in size.')
    expect(read(amount, '-5')).toEqual(['The amount should be at least 0.01 in size.'])
    expect(read(amount, '1000,01')).toEqual(['The amount should not be larger than 1000.'])
    // too large and too exact: the bound is named first
    expect(firstOf(amount, '1000,019')).toBe('The amount should not be larger than 1000.')
    expect(read(amount, '1,234')).toEqual([
      'The amount should contain a maximum of two decimal places.',
    ])
  })

  it('speaks of hours where it is asked for hours', () => {
    expect(read(amountSchema(40, 'hours'), '41')).toEqual([
      'The hours should not be larger than 40.',
    ])
    expect(firstOf(amountSchema(40, 'hours'), '')).toBe('The Hours field is required')
  })
})

describe('the texts', () => {
  it('a memo has 5 to 512 characters', () => {
    expect(read(memoSchema, 'Danke')).toBe('Danke')
    expect(firstOf(memoSchema, '')).toBe('The message is required.')
    expect(read(memoSchema, 'Hi')).toEqual(['The message should be at least 5 characters long.'])
    expect(read(memoSchema, 'a'.repeat(513))).toEqual([
      'The message should not be longer than 512 characters.',
    ])
  })

  it('a message has 1 to 5000 characters', () => {
    expect(read(messageSchema, '👍')).toBe('👍')
    expect(firstOf(messageSchema, '')).toBe('The message is required.')
    expect(read(messageSchema, 'a'.repeat(5001))).toEqual([
      'The message should not be longer than 5000 characters.',
    ])
  })

  it('a support request is trimmed, and counted in characters as they are seen', () => {
    expect(read(supportTicketTextSchema, '  Hilfe!  ')).toBe('Hilfe!')
    expect(firstOf(supportTicketTextSchema, '   ')).toBe('The message is required.')
    // four emoji are eight UTF-16 units
    expect(read(supportTicketTextSchema, '👍👍👍👍')).toEqual([
      'The message should be at least 5 characters long.',
    ])
    expect(read(supportTicketTextSchema, '👍👍👍👍👍')).toBe('👍👍👍👍👍')
  })

  it('a subject has 5 to 100 characters', () => {
    expect(read(subjectSchema, 'Hilfe')).toBe('Hilfe')
    expect(firstOf(subjectSchema, '')).toBe('The subject is required.')
    expect(read(subjectSchema, 'a'.repeat(101))).toEqual([
      'The subject should not be longer than 100 characters.',
    ])
  })
})

describe('emailFieldSchema', () => {
  const email = emailFieldSchema('Email')

  it('gives the address out trimmed and in lower case', () => {
    expect(read(email, ' Bibi@Bloxberg.de ')).toBe('bibi@bloxberg.de')
  })

  it('names the field in its sentences', () => {
    expect(firstOf(email, '')).toBe('The Email field is required')
    expect(read(email, 'bibi')).toEqual(['The Email field must be a valid email'])
  })
})

describe('newPasswordSchema', () => {
  it('takes a password that keeps every rule', () => {
    expect(read(newPasswordSchema, 'Aa12345_')).toBe('Aa12345_')
  })

  it('names every rule a password breaks', () => {
    expect(read(newPasswordSchema, 'a b')).toEqual([
      'One uppercase letter required.',
      'One number required.',
      '8 characters minimum.',
      'One special character required (e.g. _ or ä)',
      'No white spaces and tabs',
    ])
  })
})
