import dotenv from 'dotenv'

dotenv.config()

const constants = {
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v1.2022-03-18',
    CURRENT: '',
  },
  LOG4JS_CATEGORY_NAME: 'database'
}

const database = {
  DB_CONNECT_RETRY_COUNT: process.env.DB_CONNECT_RETRY_COUNT
    ? Number.parseInt(process.env.DB_CONNECT_RETRY_COUNT)
    : 15,
  DB_CONNECT_RETRY_DELAY_MS: process.env.DB_CONNECT_RETRY_DELAY_MS
    ? Number.parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS)
    : 500,
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ? Number.parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_DATABASE: process.env.DB_DATABASE ?? 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH: process.env.TYPEORM_LOGGING_RELATIVE_PATH ?? 'typeorm.database.log',
  TYPEORM_LOGGING_ACTIVE: process.env.TYPEORM_LOGGING_ACTIVE === 'true' || false,
}

const migrations = {
  MIGRATIONS_TABLE: process.env.MIGRATIONS_TABLE || 'migrations',
}

const nodeEnv = process.env.NODE_ENV || 'development'

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

export const CONFIG = { ...constants, ...database, ...migrations, NODE_ENV: nodeEnv }
