/* eslint-disable n/no-process-env */
import dotenv from 'dotenv'
dotenv.config()

const logging = {
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
}

const server = {
  PRODUCTION: process.env.NODE_ENV === 'production',
  DLT_CONNECTOR_PORT: process.env.DLT_CONNECTOR_PORT ?? 6010,
}

const secrets = {
  JWT_SECRET: process.env.JWT_SECRET ?? 'secret123',
  GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET:
    process.env.GRADIDO_BLOCKCHAIN_CRYPTO_APP_SECRET ?? 'invalid',
  GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY:
    process.env.GRADIDO_BLOCKCHAIN_SERVER_CRYPTO_KEY ?? 'invalid',
}

const iota = {
  IOTA_HOME_COMMUNITY_SEED: process.env.IOTA_HOME_COMMUNITY_SEED ?? null,
}

const apis = {  
  CONNECT_TIMEOUT_MS: process.env.CONNECT_TIMEOUT_MS
    ? Number.parseInt(process.env.CONNECT_TIMEOUT_MS)
    : 1000,
  CONNECT_RETRY_COUNT: process.env.CONNECT_RETRY_COUNT
    ? Number.parseInt(process.env.CONNECT_RETRY_COUNT)
    : 15,
  CONNECT_RETRY_DELAY_MS: process.env.CONNECT_RETRY_DELAY_MS
    ? Number.parseInt(process.env.CONNECT_RETRY_DELAY_MS)
    : 500,
  IOTA_API_URL: process.env.IOTA_API_URL ?? 'https://chrysalis-nodes.iota.org',
  NODE_SERVER_URL: process.env.NODE_SERVER_URL ?? 'http://127.0.0.1:8340',
  BACKEND_SERVER_URL: process.env.BACKEND_SERVER_URL ?? 'http://127.0.0.1:4000',
}

export const CONFIG = {
  ...logging,
  ...server,
  ...secrets,
  ...iota,
  ...apis,
}
