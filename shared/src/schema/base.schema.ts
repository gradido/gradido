import { string, number, custom } from 'zod'
import { validate, version } from 'uuid'

export const uuidv4Schema = string().refine((val: string) => validate(val) && version(val) === 4, 'Invalid uuid')
export const emailSchema = string().email()
export const urlSchema = string().url()
export const uint32Schema = number().positive().lte(4294967295)
export const buffer32Schema = custom<Buffer>(
  (val: Buffer) => Buffer.isBuffer(val) && val.length === 32,
  'Invalid buffer'
)
export const hex64Schema = string().length(64).regex(/^[0-9A-Fa-f]$/)