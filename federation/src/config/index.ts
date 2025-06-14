// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)
import { Decimal } from 'decimal.js-light'
import dotenv from 'dotenv'

import { validate } from 'config-schema'

import { schema } from './schema'

dotenv.config()

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const constants = {
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
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
  ...constants,
  ...server,
  // ...community,
  // ...eventProtocol,
  ...federation,
}

validate(schema, CONFIG)
