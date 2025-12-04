// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import type { LogLevel } from 'config-schema'
import { validate } from 'config-schema'
import { Decimal } from 'decimal.js-light'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const logging = {
  LOG4JS_CONFIG_PLACEHOLDER: process.env.LOG4JS_CONFIG_PLACEHOLDER ?? 'log4js-config-%v.json',
  // default log level on production should be info
  // log level for default log4js-config.json, don't change existing log4js-config.json
  LOG_LEVEL: (process.env.LOG_LEVEL ?? 'info') as LogLevel,
  LOG_FILES_BASE_PATH: process.env.LOG_FILES_BASE_PATH ?? '../logs/federation',
}

const server = {
  // JWT_SECRET: process.env.JWT_SECRET || 'secret123',
  // JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '10m',
  GRAPHIQL: process.env.GRAPHIQL === 'true',
  // GDT_API_URL: process.env.GDT_API_URL || 'https://gdt.gradido.net',
  PRODUCTION: process.env.NODE_ENV === 'production',
}

const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? 'localhost'
const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? `${URL_PROTOCOL}://${COMMUNITY_HOST}`

const federation = {
  FEDERATION_API: process.env.FEDERATION_API ?? '1_0',
  FEDERATION_PORT: process.env.FEDERATION_PORT ?? 5010,
  FEDERATION_COMMUNITY_URL: process.env.FEDERATION_COMMUNITY_URL ?? COMMUNITY_URL,
  FEDERATION_TRADING_LEVEL: {
    RECEIVER_COMMUNITY_URL: 'https://stage3.gradido.net/api/',
    SEND_COINS: true,
    AMOUNT: 100,
  },
}

export const CONFIG = {
  ...logging,
  ...server,
  ...federation,
}

validate(schema, CONFIG)
