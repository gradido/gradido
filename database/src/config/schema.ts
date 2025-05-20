import {
  DB_CONNECT_RETRY_COUNT,
  DB_CONNECT_RETRY_DELAY_MS,
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  LOG_BASE_PATH,
  LOG_LEVEL,
  NODE_ENV,
} from 'config-schema'

import Joi from 'joi'

export const schema = Joi.object({
  DB_CONNECT_RETRY_COUNT,
  DB_CONNECT_RETRY_DELAY_MS,
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  LOG_BASE_PATH,
  LOG_LEVEL,
  MIGRATIONS_TABLE: Joi.string()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .min(1)
    .max(64)
    .default('migrations')
    .description('Name of the table used for migrations'),
  NODE_ENV,
})
