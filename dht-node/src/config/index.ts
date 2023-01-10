// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)
import dotenv from 'dotenv'
dotenv.config()
/*
import Decimal from 'decimal.js-light'

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})
*/

const constants = {
  DB_VERSION: '0058-add_communities_table',
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v14.2022-11-22',
    CURRENT: '',
  },
}

const server = {
  PORT: process.env.PORT || 5000,
  GRAPHIQL: process.env.GRAPHIQL === 'true' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const database = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH:
    process.env.TYPEORM_LOGGING_RELATIVE_PATH || 'typeorm.dht-node.log',
}

const eventProtocol = {
  // global switch to enable writing of EventProtocol-Entries
  EVENT_PROTOCOL_DISABLED: process.env.EVENT_PROTOCOL_DISABLED === 'true' || false,
}

const federation = {
  FEDERATION_DHT_TOPIC: process.env.FEDERATION_DHT_TOPIC || null,
  FEDERATION_DHT_SEED: process.env.FEDERATION_DHT_SEED || null,
  FEDERATION_COMMUNITY_URL: process.env.FEDERATION_COMMUNITY_URL || null,
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

const CONFIG = {
  ...constants,
  ...server,
  ...database,
  ...eventProtocol,
  ...federation,
}

export default CONFIG
