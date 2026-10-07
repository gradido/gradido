import { KeyObject } from 'node:crypto'
import { validate, version } from 'uuid'
import * as v from 'valibot'
import { AVAILABLE_LOCALS, DEFAULT_LANGUAGE } from '../const'
import { Duration } from '../data/Duration'
import { GradidoUnit } from '../data/GradidoUnit'

export const uuidv4Schema = v.pipe(
  v.string(),
  v.check((val: string) => validate(val) && version(val) === 4, 'Invalid uuid'),
)

export type Uuidv4Input = v.InferInput<typeof uuidv4Schema>
export type Uuidv4 = v.InferOutput<typeof uuidv4Schema>

// With a message of its own: valibot's default quotes the address it refuses, and a message
// ends up in the error log.
export const emailSchema = v.pipe(
  v.string(),
  v.trim(),
  v.toLowerCase(),
  v.rfcEmail('Invalid email'),
)
export const urlSchema = v.pipe(v.string(), v.url('Invalid url'))

/**
 * Bytes spelled as hex, the way the environment holds a key or a secret, into a Buffer.
 * valibot's `hexadecimal` lets a `0x`/`0h` prefix (lowercase) and an odd number of digits through, and
 * `Buffer.from(…, 'hex')` would swallow both silently -- stop at the `x`, drop the last
 * digit -- so both are handled here. Compose a length on top where the bytes have one:
 * `v.pipe(hexBytesSchema, v.length(16))`.
 */
export const hexBytesSchema = v.pipe(
  v.union([
    v.pipe(
      v.string(),
      v.hexadecimal('Invalid hex'),
      v.transform((hex) => hex.replace(/^0[hx]/, '')),
      v.check((hex) => hex.length % 2 === 0, 'Hex needs an even number of digits'),
    ),
    v.instance(Buffer),
  ]),
  v.transform((hex) => {
    if (typeof hex === 'string') {
      return Buffer.from(hex, 'hex')
    } else {
      return hex
    }
  }),
)

export const uint32Schema = v.pipe(v.number(), v.gtValue(0), v.maxValue(4294967295))

/**
 * `schema`, optional, with a blank string - empty or only whitespace - taken as not given
 * (`null`) instead of being checked. For fields a client may send as '' when it means "none",
 * such as an absent optional route parameter (vue-router hands `/register/:code?` over as
 * `code: ''`). Anything else is checked by `schema` as usual, with its own messages.
 */
// The outer `optional` is what lets the key be left out of an object altogether: valibot
// decides that by the kind of schema a key has, not by what its type would accept.
export const blankAsNull = <TSchema extends v.GenericSchema>(schema: TSchema) =>
  v.optional(
    v.pipe(
      v.unknown(),
      v.transform((value) => (typeof value === 'string' && value.trim() === '' ? null : value)),
      v.nullish(schema),
    ),
  )
export const languageSchema = v.picklist(AVAILABLE_LOCALS)
// return default language on invalid language input
export const defaultLanguageSchema = v.fallback(languageSchema, DEFAULT_LANGUAGE)

export const decaySchema = v.object({
  balance: v.instance(GradidoUnit),
  decay: v.instance(GradidoUnit),
  start: v.nullable(v.date()),
  end: v.nullable(v.date()),
  duration: v.nullable(v.instance(Duration)),
})

export type Decay = v.InferOutput<typeof decaySchema>

// TODO: actually check for valid ed25519 Keys/Key Pair
export const ed25519PublicKeySchema = v.pipe(
  v.instance(Buffer),
  v.check((value) => value.length === 32, 'Expected 32 Bytes'),
)

export const ed25519PrivateKeySchema = v.pipe(
  v.instance(Buffer),
  v.check((value) => value.length === 64, 'Expected 64 Bytes'),
)

// node:crypto KeyObject of any type (secret, public, private), narrow it where the type matters
export const nodeCryptoKeyObjectSchema = v.custom<KeyObject>((val) => val instanceof KeyObject)
// a Duration instance, a string like "10m" must be converted first: Duration.fromString
export const durationSchema = v.custom<Duration>((val) => val instanceof Duration)
export const nonNegativeIntegerSchema = v.pipe(v.number(), v.integer(), v.minValue(0))
export const integerSchema = v.pipe(v.number(), v.integer())
// integer > 0
export const positiveIntegerSchema = v.pipe(v.number(), v.integer(), v.gtValue(0))

// whatever `new Date()` makes a date of: a Date, a timestamp, a date string
export const dateSchema = v.pipe(
  v.union([v.string(), v.date(), integerSchema]),
  v.transform((input) => new Date(input)),
  v.date(),
)

export const locationPointSchema = v.object({
  type: v.literal('Point'),
  coordinates: v.pipe(v.array(v.number()), v.length(2)),
})

export type LocationPointInput = v.InferInput<typeof locationPointSchema>
export type LocationPoint = v.InferOutput<typeof locationPointSchema>
