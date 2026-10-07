// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { configRule, requiredWhen, startsWithValueOf } from './rules'

const firstIssue = (schema: v.GenericSchema, input: unknown) => {
  const result = v.safeParse(schema, input)
  return result.success ? undefined : result.issues[0]
}

describe('requiredWhen', () => {
  const schema = v.pipe(
    v.strictObject({ ACTIVE: v.boolean(), URL: v.optional(v.string()) }),
    requiredWhen('URL', 'ACTIVE'),
  )

  it('lets the key be left out while the flag is off', () => {
    expect(firstIssue(schema, { ACTIVE: false })).toBeUndefined()
  })

  it('asks for the key while the flag is on', () => {
    const issue = firstIssue(schema, { ACTIVE: true })
    expect(issue?.message).toBe('URL is required when ACTIVE is true')
    expect(issue?.path?.map((item) => item.key)).toEqual(['URL'])
    expect(issue?.input).toBeUndefined()
  })

  it('takes an empty string as not set', () => {
    expect(firstIssue(schema, { ACTIVE: true, URL: '' })?.message).toBe(
      'URL is required when ACTIVE is true',
    )
    expect(firstIssue(schema, { ACTIVE: true, URL: 'x' })).toBeUndefined()
  })

  it('compares the flag with a given value', () => {
    const hosting = v.pipe(
      v.strictObject({ HOSTING: v.optional(v.string()), PORT: v.optional(v.number()) }),
      requiredWhen('PORT', 'HOSTING', 'nodejs'),
    )
    expect(firstIssue(hosting, { HOSTING: 'nginx' })).toBeUndefined()
    expect(firstIssue(hosting, {})).toBeUndefined()
    expect(firstIssue(hosting, { HOSTING: 'nodejs' })?.message).toBe(
      'PORT is required when HOSTING is nodejs',
    )
  })
})

describe('startsWithValueOf', () => {
  const schema = v.pipe(
    v.strictObject({ BASE: v.string(), LINK: v.optional(v.string()) }),
    startsWithValueOf('LINK', 'BASE'),
  )

  it('passes a link on the base and a missing link', () => {
    expect(firstIssue(schema, { BASE: 'http://a.b', LINK: 'http://a.b/redeem/' })).toBeUndefined()
    expect(firstIssue(schema, { BASE: 'http://a.b' })).toBeUndefined()
  })

  it('reports a link elsewhere on the link', () => {
    const issue = firstIssue(schema, { BASE: 'http://a.b', LINK: 'http://c.d/redeem/' })
    expect(issue?.message).toBe('LINK must start with BASE')
    expect(issue?.path?.map((item) => item.key)).toEqual(['LINK'])
    expect(issue?.input).toBe('http://c.d/redeem/')
  })
})

describe('configRule', () => {
  it('is skipped while a key fails its own schema', () => {
    let calls = 0
    const schema = v.pipe(
      v.strictObject({ A: v.number() }),
      configRule(
        'A',
        () => {
          calls++
          return false
        },
        'never',
      ),
    )
    expect(firstIssue(schema, { A: 'x' })?.message).toContain('Expected number')
    expect(calls).toBe(0)
    expect(firstIssue(schema, { A: 1 })?.message).toBe('never')
    expect(calls).toBe(1)
  })
})
