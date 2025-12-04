import { validate, version } from 'uuid'
import { number, string } from 'zod'

export const uuidv4Schema = string().refine(
  (val: string) => validate(val) && version(val) === 4,
  'Invalid uuid',
)
export const emailSchema = string().email()
export const urlSchema = string().url()
export const uint32Schema = number().positive().lte(4294967295)
