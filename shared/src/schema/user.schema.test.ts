import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { aliasSchema, firstNameSchema, passwordSchema } from './user.schema'

describe('validate alias', () => {
  describe('alias contains invalid characters', () => {
    it('throws and logs an error', () => {
      expect(() => v.parse(aliasSchema, 'Bibi.Bloxberg')).toThrowError(
        'Invalid characters in alias',
      )
    })
  })

  describe('alias is a reserved word', () => {
    it('throws and logs an error', () => {
      expect(() => v.parse(aliasSchema, 'admin')).toThrowError('Given alias is not allowed')
    })
  })

  describe('alias length', () => {
    it('2 characters is not ok', () => {
      expect(() => v.parse(aliasSchema, 'Bi')).toThrowError()
    })
    it('3 characters is ok', () => {
      expect(() => v.parse(aliasSchema, 'Bib')).not.toThrowError()
    })
    it('20 characters is ok', () => {
      expect(() => v.parse(aliasSchema, 'BibiBloxbergMondLich')).not.toThrowError()
    })
    it('21 characters is not ok', () => {
      expect(() => v.parse(aliasSchema, 'BibiBloxbergZauberwald')).toThrowError()
    })
  })

  describe('alias is a reserved word with uppercase characters', () => {
    it('throws and logs an error', () => {
      expect(() => v.parse(aliasSchema, 'Admin')).toThrowError('Given alias is not allowed')
    })
  })

  describe('hyphens and underscore', () => {
    describe('alias starts with underscore', () => {
      it('throws and logs an error', () => {
        expect(() => v.parse(aliasSchema, '_bibi')).toThrowError('Invalid characters in alias')
      })
    })

    describe('alias contains two following hyphens', () => {
      it('throws and logs an error', () => {
        expect(() => v.parse(aliasSchema, 'bi--bi')).toThrowError('Invalid characters in alias')
      })
    })
  })
})

describe('validate first name', () => {
  describe('first name contains invalid characters', () => {
    // TODO: the character check is off until it is decided whether and how names are restricted
    it.skip('throws and logs an error', () => {
      expect(() => v.parse(firstNameSchema, '<script>//malicious code</script>')).toThrowError(
        'Invalid characters in first name',
      )
    })
  })
  it('use greek symbols', () => {
    expect(() => v.parse(firstNameSchema, 'Αλέξανδρος')).not.toThrowError()
  })
  it('use korean symbols', () => {
    expect(() => v.parse(firstNameSchema, '김민수')).not.toThrowError()
  })
  // TODO: use min length depending of language, because in asiatic languages first and/or last names can have only one character
  it.skip('use japanese symbols', () => {
    expect(() => v.parse(firstNameSchema, '田中')).not.toThrowError()
  })
  // TODO: fix this
  it.skip('use chinese symbols', () => {
    expect(() => v.parse(firstNameSchema, '张三')).not.toThrowError()
  })
})

describe('passwordSchema', () => {
  it('takes eight characters with a lower and an upper case letter, a digit and another character', () => {
    expect(v.safeParse(passwordSchema, 'Aa1!aaaa').success).toBe(true)
    expect(v.safeParse(passwordSchema, 'Aa12345_').success).toBe(true)
  })

  it('refuses a password that misses one of them, with the message the form knows', () => {
    for (const weak of ['Aa1!aaa', 'aa1!aaaa', 'AA1!AAAA', 'Aa!aaaaa', 'Aa1aaaaa']) {
      const result = v.safeParse(passwordSchema, weak)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.issues[0].message).toBe(
          'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character, and no spaces!',
        )
      }
    }
  })

  it('refuses whitespace, even where the rest would do', () => {
    for (const whitespace of [' ', '\t', '\n', '\r']) {
      expect(v.safeParse(passwordSchema, `Aa1!aaa${whitespace}`).success).toBe(false)
    }
  })

  it('counts a backslash as the special character', () => {
    expect(v.safeParse(passwordSchema, 'Aa1\\aaaa').success).toBe(true)
  })
})
