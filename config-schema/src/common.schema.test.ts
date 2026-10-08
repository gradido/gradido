// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import {
  browserUrls,
  COMMUNITY_URL,
  DLT_ACTIVE,
  DLT_CONNECTOR_URL,
  decayStartTimeSchema,
  dltConnectorUrlRequiredWhenActive,
} from './common.schema'
import { DECAY_START_TIME } from './const'

const accepts = (schema: v.GenericSchema, input: unknown) => v.safeParse(schema, input).success

describe('COMMUNITY_URL', () => {
  it('takes no trailing slash', () => {
    expect(accepts(COMMUNITY_URL, 'http://localhost')).toBe(true)
    expect(accepts(COMMUNITY_URL, 'http://localhost/')).toBe(false)
  })
})

describe('browserUrls', () => {
  it('skips entries that are not set', () => {
    expect(accepts(browserUrls, ['http://a.b', undefined, 'http://c.d'])).toBe(true)
  })

  it('refuses mixed protocols and entries that are no URL', () => {
    expect(accepts(browserUrls, ['http://a.b', 'https://c.d'])).toBe(false)
    expect(accepts(browserUrls, ['http://a.b', null])).toBe(false)
    expect(accepts(browserUrls, ['x'])).toBe(false)
  })
})

describe('dltConnectorUrlRequiredWhenActive', () => {
  const schema = v.pipe(
    v.strictObject({ DLT_ACTIVE, DLT_CONNECTOR_URL: v.optional(DLT_CONNECTOR_URL) }),
    dltConnectorUrlRequiredWhenActive(),
  )

  it('asks for the URL only with the DLT on', () => {
    expect(accepts(schema, { DLT_ACTIVE: false })).toBe(true)
    expect(accepts(schema, { DLT_ACTIVE: true })).toBe(false)
    expect(accepts(schema, { DLT_ACTIVE: true, DLT_CONNECTOR_URL: 'http://localhost:6010' })).toBe(
      true,
    )
  })
})

describe('decayStartTimeSchema', () => {
  it('takes the decay start as a Date or as text, and nothing else', () => {
    expect(accepts(decayStartTimeSchema, new Date(DECAY_START_TIME))).toBe(true)
    expect(accepts(decayStartTimeSchema, '2021-05-13T17:46:31Z')).toBe(true)
    expect(accepts(decayStartTimeSchema, undefined)).toBe(true)
    expect(accepts(decayStartTimeSchema, new Date())).toBe(false)
    expect(accepts(decayStartTimeSchema, 'abc')).toBe(false)
  })
})
