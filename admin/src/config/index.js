// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const constants = {
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v2.2024-01-04',
    CURRENT: '',
  },
}

const version = {
  APP_VERSION: pkg.version,
  BUILD_COMMIT: import.meta.env.BUILD_COMMIT ?? null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (import.meta.env.BUILD_COMMIT ?? '0000000').slice(0, 7),
  PORT: import.meta.env.PORT ?? 8080,
}

const environment = {
  NODE_ENV: import.meta.env.NODE_ENV,
  DEBUG: import.meta.env.NODE_ENV !== 'production' ?? false,
  PRODUCTION: import.meta.env.NODE_ENV === 'production' ?? false,
}

const COMMUNITY_HOST = import.meta.env.COMMUNITY_HOST ?? undefined
const URL_PROTOCOL = import.meta.env.URL_PROTOCOL ?? 'http'
const COMMUNITY_URL =
  COMMUNITY_HOST && URL_PROTOCOL ? URL_PROTOCOL + '://' + COMMUNITY_HOST : undefined
const WALLET_URL = import.meta.env.WALLET_URL ?? COMMUNITY_URL ?? 'http://localhost'

const endpoints = {
  GRAPHQL_URL:
    (import.meta.env.GRAPHQL_URL ?? COMMUNITY_URL ?? 'http://localhost:4000') +
      import.meta.env.GRAPHQL_PATH ?? '/graphql',
  WALLET_AUTH_URL: WALLET_URL + (import.meta.env.WALLET_AUTH_PATH ?? '/authenticate?token={token}'),
  WALLET_LOGIN_URL: WALLET_URL + (import.meta.env.WALLET_LOGIN_PATH ?? '/login'),
}

const debug = {
  DEBUG_DISABLE_AUTH: import.meta.env.DEBUG_DISABLE_AUTH === 'true' ?? false,
}

// Check config version
constants.CONFIG_VERSION.CURRENT =
  import.meta.env.CONFIG_VERSION ?? constants.CONFIG_VERSION.DEFAULT
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

export default CONFIG
