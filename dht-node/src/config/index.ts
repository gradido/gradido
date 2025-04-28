/* eslint-disable n/no-process-env */
import { validate } from 'config-schema'
import { latestDbVersion } from 'database'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()

const constants = {
  DB_VERSION: latestDbVersion,
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
}

const server = {
  PRODUCTION: process.env.NODE_ENV === 'production',
}

const database = {
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_DATABASE: process.env.DB_DATABASE ?? 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH:
    process.env.TYPEORM_LOGGING_RELATIVE_PATH ?? 'typeorm.dht-node.log',
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
  ...constants,
  ...server,
  ...database,
  ...community,
  ...federation,
}
validate(schema, CONFIG)
