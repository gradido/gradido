// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const version = {
  ADMIN_MODULE_PROTOCOL: process.env.ADMIN_MODULE_PROTOCOL ?? 'http',
  ADMIN_MODULE_HOST: process.env.ADMIN_MODULE_HOST ?? '0.0.0.0',
  ADMIN_MODULE_PORT: process.env.ADMIN_MODULE_PORT ?? '8080',
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT ?? undefined,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT ?? '0000000').slice(0, 7),
}

let ADMIN_MODULE_URL
// in case of hosting the admin module with a nodejs-instance
if (process.env.ADMIN_HOSTING === 'nodejs') {
  ADMIN_MODULE_URL =
    version.ADMIN_MODULE_PROTOCOL +
    '://' +
    version.ADMIN_MODULE_HOST +
    ':' +
    version.ADMIN_MODULE_PORT
} else {
  // in case of hosting the admin module with a nginx
  ADMIN_MODULE_URL = version.ADMIN_MODULE_PROTOCOL + '://' + version.ADMIN_MODULE_HOST
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production',
  PRODUCTION: process.env.NODE_ENV === 'production',
}

// const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? undefined
// const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
// const COMMUNITY_URL =
//   COMMUNITY_HOST && URL_PROTOCOL ? URL_PROTOCOL + '://' + COMMUNITY_HOST : undefined
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? ADMIN_MODULE_URL
const WALLET_URL = process.env.WALLET_URL ?? COMMUNITY_URL ?? 'http://0.0.0.0'

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URL ?? COMMUNITY_URL + (process.env.GRAPHQL_PATH ?? '/graphql'),
  WALLET_AUTH_URL: WALLET_URL + (process.env.WALLET_AUTH_PATH ?? '/authenticate?token='),
  WALLET_LOGIN_URL: WALLET_URL + (process.env.WALLET_LOGIN_PATH ?? '/login'),
}

const debug = {
  DEBUG_DISABLE_AUTH: process.env.DEBUG_DISABLE_AUTH === 'true',
}
const humhub = {
  HUMHUB_ACTIVE: process.env.HUMHUB_ACTIVE === 'true',
  HUMHUB_API_URL: process.env.HUMHUB_API_URL ?? COMMUNITY_URL + '/community/',
}

const OPENAI_ACTIVE = process.env.OPENAI_ACTIVE === 'true'

const CONFIG = {
  ...version,
  ...environment,
  ...endpoints,
  ...debug,
  OPENAI_ACTIVE,
  ...humhub,
  ADMIN_MODULE_URL,
  COMMUNITY_URL,
}

module.exports = CONFIG
