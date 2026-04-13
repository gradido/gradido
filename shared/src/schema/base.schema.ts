import { validate, version } from 'uuid'
import { z } from 'zod'
import { GradidoUnit } from '../data'
import { Duration } from '../data/Duration'

export const uuidv4Schema = z
  .string()
  .refine((val: string) => validate(val) && version(val) === 4, 'Invalid uuid')
export const emailSchema = z.string().email()
export const urlSchema = z.string().url()
export const uint32Schema = z.number().positive().lte(4294967295)

export const decaySchema = z.object({
  balance: z.instanceof(GradidoUnit),
  decay: z.instanceof(GradidoUnit),
  start: z.date().nullable(),
  end: z.date().nullable(),
  duration: z.union([z.instanceof(Duration), z.null()]).nullable(),
})

export type Decay = z.infer<typeof decaySchema>

// wire format, safe for JSON which doesn't know GradidoUnit or Date
export const wireDecaySchema = z.object({
  balance: z.string(),
  decay: z.string(),
  start: z.string().nullable(),
  end: z.string().nullable(),
  duration: z.string().nullable(),
})

export type WireDecay = z.infer<typeof wireDecaySchema>

export function decayToWireDecay(decay: Decay): WireDecay {
  return {
    balance: decay.balance.toString(),
    decay: decay.decay.toString(),
    start: decay.start?.toISOString() ?? null,
    end: decay.end?.toISOString() ?? null,
    duration: decay.duration?.toString() ?? null,
  }
}
