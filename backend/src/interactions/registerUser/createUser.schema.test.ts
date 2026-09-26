// AI-GENERATED — not an architecture reference
import { createUserSchema } from './createUser.schema'

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

  it('falls back to the default language instead of refusing an unknown one', () => {
    expect(createUserSchema.parse({ ...valid, language: 'xx' }).language).toBe('de')
  })

  it('needs no password - only the table code brings one', () => {
    expect(createUserSchema.safeParse(valid).success).toBe(true)
  })

  it('refuses a weak password with the message the frontend knows', () => {
    const result = createUserSchema.safeParse({ ...valid, password: 'short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please enter a valid password with at least 8 characters, upper and lower case letters, at least one number and one special character!',
      )
    }
  })

  it('accepts a presence code only in its shape', () => {
    expect(
      createUserSchema.safeParse({ ...valid, presenceCode: '1700000000.abc_-9' }).success,
    ).toBe(true)
    expect(createUserSchema.safeParse({ ...valid, presenceCode: 'nonsense' }).success).toBe(false)
  })
})
