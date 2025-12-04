import type { LogLevel } from 'config-schema'
import { validate } from 'config-schema'
import dotenv from 'dotenv'
import { schema } from './schema'

dotenv.config()

const logging = {
  LOG4JS_CONFIG: process.env.LOG4JS_CONFIG ?? 'log4js-config.json',
  // default log level on production should be info
  // log level for default log4js-config.json, don't change existing log4js-config.json
  LOG_LEVEL: (process.env.LOG_LEVEL ?? 'info') as LogLevel,
  LOG_FILES_BASE_PATH: process.env.LOG_FILES_BASE_PATH ?? '../logs/dht-node',
}

const server = {
  PRODUCTION: process.env.NODE_ENV === 'production',
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME ?? 'Gradido Entwicklung',
  COMMUNITY_DESCRIPTION:
    process.env.COMMUNITY_DESCRIPTION ?? 'Gradido-Community einer lokalen Entwicklungsumgebung.',
}

const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? 'localhost'
const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? `${URL_PROTOCOL}://${COMMUNITY_HOST}`

const federation = {
  FEDERATION_DHT_TOPIC: process.env.FEDERATION_DHT_TOPIC ?? 'GRADIDO_HUB',
  FEDERATION_DHT_SEED: process.env.FEDERATION_DHT_SEED ?? null,
  FEDERATION_COMMUNITY_URL: process.env.FEDERATION_COMMUNITY_URL ?? COMMUNITY_URL,
  FEDERATION_COMMUNITY_APIS: process.env.FEDERATION_COMMUNITY_APIS ?? '1_0',
}

export const CONFIG = {
  ...logging,
  ...server,
  ...community,
  ...federation,
}
validate(schema, CONFIG)
