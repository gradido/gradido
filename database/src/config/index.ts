import dotenv from 'dotenv'

dotenv.config()

const defaults = {
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE ?? 'en',
}

const database = {
  DB_CONNECT_RETRY_COUNT: process.env.DB_CONNECT_RETRY_COUNT
    ? Number.parseInt(process.env.DB_CONNECT_RETRY_COUNT)
    : 15,
  DB_CONNECT_RETRY_DELAY_MS: process.env.DB_CONNECT_RETRY_DELAY_MS
    ? Number.parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS)
    : 500,
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_DATABASE: process.env.DB_DATABASE ?? 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH:
    process.env.TYPEORM_LOGGING_RELATIVE_PATH ?? 'typeorm.database.log',
  TYPEORM_LOGGING_ACTIVE: process.env.TYPEORM_LOGGING_ACTIVE === 'true' || false,
}
const PRODUCTION = process.env.NODE_ENV === 'production' || false
const nodeEnv = process.env.NODE_ENV || 'development'
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const CONFIG = { ...database, NODE_ENV: nodeEnv, PRODUCTION, REDIS_URL, ...defaults }
