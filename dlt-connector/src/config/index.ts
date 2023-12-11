/* eslint-disable n/no-process-env */
import { Decimal } from 'decimal.js-light'
import dotenv from 'dotenv'
dotenv.config()

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const constants = {
  LOG4JS_CONFIG: 'log4js-config.json',
  DB_VERSION: '0003-refactor_transaction_recipe',
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v6.2023-10-17',
    CURRENT: '',
  },
}

const server = {
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const database = {
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_DATABASE: process.env.DB_DATABASE ?? 'gradido_dlt',
  DB_DATABASE_TEST: process.env.DB_DATABASE_TEST ?? 'gradido_dlt_test',
  TYPEORM_LOGGING_RELATIVE_PATH: process.env.TYPEORM_LOGGING_RELATIVE_PATH ?? 'typeorm.backend.log',
}

const iota = {
  IOTA_API_URL: process.env.IOTA_API_URL ?? 'https://chrysalis-nodes.iota.org',
  IOTA_COMMUNITY_ALIAS: process.env.IOTA_COMMUNITY_ALIAS ?? 'GRADIDO: TestHelloWelt2',
  IOTA_HOME_COMMUNITY_SEED: process.env.IOTA_HOME_COMMUNITY_SEED ?? null,
}

const dltConnector = {
  DLT_CONNECTOR_PORT: process.env.DLT_CONNECTOR_PORT || 6010,
}

const nodeServer = {
  NODE_SERVER_URL: process.env.NODE_SERVER_URL ?? 'http://localhost:8340',
}

const backendServer = {
  BACKEND_SERVER_URL: process.env.BACKEND_SERVER_URL ?? 'http://backend:4000',
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

export const CONFIG = {
  ...constants,
  ...server,
  ...database,
  ...iota,
  ...dltConnector,
  ...nodeServer,
  ...backendServer,
}
