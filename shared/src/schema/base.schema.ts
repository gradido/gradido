import { validate, version } from 'uuid'
import * as v from 'valibot'
import { AVAILABLE_LOCALS, DEFAULT_LANGUAGE } from '../const/constants'

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
export type Email = v.InferOutput<typeof emailSchema>
export const urlSchema = v.pipe(v.string(), v.url('Invalid url'))

export const uint32Schema = v.pipe(v.number(), v.gtValue(0), v.maxValue(4294967295))
/**
 * An unsigned 64-bit integer as a client sends it, in decimal digits - an e-mail code from a
 * link, say. Checked before `BigInt()`, which throws on anything else, reads a `0x` prefix
 * as hex and turns '' into 0n. Twenty digits are the most a BIGINT UNSIGNED has; a larger
 * value of that length gets through and matches nothing.
 */
export const uint64StringSchema = v.pipe(v.string(), v.digits(), v.maxLength(20))

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

export const dateStringSchema = v.pipe(
  v.union([v.string('expect string type'), v.instance(Date, 'expect Date object')]),
  v.transform<string | Date, string>((input) => {
    if (input instanceof Date) {
      return input.toISOString()
    } else {
      return new Date(input).toISOString()
    }
  }),
)

export type DateStringInput = v.InferInput<typeof dateStringSchema>
export type DateString = v.InferOutput<typeof dateStringSchema>

export const locationPointSchema = v.object({
  type: v.literal('Point'),
  coordinates: v.pipe(v.array(v.number()), v.length(2)),
})

export type LocationPointInput = v.InferInput<typeof locationPointSchema>
export type LocationPoint = v.InferOutput<typeof locationPointSchema>
