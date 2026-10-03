import { KeyObject } from 'node:crypto'
import { validate, version } from 'uuid'
import { z } from 'zod'
import { AVAILABLE_LOCALS, DEFAULT_LANGUAGE } from '../const'
import { Duration } from '../data/Duration'
import { GradidoUnit } from '../data/GradidoUnit'

export const uuidv4Schema = z
  .string()
  .refine((val: string) => validate(val) && version(val) === 4, 'Invalid uuid')

export type Uuidv4Input = z.input<typeof uuidv4Schema>
export type Uuidv4 = z.output<typeof uuidv4Schema>

export const emailSchema = z.string().trim().toLowerCase().email()
export const urlSchema = z.string().url()
export const uint32Schema = z.number().positive().lte(4294967295)

/**
 * `schema`, optional, with a blank string - empty or only whitespace - taken as not given
 * (`null`) instead of being checked. For fields a client may send as '' when it means "none",
 * such as an absent optional route parameter (vue-router hands `/register/:code?` over as
 * `code: ''`). Anything else is checked by `schema` as usual, with its own messages.
 */
export const blankAsNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    schema.nullish(),
  )
export const languageSchema = z.enum(AVAILABLE_LOCALS)
// return default language on invalid language input
export const defaultLanguageSchema = languageSchema.catch(DEFAULT_LANGUAGE)

export const decaySchema = z.object({
  balance: z.instanceof(GradidoUnit),
  decay: z.instanceof(GradidoUnit),
  start: z.date().nullable(),
  end: z.date().nullable(),
  duration: z.union([z.instanceof(Duration), z.null()]).nullable(),
})

export type Decay = z.infer<typeof decaySchema>

// TODO: actually check for valid ed25519 Keys/Key Pair
export const ed25519PublicKeySchema = z.instanceof(Buffer).superRefine((value, ctx) => {
  if (value.length !== 32) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expected 32 Bytes',
    })
  }
})

export const ed25519PrivateKeySchema = z.instanceof(Buffer).superRefine((value, ctx) => {
  if (value.length !== 64) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Expected 64 Bytes',
    })
  }
})

export const nodeCryptoKeyObjectSchema = z.custom<KeyObject>((val) => val instanceof KeyObject)
export const durationSchema = z.custom<Duration>((val) => val instanceof Duration)
export const positiveIntegerSchema = z.number().int().nonnegative()

export const locationPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number()).length(2),
})

export type LocationPointInput = z.input<typeof locationPointSchema>
export type LocationPoint = z.output<typeof locationPointSchema>
