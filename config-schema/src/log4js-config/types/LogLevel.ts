import * as v from 'valibot'

export const LOG_LEVEL = v.picklist([
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

export type LogLevel = v.InferOutput<typeof LOG_LEVEL>
