// AI-GENERATED — not an architecture reference

import { parseOrThrowFirstIssue } from 'shared'
import * as v from 'valibot'
import {
  createUserSchema,
  guarantorRegistrationSchema,
  projectRegistrationSchema,
  redeemRegistrationSchema,
  referrerRegistrationSchema,
} from './createUser.schema'

const valid = {
  email: 'Bernd@Example.com',
  firstName: 'Bernd',
  lastName: 'Hückstädt',
  language: 'de',
}

describe('createUserSchema', () => {
  it('lowercases the address', () => {
    expect(v.parse(createUserSchema, valid).email).toBe('bernd@example.com')
  })

  // Only the lengths are checked for now; the character check is off (see firstNameSchema).
  it('takes names of any characters, within their lengths', () => {
    for (const [firstName, lastName] of [
      ['Guest1', 'Hans@Home'],
      ['M. J.', "O'Brien "],
      ['김민수', '王李'],
    ]) {
      expect(v.safeParse(createUserSchema, { ...valid, firstName, lastName }).success).toBe(true)
    }
    for (const names of [{ firstName: 'Al' }, { lastName: '王' }, { firstName: 'a'.repeat(256) }]) {
      expect(v.safeParse(createUserSchema, { ...valid, ...names }).success).toBe(false)
    }
  })

  it('falls back to the default language instead of refusing an unknown one', () => {
    expect(v.parse(createUserSchema, { ...valid, language: 'xx' }).language).toBe('de')
  })

  it('needs no password - only a guarantor code or a redeem link that vouches brings one', () => {
    expect(v.safeParse(createUserSchema, valid).success).toBe(true)
  })

  // Refused here, before a variant is chosen: with a redeem code a weak password is the same
  // input error as everywhere - not a reason for the way through the mail.
  it('refuses a weak password with a redeem code like any other', () => {
    const result = v.safeParse(createUserSchema, {
      ...valid,
      redeemCode: 'abc123',
      password: 'short',
    })
    expect(result.success).toBe(false)
    expect(
      v.safeParse(createUserSchema, { ...valid, redeemCode: 'abc123', password: 'Aa1!aaaa' })
        .success,
    ).toBe(true)
  })

  it('refuses a weak password with the message the frontend knows', () => {
    const result = v.safeParse(createUserSchema, { ...valid, password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].message).toBe(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
      )
    }
  })

  it('accepts a guarantor code only in its shape', () => {
    expect(
      v.safeParse(createUserSchema, {
        ...valid,
        guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrSt_-',
      }).success,
    ).toBe(true)
    expect(v.safeParse(createUserSchema, { ...valid, guarantorCode: 'nonsense' }).success).toBe(
      false,
    )
  })

  // vue-router hands an absent optional route parameter over as '' (/register/:code?), and an
  // older wallet keeps sending it: an empty field is one that was not given.
  it('takes an empty optional field as not given', () => {
    for (const empty of ['', '  ']) {
      const parsed = v.parse(createUserSchema, {
        ...valid,
        alias: empty,
        redeemCode: empty,
        project: empty,
        referrerAlias: empty,
        guarantorCode: empty,
      })
      expect(parsed).toMatchObject({
        alias: null,
        redeemCode: null,
        project: null,
        referrerAlias: null,
        guarantorCode: null,
      })
    }
  })

  it('keeps what an optional field brings, and still checks it', () => {
    expect(v.parse(createUserSchema, { ...valid, redeemCode: 'CL-abc' }).redeemCode).toBe('CL-abc')
    expect(v.safeParse(createUserSchema, { ...valid, referrerAlias: 'a b' }).success).toBe(false)
  })
})

