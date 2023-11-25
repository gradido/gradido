// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)
import { Decimal } from 'decimal.js-light'
import dotenv from 'dotenv'

dotenv.config()

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const constants = {
  DB_VERSION: '0077-add_resubmission_date_contribution_message',
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v2.2023-08-24',
    CURRENT: '',
  },
}

const server = {
  // JWT_SECRET: process.env.JWT_SECRET || 'secret123',
  // JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '10m',
  GRAPHIQL: process.env.GRAPHIQL === 'true' || false,
  // GDT_API_URL: process.env.GDT_API_URL || 'https://gdt.gradido.net',
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}
const database = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH: process.env.TYPEORM_LOGGING_RELATIVE_PATH || 'typeorm.backend.log',
}

// Check config version
constants.CONFIG_VERSION.CURRENT = process.env.CONFIG_VERSION || constants.CONFIG_VERSION.DEFAULT
if (
  ![constants.CONFIG_VERSION.EXPECTED, constants.CONFIG_VERSION.DEFAULT].includes(
    constants.CONFIG_VERSION.CURRENT,
  )
) {
  throw new Error(
    `Fatal: Config Version incorrect - expected "${constants.CONFIG_VERSION.EXPECTED}" or "${constants.CONFIG_VERSION.DEFAULT}", but found "${constants.CONFIG_VERSION.CURRENT}"`,
  )
}

const federation = {
  FEDERATION_API: process.env.FEDERATION_API || '1_0',
  FEDERATION_PORT: process.env.FEDERATION_PORT || 5010,
  FEDERATION_COMMUNITY_URL: process.env.FEDERATION_COMMUNITY_URL || null,
  FEDERATION_TRADING_LEVEL: {
    RECEIVER_COMMUNITY_URL: 'https://stage3.gradido.net/api/',
    SEND_COINS: true,
    AMOUNT: 100,
  },
}

export const CONFIG = {
  ...constants,
  ...server,
  ...database,
  // ...community,
  // ...eventProtocol,
  ...federation,
}

export default CONFIG
