// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import { booleanSchema, portSchema } from './base.schema'
import {
  browserUrls,
  COMMUNITY_HOST,
  COMMUNITY_URL,
  communityUrlOf,
  URL_PROTOCOL,
} from './common.schema'
import { parseConfig, validate } from './validate'

const schema = v.strictObject({
  NAME: v.pipe(v.string(), v.minLength(3), v.description('The name of the community')),
  PORT: v.optional(v.pipe(v.number(), v.description('The port'))),
  TRADING: v.strictObject({ AMOUNT: v.number() }),
})

describe('validate', () => {
  it('returns without a word on valid data', () => {
    expect(validate(schema, { NAME: 'Gradido', TRADING: { AMOUNT: 1 } })).toBeUndefined()
  })

  it('names a missing key with its description', () => {
    expect(() => validate(schema, { TRADING: { AMOUNT: 1 } })).toThrow(
      /^Environment Variable 'NAME' is missing. The name of the community, details:/,
    )
  })

  it('names an invalid value with its description', () => {
    expect(() => validate(schema, { NAME: 'ab', TRADING: { AMOUNT: 1 } })).toThrow(
      /^Error on Environment Variable NAME with value = ab: Invalid length.*\. The name of the community$/,
    )
  })

  it('finds the description inside an optional key', () => {
    expect(() => validate(schema, { NAME: 'Gradido', PORT: 'x', TRADING: { AMOUNT: 1 } })).toThrow(
      /^Error on Environment Variable PORT with value = x: .*\. The port$/,
    )
  })

  it('refuses a key the schema does not know', () => {
    expect(() => validate(schema, { NAME: 'Gradido', TRADING: { AMOUNT: 1 }, OTHER: 1 })).toThrow(
      /^Error on Environment Variable OTHER/,
    )
  })

  it('spells out a nested key', () => {
    expect(() => validate(schema, { NAME: 'Gradido', TRADING: {} })).toThrow(
      /^Environment Variable 'TRADING.AMOUNT' is missing. No description available/,
    )
  })

  it('reports an issue without a key on the whole value', () => {
    expect(() => validate(browserUrls, ['http://a.b', 'https://a.b'])).toThrow(
      /^Config validation failed: All URLs need to have same protocol/,
    )
  })
})

describe('parseConfig', () => {
  // the shape of a module's schema: what the environment sets, defaults, derived values
  const moduleSchema = v.pipe(
    v.object({
      PORT: v.optional(v.pipe(portSchema, v.description('The port')), 4000),
      ACTIVE: v.optional(booleanSchema, false),
      COMMUNITY_HOST,
      URL_PROTOCOL,
      COMMUNITY_URL: v.optional(COMMUNITY_URL),
    }),
    v.transform((env) => ({ ...env, COMMUNITY_URL: communityUrlOf(env) })),
  )

  it('fills in the defaults and ignores the rest of the environment', () => {
    expect(parseConfig(moduleSchema, { PATH: '/usr/bin' })).toEqual({
      PORT: 4000,
      ACTIVE: false,
      COMMUNITY_HOST: 'localhost',
      URL_PROTOCOL: 'http',
      COMMUNITY_URL: 'http://localhost',
    })
  })

  it('converts the strings an environment hands over', () => {
    const config = parseConfig(moduleSchema, {
      PORT: '4100',
      ACTIVE: 'true',
      COMMUNITY_URL: 'https://a.b',
    })
    expect(config.PORT).toBe(4100)
    expect(config.ACTIVE).toBe(true)
    expect(config.COMMUNITY_URL).toBe('https://a.b')
  })

  it('throws the same message validate does', () => {
    expect(() => parseConfig(moduleSchema, { PORT: '80' })).toThrow(
      /^Error on Environment Variable PORT with value = 80: .*\. The port$/,
    )
  })
})
