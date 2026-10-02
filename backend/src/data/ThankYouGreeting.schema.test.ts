// AI-GENERATED — not an architecture reference
import { parseOrThrowFirstIssue } from 'shared'
import { thankYouGreetingSchema, transactionLinkGreetingSchema } from './ThankYouGreeting.schema'

const LINE = 'Einfach so — weil es Dich gibt.'
const WORDS = 'Liebe Sarah, mit Eurem iPad hat alles angefangen.\nEure Oma'

const messageOf = (schema: { safeParse: (value: unknown) => any }, value: unknown): string => {
  const result = schema.safeParse(value)
  if (result.success) {
    throw new Error('expected the schema to refuse this')
  }
  return result.error.issues[0].message
}

describe('thankYouGreetingSchema', () => {
  it('takes a motif alone', () => {
    expect(thankYouGreetingSchema.parse({ motif: 'bouquet' })).toEqual({ motif: 'bouquet' })
  })

  it('takes every one of the five motifs, with a line and a name', () => {
    for (const motif of [
      'heart-leaves',
      'giving-hands',
      'bouquet',
      'glowing-swirl',
      'morning-light',
    ]) {
      expect(thankYouGreetingSchema.parse({ motif, line: LINE, recipientName: 'Sarah' })).toEqual({
        motif,
        line: LINE,
        recipientName: 'Sarah',
      })
    }
  })

  it('refuses an unknown motif, a missing one and one in another spelling', () => {
    expect(messageOf(thankYouGreetingSchema, { motif: 'sunset' })).toBe(
      'Thank-you greeting: unknown motif',
    )
    expect(messageOf(thankYouGreetingSchema, { motif: 'Bouquet' })).toBe(
      'Thank-you greeting: unknown motif',
    )
    expect(thankYouGreetingSchema.safeParse({ motif: '' }).success).toBe(false)
    expect(thankYouGreetingSchema.safeParse({ line: LINE }).success).toBe(false)
    expect(thankYouGreetingSchema.safeParse({ motif: null, line: LINE }).success).toBe(false)
  })

  it('trims the line and the name', () => {
    expect(
      thankYouGreetingSchema.parse({
        motif: 'bouquet',
        line: `  ${LINE} \n`,
        recipientName: '\tSarah  ',
      }),
    ).toEqual({ motif: 'bouquet', line: LINE, recipientName: 'Sarah' })
  })

  it('takes an empty or blank line and name as not given', () => {
    expect(
      thankYouGreetingSchema.parse({ motif: 'bouquet', line: '', recipientName: '   ' }),
    ).toEqual({ motif: 'bouquet', line: null, recipientName: null })
    expect(
      thankYouGreetingSchema.parse({ motif: 'bouquet', line: ' \n ', recipientName: null }),
    ).toEqual({ motif: 'bouquet', line: null, recipientName: null })
  })

  it('takes a line of 80 characters and refuses one of 81', () => {
    expect(
      thankYouGreetingSchema.safeParse({ motif: 'bouquet', line: 'a'.repeat(80) }).success,
    ).toBe(true)
    expect(messageOf(thankYouGreetingSchema, { motif: 'bouquet', line: 'a'.repeat(81) })).toBe(
      'Thank-you greeting: the line is too long',
    )
    // The length is the trimmed one: what is stored.
    expect(
      thankYouGreetingSchema.safeParse({ motif: 'bouquet', line: `  ${'a'.repeat(80)}  ` }).success,
    ).toBe(true)
  })

  it('takes a name of 40 characters and refuses one of 41', () => {
    expect(
      thankYouGreetingSchema.safeParse({ motif: 'bouquet', recipientName: 'a'.repeat(40) }).success,
    ).toBe(true)
    expect(
      messageOf(thankYouGreetingSchema, { motif: 'bouquet', recipientName: 'a'.repeat(41) }),
    ).toBe('Thank-you greeting: the name is too long')
  })

  it('refuses a line or a name of more than one line, and one with a control character', () => {
    expect(messageOf(thankYouGreetingSchema, { motif: 'bouquet', line: 'Danke\nfür alles' })).toBe(
      'Thank-you greeting: the line has to be one line',
    )
    expect(messageOf(thankYouGreetingSchema, { motif: 'bouquet', line: 'Danke\tfür alles' })).toBe(
      'Thank-you greeting: the line has to be one line',
    )
    expect(
      messageOf(thankYouGreetingSchema, { motif: 'bouquet', recipientName: 'Sarah\nund Claude' }),
    ).toBe('Thank-you greeting: the name has to be one line')
    expect(
      messageOf(thankYouGreetingSchema, {
        motif: 'bouquet',
        recipientName: `Sarah${String.fromCharCode(0)}`,
      }),
    ).toBe('Thank-you greeting: the name has to be one line')
  })

  // A message goes into the error log and back to the client; the name must not ride along.
  it('never quotes what it refused', () => {
    const secret = 'Wintergrün'
    for (const value of [
      { motif: secret },
      { motif: 'bouquet', line: `${secret}\n${secret}` },
      { motif: 'bouquet', recipientName: secret.repeat(5) },
      { motif: 'bouquet', recipientName: `${secret}\t` + secret },
    ]) {
      expect(messageOf(thankYouGreetingSchema, value)).not.toContain(secret)
    }
  })
})

