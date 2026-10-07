// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import {
  booleanSchema,
  hexSchema,
  hostnameSchema,
  hostSchema,
  httpsUrlSchema,
  httpUrlSchema,
  integerSchema,
  nonEmptyStringSchema,
  numberSchema,
  portSchema,
} from './base.schema'

const accepts = (schema: v.GenericSchema, input: unknown) => v.safeParse(schema, input).success

describe('booleanSchema', () => {
  it('takes booleans and the strings an environment hands over', () => {
    expect(v.parse(booleanSchema, true)).toBe(true)
    expect(v.parse(booleanSchema, 'true')).toBe(true)
    expect(v.parse(booleanSchema, 'FALSE')).toBe(false)
  })

  it('refuses numbers and other strings', () => {
    expect(accepts(booleanSchema, 1)).toBe(false)
    expect(accepts(booleanSchema, '1')).toBe(false)
    expect(accepts(booleanSchema, null)).toBe(false)
  })
})

describe('numberSchema', () => {
  it('takes numbers and numeric strings', () => {
    expect(v.parse(numberSchema, 4000)).toBe(4000)
    expect(v.parse(numberSchema, '4000')).toBe(4000)
    expect(v.parse(numberSchema, ' 1e3 ')).toBe(1000)
    expect(v.parse(numberSchema, '-1.5')).toBe(-1.5)
  })

  it('refuses what is no finite number', () => {
    expect(accepts(numberSchema, 'abc')).toBe(false)
    expect(accepts(numberSchema, '40x00')).toBe(false)
    expect(accepts(numberSchema, Number.NaN)).toBe(false)
    expect(accepts(numberSchema, Number.POSITIVE_INFINITY)).toBe(false)
    expect(accepts(numberSchema, true)).toBe(false)
  })

  it('narrows to integers and ports', () => {
    expect(accepts(integerSchema, 1.5)).toBe(false)
    expect(v.parse(portSchema, '3000')).toBe(3000)
    expect(accepts(portSchema, 1023)).toBe(false)
    expect(accepts(portSchema, 49152)).toBe(false)
  })
})

describe('nonEmptyStringSchema', () => {
  it('refuses the empty string, as Joi did', () => {
    expect(accepts(nonEmptyStringSchema, '')).toBe(false)
    expect(accepts(nonEmptyStringSchema, ' ')).toBe(true)
  })
})

describe('hexSchema', () => {
  it('takes plain hex only', () => {
    expect(accepts(hexSchema, 'a51ef8ac')).toBe(true)
    expect(accepts(hexSchema, '0xa51ef8ac')).toBe(false)
    expect(accepts(hexSchema, 'zz')).toBe(false)
  })
})

describe('url schemas', () => {
  it('check the scheme', () => {
    expect(accepts(httpUrlSchema, 'http://0.0.0.0/redeem/')).toBe(true)
    expect(accepts(httpUrlSchema, 'https://stage3.gradido.net/api/')).toBe(true)
    expect(accepts(httpUrlSchema, 'ftp://x.y')).toBe(false)
    expect(accepts(httpsUrlSchema, 'http://x.y')).toBe(false)
    expect(accepts(httpsUrlSchema, 'https://api.klicktipp.com')).toBe(true)
  })

  it('refuse what is no URL without throwing', () => {
    expect(accepts(httpUrlSchema, 'redeem/')).toBe(false)
    expect(accepts(httpUrlSchema, 'http://')).toBe(false)
    expect(accepts(httpUrlSchema, '')).toBe(false)
  })
})

describe('hostnameSchema', () => {
  it('takes hostnames and IP addresses', () => {
    expect(accepts(hostnameSchema, 'mailserver')).toBe(true)
    expect(accepts(hostnameSchema, 'stage1.gradido.net')).toBe(true)
    expect(accepts(hostnameSchema, '127.0.0.1')).toBe(true)
    expect(accepts(hostnameSchema, '::1')).toBe(true)
  })

  it('refuses spaces, underscores and bare numbers', () => {
    expect(accepts(hostnameSchema, 'mail server')).toBe(false)
    expect(accepts(hostnameSchema, 'mail_server')).toBe(false)
    expect(accepts(hostnameSchema, '4000')).toBe(false)
    expect(accepts(hostnameSchema, '-mail')).toBe(false)
  })
})

describe('hostSchema', () => {
  it('takes localhost, an IPv4 address or a domain', () => {
    expect(accepts(hostSchema, 'localhost')).toBe(true)
    expect(accepts(hostSchema, '0.0.0.0')).toBe(true)
    expect(accepts(hostSchema, 'stage1.gradido.net')).toBe(true)
  })

  it('refuses a single label, an IPv6 address and spaces', () => {
    expect(accepts(hostSchema, 'mailserver')).toBe(false)
    expect(accepts(hostSchema, '::1')).toBe(false)
    expect(accepts(hostSchema, 'not a host')).toBe(false)
  })
})