// The entry an event link offered (Event-Matching). What is noted here is made an entry once the
// address is confirmed, so it is held to an entry's own bounds.
describe('the entry of an event link', () => {
  const entry = { summary: 'Kongress Frequency Healing', details: null, remote: true }
  const parsed = (eventMatchingEntry: unknown) =>
    v.parse(createUserSchema, { ...valid, eventMatchingEntry }).eventMatchingEntry
  const taken = (eventMatchingEntry: unknown) =>
    v.safeParse(createUserSchema, { ...valid, eventMatchingEntry }).success

  it('is not needed: a registration without one is the registration it was', () => {
    expect(v.parse(createUserSchema, valid).eventMatchingEntry).toBeUndefined()
    expect(parsed(null)).toBeNull()
    expect(parsed(undefined)).toBeUndefined()
  })

  it('takes the sentence, the details and the reach as they come', () => {
    expect(
      parsed({ summary: 'Kongress Frequency Healing', details: 'Selbstheilung', remote: false }),
    ).toEqual({ summary: 'Kongress Frequency Healing', details: 'Selbstheilung', remote: false })
    expect(parsed(entry)).toEqual(entry)
  })

  it('trims the sentence and the details', () => {
    expect(
      parsed({ summary: '  Kongress X \n', details: '\n Zwei Zeilen\ndazu  ', remote: true }),
    ).toEqual({ summary: 'Kongress X', details: 'Zwei Zeilen\ndazu', remote: true })
  })

  it('takes details that are left out or blank as none', () => {
    expect(parsed({ summary: 'Kongress X', remote: true })?.details).toBeUndefined()
    for (const details of ['', '   ', '\n\t']) {
      expect(parsed({ ...entry, details })?.details).toBeNull()
    }
  })

  it('refuses an entry without a sentence', () => {
    for (const summary of ['', '   ', '\n', undefined, null, 7]) {
      expect(taken({ ...entry, summary })).toBe(false)
    }
  })

  // The wallet cuts the words of the link before it sends them: longer ones come from another
  // client, and are refused rather than cut.
  it('holds the sentence to 160 characters and the details to 2000, counted after trimming', () => {
    expect(taken({ ...entry, summary: 'x'.repeat(160) })).toBe(true)
    expect(taken({ ...entry, summary: `  ${'x'.repeat(160)}  ` })).toBe(true)
    expect(taken({ ...entry, summary: 'x'.repeat(161) })).toBe(false)
    expect(taken({ ...entry, details: 'x'.repeat(2000) })).toBe(true)
    expect(taken({ ...entry, details: ` ${'x'.repeat(2000)} ` })).toBe(true)
    expect(taken({ ...entry, details: 'x'.repeat(2001) })).toBe(false)
  })

  // GraphQL has refused these before the schema is asked; a caller that is not GraphQL has not.
  it('takes the reach only as true or false', () => {
    for (const remote of [undefined, null, 'true', '0', 1, 0]) {
      expect(taken({ ...entry, remote })).toBe(false)
    }
  })

  it('keeps markup as the text it is: nothing is stripped, nothing escaped', () => {
    const summary = '<b>Kongress</b> "X" & <script>alert(1)</script>'
    expect(parsed({ ...entry, summary })?.summary).toBe(summary)
  })

  // Each variant parses what the registration brought once more, with its own schema.
  it('comes through the schema of every variant, and through a second parse unchanged', () => {
    const once = v.parse(createUserSchema, {
      ...valid,
      eventMatchingEntry: { summary: ' Kongress X ', details: ' ', remote: false },
    })
    const expected = { summary: 'Kongress X', details: null, remote: false }
    expect(once.eventMatchingEntry).toEqual(expected)
    expect(v.parse(createUserSchema, once).eventMatchingEntry).toEqual(expected)
    expect(
      v.parse(projectRegistrationSchema, { ...once, project: 'garden' }).eventMatchingEntry,
    ).toEqual(expected)
    expect(
      v.parse(redeemRegistrationSchema, { ...once, redeemCode: 'CL-abc' }).eventMatchingEntry,
    ).toEqual(expected)
    expect(
      v.parse(referrerRegistrationSchema, { ...once, referrerAlias: 'PeterL' }).eventMatchingEntry,
    ).toEqual(expected)
    expect(
      v.parse(guarantorRegistrationSchema, {
        ...once,
        guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrStUv',
        password: 'Aa1!aaaa',
      }).eventMatchingEntry,
    ).toEqual(expected)
  })
})

describe('the schemas of the variants', () => {
  const code = '1700000000.AbCdEfGhIjKlMnOpQrStUv'

  // The guarantor code opens an account with a password: without one the registration is refused,
  // with a message that says why, not a bare type error.
  it('refuses a guarantor code without a password, and says why', () => {
    for (const password of [undefined, null]) {
      expect(() =>
        parseOrThrowFirstIssue(guarantorRegistrationSchema, {
          ...valid,
          guarantorCode: code,
          password,
        }),
      ).toThrow('Guarantor code requires a password')
    }
  })

  it('refuses a weak password with a guarantor code the same way as without one', () => {
    expect(() =>
      parseOrThrowFirstIssue(guarantorRegistrationSchema, {
        ...valid,
        guarantorCode: code,
        password: 'weak',
      }),
    ).toThrow(/^Please enter a valid password/)
  })

  it('hands on what it parsed, with the fields of the variant filled', () => {
    const registration = parseOrThrowFirstIssue(guarantorRegistrationSchema, {
      ...valid,
      guarantorCode: code,
      password: 'Aa1!aaaa',
    })
    expect(registration).toEqual(
      expect.objectContaining({
        email: 'bernd@example.com',
        guarantorCode: code,
        password: 'Aa1!aaaa',
      }),
    )
  })

  it('needs the field a variant lives on', () => {
    expect(() => parseOrThrowFirstIssue(referrerRegistrationSchema, valid)).toThrow()
  })
})
