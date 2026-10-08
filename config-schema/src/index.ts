import 'source-map-support/register'

export { DatabaseConfigSchema } from './database.schema'
export type { Category, LogLevel } from './log4js-config'
export { createLog4jsConfig, defaultCategory, initLogger } from './log4js-config'
export * from './schema'
