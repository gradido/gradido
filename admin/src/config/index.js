// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const constants = {
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v3.2024-08-06',
    CURRENT: '',
  },
}

const version = {
  ADMIN_MODULE_PROTOCOL: process.env.ADMIN_MODULE_PROTOCOL ?? 'http',
  ADMIN_MODULE_HOST: process.env.ADMIN_MODULE_HOST ?? 'localhost',
  ADMIN_MODULE_PORT: process.env.ADMIN_MODULE_PORT ?? '8080',
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT ?? null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT ?? '0000000').slice(0, 7),
}

const ADMIN_MODULE_URL =
  version.ADMIN_MODULE_PROTOCOL +
  '://' +
  version.ADMIN_MODULE_HOST +
  ':' +
  version.ADMIN_MODULE_PORT

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' ?? false,
  PRODUCTION: process.env.NODE_ENV === 'production' ?? false,
}

// const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? undefined
// const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
// const COMMUNITY_URL =
//   COMMUNITY_HOST && URL_PROTOCOL ? URL_PROTOCOL + '://' + COMMUNITY_HOST : undefined
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? `${ADMIN_MODULE_URL}`
const WALLET_URL = process.env.WALLET_URL ?? COMMUNITY_URL ?? 'http://localhost'

const endpoints = {
  GRAPHQL_URL:
    (process.env.GRAPHQL_URL ?? COMMUNITY_URL ?? 'http://localhost:4000') +
      process.env.GRAPHQL_PATH ?? '/graphql',
  WALLET_AUTH_URL: WALLET_URL + (process.env.WALLET_AUTH_PATH ?? '/authenticate?token={token}'),
  WALLET_LOGIN_URL: WALLET_URL + (process.env.WALLET_LOGIN_PATH ?? '/login'),
}

const debug = {
  DEBUG_DISABLE_AUTH: process.env.DEBUG_DISABLE_AUTH === 'true' ?? false,
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

const CONFIG = {
  ...constants,
  ...version,
  ...environment,
  ...endpoints,
  ...debug,
}

module.exports = CONFIG
