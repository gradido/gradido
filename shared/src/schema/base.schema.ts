import { validate, version } from 'uuid'
import { z } from 'zod'
import { AVAILABLE_LOCALS, DEFAULT_LANGUAGE } from '../const'
import { GradidoUnit } from '../data/GradidoUnit'
import { Duration } from '../data/Duration'

export const uuidv4Schema = z
  .string()
  .refine((val: string) => validate(val) && version(val) === 4, 'Invalid uuid')
export const emailSchema = z.string().trim().toLowerCase().email()
export const urlSchema = z.string().url()
export const uint32Schema = z.number().positive().lte(4294967295)
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

export const locationPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number()).length(2),
})

export type LocationPointInput = z.input<typeof locationPointSchema>
export type LocationPoint = z.output<typeof locationPointSchema>
