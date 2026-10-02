import { describe, it, expect } from 'vitest'
import { amount, identifier, memo, message } from '@/validationSchemas'

// The frontend cannot import yet from the shared package, so these bounds are written
// out twice: here and in shared/src/const/index.ts. That makes them easy to widen
// on one side only, which is exactly what these tests are here to catch.
//
// A memo travels with a transaction. It is stored in a varchar(512) column and the
// dlt-connector validates it a second time against its own copy of the bounds, so
// widening it here would be accepted by the form and then fail further down.
// A message carries no amount and is stored in no varchar column, so it may be
// longer - and a short reply has to pass, which a memo minimum of 5 would reject.
const stringOfLength = (length) => 'x'.repeat(length)

describe('validationSchemas', () => {
  // One rule for the send form and for the thank-you greeting.
  describe('amount (what a member types, up to a maximum)', () => {
    const upTo100 = amount(100)

    it('takes a number between a cent and the maximum, with a comma or a point', () => {
      for (const typed of ['0.01', '0,01', '20', '12,5', '12.50', '100', 100, 0.01]) {
        expect(upTo100.isValidSync(typed), String(typed)).toBe(true)
      }
      expect(upTo100.cast('12,5')).toBe(12.5)
    })

    it('refuses nothing, zero, less than a cent, more than the maximum and what is no number', () => {
      for (const typed of ['', undefined, '0', '0,001', '100,01', '-5', 'zwanzig']) {
        expect(upTo100.isValidSync(typed), String(typed)).toBe(false)
      }
    })

    it('refuses more than two decimals', () => {
      expect(upTo100.isValidSync('1,234')).toBe(false)
      expect(upTo100.isValidSync('1,23')).toBe(true)
    })

    it('names the maximum it was given, in the message for too much', () => {
      expect(() => amount(97.37).validateSync('98')).toThrow(
        expect.objectContaining({
          message: { key: 'form.validation.amount.max', values: { max: 97.37 } },
        }),
      )
    })
  })

  describe('memo (travels with a transaction)', () => {
    it('accepts the longest memo the column can hold', () => {
      expect(memo.isValidSync(stringOfLength(512))).toBe(true)
    })

    it('rejects one character more than the column can hold', () => {
      expect(memo.isValidSync(stringOfLength(513))).toBe(false)
    })

    it('rejects a memo shorter than the dlt-connector accepts', () => {
      expect(memo.isValidSync(stringOfLength(4))).toBe(false)
    })

    it('accepts the shortest memo the dlt-connector accepts', () => {
      expect(memo.isValidSync(stringOfLength(5))).toBe(true)
    })
  })

  describe('message (person to person, no amount)', () => {
    it('accepts a message far longer than a memo may be', () => {
      expect(message.isValidSync(stringOfLength(2000))).toBe(true)
    })

    it('rejects a message beyond the agreed limit', () => {
      expect(message.isValidSync(stringOfLength(2001))).toBe(false)
    })

    it('accepts a short reply such as "Ja"', () => {
      expect(message.isValidSync('Ja')).toBe(true)
    })

    it('accepts a single character', () => {
      expect(message.isValidSync(stringOfLength(1))).toBe(true)
    })

    it('still requires something to be written', () => {
      expect(message.isValidSync('')).toBe(false)
    })
  })

  it('keeps the two apart - a message must not be validated as a memo', () => {
    const longerThanAMemo = stringOfLength(1000)
    expect(memo.isValidSync(longerThanAMemo)).toBe(false)
    expect(message.isValidSync(longerThanAMemo)).toBe(true)
  })

  // The shape is split off into utils/gradidoAddress and covered there; what these check
  // is that the field asks it, and which message comes back -- an unreadable shape and a
  // readable one with a bad user name are two different pieces of advice.
  describe('identifier (the recipient field)', () => {
    const messageFor = (value) => {
      try {
        identifier.validateSync(value)
        return null
      } catch (error) {
        return error.message
      }
    }

    it('accepts what it always accepted', () => {
      expect(messageFor('Bernd')).toBeNull()
      expect(messageFor('bernd@example.org')).toBeNull()
      expect(messageFor('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBeNull()
      expect(messageFor('Gradido Entwicklung/Bernd')).toBeNull()
    })

    it('accepts the line printed on the Gradido card', () => {
      expect(messageFor('ki-playground.gradido.net/u/Bernd')).toBeNull()
    })

    it('accepts the same line with the scheme the copy button adds', () => {
      expect(messageFor('https://ki-playground.gradido.net/u/Bernd')).toBeNull()
    })

    it('names the shape when it cannot read it, not the user name', () => {
      expect(messageFor('ki-playground.gradido.net/g/Wandergruppe')).toBe(
        'form.validation.identifier.formatError',
      )
      expect(messageFor('a/b/c/d')).toBe('form.validation.identifier.formatError')
    })

    it('names the user name when the shape was fine', () => {
      expect(messageFor('ki-playground.gradido.net/u/x')).toBe(
        'form.validation.identifier.typeError',
      )
      expect(messageFor('no')).toBe('form.validation.identifier.typeError')
    })

    it('still demands something', () => {
      expect(messageFor('')).toBe('form.validation.identifier.required')
    })
  })
})
