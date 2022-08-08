// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const constants = {
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v1.2022-03-18',
    CURRENT: '',
  },
}

const version = {
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT || null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT || '0000000').slice(0, 7),
  PORT: process.env.PORT || 8080,
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost:4000/graphql',
  WALLET_AUTH_URL: process.env.WALLET_AUTH_URL || 'http://localhost/authenticate?token={token}',
  WALLET_URL: process.env.WALLET_URL || 'http://localhost/login',
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME || 'Gradido Entwicklung',
}

const debug = {
  DEBUG_DISABLE_AUTH: process.env.DEBUG_DISABLE_AUTH === 'true' || false,
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
  ...version,
  ...environment,
  ...endpoints,
  ...community,
  ...debug,
}

module.exports = CONFIG
