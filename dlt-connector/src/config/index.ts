/* eslint-disable n/no-process-env */
import dotenv from 'dotenv'
dotenv.config()

const constants = {
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v7.2024-09-24',
    CURRENT: '',
  },
}

const server = {
  PRODUCTION: process.env.NODE_ENV === 'production' ?? false,
  JWT_SECRET: process.env.JWT_SECRET ?? 'secret123',
}

const iota = {
  IOTA_API_URL: process.env.IOTA_API_URL ?? 'https://chrysalis-nodes.iota.org',
  IOTA_COMMUNITY_ALIAS: process.env.IOTA_COMMUNITY_ALIAS ?? 'GRADIDO: TestHelloWelt2',
  IOTA_HOME_COMMUNITY_SEED: process.env.IOTA_HOME_COMMUNITY_SEED ?? null,
}

const dltConnector = {
  DLT_CONNECTOR_PORT: process.env.DLT_CONNECTOR_PORT ?? 6010,
}

const nodeServer = {
  NODE_SERVER_URL: process.env.NODE_SERVER_URL ?? 'http://localhost:8340',
}

const gradidoBlockchain = {
  GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET:
    process.env.GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET ?? 'invalid',
  GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY:
    process.env.GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY ?? 'invalid',
}

const backendServer = {
  BACKEND_SERVER_URL: process.env.BACKEND_SERVER_URL ?? 'http://backend:4000',
}

// Check config version
constants.CONFIG_VERSION.CURRENT = process.env.CONFIG_VERSION ?? constants.CONFIG_VERSION.DEFAULT
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
  ...iota,
  ...dltConnector,
  ...nodeServer,
  ...gradidoBlockchain,
  ...backendServer,
}
