// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { fieldCheck, formMessage, projectBrandingFormSchema } from './ProjectBranding.schema'

const form = { name: 'Garden', alias: 'garden', newUserToSpace: true, logoUrl: '' }
const messageOf = (values: object) => {
  const result = v.safeParse(projectBrandingFormSchema, { ...form, ...values })
  return result.success ? undefined : formMessage(result.issues)
}

describe('fieldCheck', () => {
  it('names the field "this", as yup did for a field on its own', () => {
    expect(fieldCheck('name', 'ab')).toEqual({
      valid: false,
      message: 'this must be at least 3 characters',
    })
  })

  it('says of an empty field only whether it may stay empty', () => {
    expect(fieldCheck('name', '')).toEqual({ valid: false, message: undefined })
    expect(fieldCheck('logoUrl', '')).toEqual({ valid: null, message: undefined })
  })

  it('tells first what the alias may contain', () => {
    expect(fieldCheck('alias', 'A').message).toBe(
      'Alias can only contain lowercase letters, numbers, hyphens, and underscores.',
    )
  })

  it('takes a URL for the logo, nothing else', () => {
    expect(fieldCheck('logoUrl', 'https://example.org/logo.png').valid).toBe(true)
    expect(fieldCheck('logoUrl', 'nope').message).toBe('Logo URL must be a valid URL.')
  })
})

describe('the form as a whole', () => {
  it('passes an empty logo, as yup did', () => {
    expect(messageOf({})).toBeUndefined()
  })

  it('names the field by its key', () => {
    expect(messageOf({ name: 'ab' })).toBe('name must be at least 3 characters')
  })

  it('reports the last field that is wrong', () => {
    expect(messageOf({ name: 'ab', alias: 'x', logoUrl: 'nope' })).toBe(
      'Logo URL must be a valid URL.',
    )
    expect(messageOf({ name: 'ab', alias: 'Bad Alias' })).toBe(
      'Alias can only contain lowercase letters, numbers, hyphens, and underscores.',
    )
  })

  it('keeps only the fields of the form', () => {
    const output = v.parse(projectBrandingFormSchema, { ...form, id: 1, __typename: 'X' })
    expect(Object.keys(output).sort()).toEqual(['alias', 'logoUrl', 'name', 'newUserToSpace'])
  })
})