describe('transactionLinkGreetingSchema', () => {
  const greeting = { motif: 'morning-light', line: LINE, recipientName: 'Sarah' }

  it('takes a memo that is the line, one line break, and the words', () => {
    expect(
      parseOrThrowFirstIssue(transactionLinkGreetingSchema, {
        memo: `${LINE}\n${WORDS}`,
        greeting,
      }).greeting,
    ).toEqual(greeting)
  })

  it('takes a memo that is exactly the line', () => {
    expect(transactionLinkGreetingSchema.safeParse({ memo: LINE, greeting }).success).toBe(true)
  })

  it('refuses a memo that does not begin with the line', () => {
    expect(messageOf(transactionLinkGreetingSchema, { memo: WORDS, greeting })).toBe(
      'Thank-you greeting: the memo has to begin with the line',
    )
    expect(messageOf(transactionLinkGreetingSchema, { memo: `${WORDS}\n${LINE}`, greeting })).toBe(
      'Thank-you greeting: the memo has to begin with the line',
    )
    expect(() =>
      parseOrThrowFirstIssue(transactionLinkGreetingSchema, { memo: `${LINE} ${WORDS}`, greeting }),
    ).toThrow('Thank-you greeting: the memo has to begin with the line')
  })

  // The line is trimmed before it is held against the memo: the memo begins with what is
  // stored, not with what was typed around it.
  it('holds the memo against the trimmed line', () => {
    expect(
      transactionLinkGreetingSchema.safeParse({
        memo: `${LINE}\n${WORDS}`,
        greeting: { ...greeting, line: `  ${LINE}  ` },
      }).success,
    ).toBe(true)
    expect(
      transactionLinkGreetingSchema.safeParse({
        memo: `  ${LINE}  \n${WORDS}`,
        greeting: { ...greeting, line: `  ${LINE}  ` },
      }).success,
    ).toBe(false)
  })

  it('asks nothing of the memo where the greeting has no line', () => {
    for (const line of [undefined, null, '', '   ']) {
      expect(
        transactionLinkGreetingSchema.safeParse({
          memo: WORDS,
          greeting: { motif: 'bouquet', line },
        }).success,
      ).toBe(true)
    }
  })

  it('refuses the greeting itself first', () => {
    expect(
      messageOf(transactionLinkGreetingSchema, { memo: WORDS, greeting: { motif: 'sunset' } }),
    ).toBe('Thank-you greeting: unknown motif')
  })
})
