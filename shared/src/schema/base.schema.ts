import { validate, version } from 'uuid'
import { z } from 'zod'

export const uuidv4Schema = z
  .string()
  .refine((val: string) => validate(val) && version(val) === 4, 'Invalid uuid')
export const emailSchema = z.string().email()
export const urlSchema = z.string().url()
export const uint32Schema = z.number().positive().lte(4294967295)
