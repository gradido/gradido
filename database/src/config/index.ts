/* eslint-disable n/no-process-env */
import { LogLevel, validate } from 'config-schema'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()

const database = {
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_community',
}

const migrations = {
  MIGRATIONS_TABLE: process.env.MIGRATIONS_TABLE || 'migrations',
}

const logging = {
  LOG_BASE_PATH: process.env.LOG_BASE_PATH || '../logs',
  LOG_LEVEL: (process.env.LOG_LEVEL || 'info') as LogLevel,
}

const nodeEnv = process.env.NODE_ENV || 'development'

export const CONFIG = { ...database, ...migrations, ...logging, NODE_ENV: nodeEnv }

validate(schema, CONFIG)
