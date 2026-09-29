import { describe, expect, it } from 'bun:test'
import { aliasSchema, firstNameSchema, passwordSchema } from './user.schema'

describe('validate alias', () => {
  describe('alias contains invalid characters', () => {
    it('throws and logs an error', () => {
      expect(() => aliasSchema.parse('Bibi.Bloxberg')).toThrowError(
        expect.objectContaining(
          expect.arrayContaining([
            expect.objectContaining({
              origin: 'string',
              code: 'invalid_format',
              format: 'regex',
              message: 'Invalid characters in alias',
              path: [],
            }),
          ]),
        ),
      )
    })
  })

  describe('alias is a reserved word', () => {
    it('throws and logs an error', () => {
      expect(() => aliasSchema.parse('admin')).toThrowError(
        expect.objectContaining(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'custom',
              message: 'Given alias is not allowed',
              path: [],
            }),
          ]),
        ),
      )
    })
  })

  describe('alias length', () => {
    it('2 characters is not ok', () => {
      expect(() => aliasSchema.parse('Bi')).toThrowError()
    })
    it('3 characters is ok', () => {
      expect(() => aliasSchema.parse('Bib')).not.toThrowError()
    })
    it('20 characters is ok', () => {
      expect(() => aliasSchema.parse('BibiBloxbergMondLich')).not.toThrowError()
    })
    it('21 characters is not ok', () => {
      expect(() => aliasSchema.parse('BibiBloxbergZauberwald')).toThrowError()
    })
  })

  describe('alias is a reserved word with uppercase characters', () => {
    it('throws and logs an error', () => {
      expect(() => aliasSchema.parse('Admin')).toThrowError(
        expect.objectContaining(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'custom',
              message: 'Given alias is not allowed',
              path: [],
            }),
          ]),
        ),
      )
    })
  })

  describe('hyphens and underscore', () => {
    describe('alias starts with underscore', () => {
      it('throws and logs an error', () => {
        expect(() => aliasSchema.parse('_bibi')).toThrowError(
          expect.objectContaining(
            expect.arrayContaining([
              expect.objectContaining({
                origin: 'string',
                code: 'invalid_format',
                format: 'regex',
                message: 'Invalid characters in alias',
                path: [],
              }),
            ]),
          ),
        )
      })
    })

    describe('alias contains two following hyphens', () => {
      it('throws and logs an error', () => {
        expect(() => aliasSchema.parse('bi--bi')).toThrowError(
          expect.objectContaining(
            expect.arrayContaining([
              expect.objectContaining({
                origin: 'string',
                code: 'invalid_format',
                format: 'regex',
                message: 'Invalid characters in alias',
                path: [],
              }),
            ]),
          ),
        )
      })
    })
  })
})

describe('validate first name', () => {
  describe('first name contains invalid characters', () => {
    // TODO: the character check is off until it is decided whether and how names are restricted
    it.skip('throws and logs an error', () => {
      expect(() => firstNameSchema.parse('<script>//malicious code</script>')).toThrowError(
        expect.objectContaining(
          expect.arrayContaining([
            expect.objectContaining({
              origin: 'string',
              code: 'invalid_format',
              format: 'regex',
              message: 'Invalid characters in first name',
              path: [],
            }),
          ]),
        ),
      )
    })
  })
  it('use greek symbols', () => {
    expect(() => firstNameSchema.parse('Αλέξανδρος')).not.toThrowError()
  })
  it('use korean symbols', () => {
    expect(() => firstNameSchema.parse('김민수')).not.toThrowError()
  })
  // TODO: use min length depending of language, because in asiatic languages first and/or last names can have only one character
  it.skip('use japanese symbols', () => {
    expect(() => firstNameSchema.parse('田中')).not.toThrowError()
  })
  // TODO: fix this
  it.skip('use chinese symbols', () => {
    expect(() => firstNameSchema.parse('张三')).not.toThrowError()
  })
})

describe('passwordSchema', () => {
  it('takes eight characters with a lower and an upper case letter, a digit and another character', () => {
    expect(passwordSchema.safeParse('Aa1!aaaa').success).toBe(true)
    expect(passwordSchema.safeParse('Aa12345_').success).toBe(true)
  })

  it('refuses a password that misses one of them, with the message the form knows', () => {
    for (const weak of ['Aa1!aaa', 'aa1!aaaa', 'AA1!AAAA', 'Aa!aaaaa', 'Aa1aaaaa']) {
      const result = passwordSchema.safeParse(weak)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
        )
      }
    }
  })

  it('refuses whitespace, even where the rest would do', () => {
    for (const whitespace of [' ', '\t', '\n', '\r']) {
      expect(passwordSchema.safeParse(`Aa1!aaa${whitespace}`).success).toBe(false)
    }
  })

  it('counts a backslash as the special character', () => {
    expect(passwordSchema.safeParse('Aa1\\aaaa').success).toBe(true)
  })
})
