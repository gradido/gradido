import { z } from 'zod'

export const LOG_LEVEL = z.enum([
  'all',
  'mark',
  'trace',
  'debug',
  'info',
  'warn',
  'error',
  'fatal',
  'off',
])

export type LogLevel = z.infer<typeof LOG_LEVEL>
