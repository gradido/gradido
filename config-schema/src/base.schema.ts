// AI-GENERATED — not an architecture reference
import * as v from 'valibot'

// Joi coerced before it checked: 'true'/'false' became booleans and numeric strings numbers.
// The modules build CONFIG from process.env with both forms, so both stay accepted.
const BOOLEAN_STRING = /^(true|false)$/i
// what Joi's number() accepted from a string: an optional sign, digits with an optional
// fraction, an optional exponent
const NUMBER_STRING = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?\s*$/i

export const booleanSchema = v.pipe(
  v.union([v.boolean(), v.string()]),
  v.check((input) => typeof input === 'boolean' || BOOLEAN_STRING.test(input), 'must be a boolean'),
  v.transform((input) => (typeof input === 'boolean' ? input : input.toLowerCase() === 'true')),
)

export const numberSchema = v.pipe(
  v.union([v.number(), v.string()]),
  v.check(
    (input) => (typeof input === 'number' ? Number.isFinite(input) : NUMBER_STRING.test(input)),
    'must be a number',
  ),
  v.transform(Number),
  v.check((input) => Math.abs(input) <= Number.MAX_SAFE_INTEGER, 'must be a safe number'),
)

export const integerSchema = v.pipe(numberSchema, v.integer())

// a port outside the well-known and the ephemeral range
export const portSchema = v.pipe(integerSchema, v.minValue(1024), v.maxValue(49151))

// Joi's string() refused the empty string. A key that accepts '' says so with v.string() alone.
export const nonEmptyStringSchema = v.pipe(v.string(), v.nonEmpty())

export const hexSchema = v.pipe(
  nonEmptyStringSchema,
  v.regex(/^[a-fA-F0-9]+$/, 'need to be valid hex'),
)

export const emailSchema = v.pipe(nonEmptyStringSchema, v.email())

export const uuidSchema = v.pipe(nonEmptyStringSchema, v.uuid())

export const urlSchema = v.pipe(nonEmptyStringSchema, v.url())

// undefined for what is no URL: a check after a failed url() still runs
const schemeOf = (url: string): string | undefined => {
  try {
    return new URL(url).protocol.slice(0, -1)
  } catch {
    return undefined
  }
}

const urlWithSchemeSchema = (schemes: string[]) =>
  v.pipe(
    urlSchema,
    v.check(
      (input) => schemes.includes(schemeOf(input) ?? ''),
      `must be a valid uri with a scheme matching the ${schemes.join('|')} pattern`,
    ),
  )

export const httpUrlSchema = urlWithSchemeSchema(['http', 'https'])
export const httpsUrlSchema = urlWithSchemeSchema(['https'])

// RFC 1123: labels of letters, digits and hyphens, no hyphen at either end, 63 characters each
const HOSTNAME_LABEL = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
// the last label starts with a letter, which keeps a bare number from passing as a hostname
const LAST_LABEL = /^[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

const isHostname = (input: string): boolean => {
  const labels = input.split('.')
  return (
    input.length <= 256 &&
    labels.every((label) => HOSTNAME_LABEL.test(label)) &&
    LAST_LABEL.test(labels[labels.length - 1])
  )
}

// a hostname of at least two labels - Joi also checked the last one against the IANA list of
// top-level domains, which is not worth carrying along for a config value
const isDomain = (input: string): boolean => isHostname(input) && input.includes('.')

// a hostname, or an IP address
export const hostnameSchema = v.pipe(
  nonEmptyStringSchema,
  v.check((input) => isHostname(input) || v.IP_REGEX.test(input), 'must be a valid hostname'),
)

// where a module is served from: localhost, an IPv4 address or a domain
export const hostSchema = v.pipe(
  nonEmptyStringSchema,
  v.check(
    (input) => input === 'localhost' || v.IPV4_REGEX.test(input) || isDomain(input),
    'Must be localhost, a valid IPv4 address or a valid domain',
  ),
)
