// AI-GENERATED — not an architecture reference
import { parseOrThrowFirstIssue } from 'shared'
import {
  createUserSchema,
  guarantorRegistrationSchema,
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
    expect(createUserSchema.parse(valid).email).toBe('bernd@example.com')
  })

  // Only the lengths are checked for now; the character check is off (see firstNameSchema).
  it('takes names of any characters, within their lengths', () => {
    for (const [firstName, lastName] of [
      ['Guest1', 'Hans@Home'],
      ['M. J.', "O'Brien "],
      ['김민수', '王李'],
    ]) {
      expect(createUserSchema.safeParse({ ...valid, firstName, lastName }).success).toBe(true)
    }
    for (const names of [{ firstName: 'Al' }, { lastName: '王' }, { firstName: 'a'.repeat(256) }]) {
      expect(createUserSchema.safeParse({ ...valid, ...names }).success).toBe(false)
    }
  })

  it('falls back to the default language instead of refusing an unknown one', () => {
    expect(createUserSchema.parse({ ...valid, language: 'xx' }).language).toBe('de')
  })

  it('needs no password - only the guarantor code brings one', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true)
  })

  it('refuses a weak password with the message the frontend knows', () => {
    const result = createUserSchema.safeParse({ ...valid, password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
      )
    }
  })

  it('accepts a guarantor code only in its shape', () => {
    expect(
      createUserSchema.safeParse({ ...valid, guarantorCode: '1700000000.AbCdEfGhIjKlMnOpQrSt_-' })
        .success,
    ).toBe(true)
    expect(createUserSchema.safeParse({ ...valid, guarantorCode: 'nonsense' }).success).toBe(false)
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
