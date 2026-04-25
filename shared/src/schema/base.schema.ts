import { validate, version } from 'uuid'
import { z } from 'zod'
import { GradidoUnit } from '../data/GradidoUnit'
import { Duration } from '../data/Duration'

export const uuidv4Schema = z.string().refine(
  (val: string) => validate(val) && version(val) === 4,
  'Invalid uuid',
)
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