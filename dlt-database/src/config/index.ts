/* eslint-disable n/no-process-env */

import dotenv from 'dotenv'

dotenv.config()

const constants = {
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v1.2022-08-22',
    CURRENT: '',
  },
}

const database = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_dlt',
}

const migrations = {
  MIGRATIONS_TABLE: process.env.MIGRATIONS_TABLE || 'migrations',
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

export const CONFIG = { ...constants, ...database, ...migrations }
