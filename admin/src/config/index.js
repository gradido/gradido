// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const version = {
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT || null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT || '0000000').substr(0, 7),
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost:4000/graphql',
  WALLET_AUTH_URL: process.env.WALLET_AUTH_URL || 'http://localhost/authenticate?token=$1',
  WALLET_URL: process.env.WALLET_URL || 'http://localhost/login',
}

const debug = {
  DEBUG_DISABLE_AUTH: process.env.DEBUG_DISABLE_AUTH === 'true' || false,
}

const options = {}

const CONFIG = {
  ...version,
  ...environment,
  ...endpoints,
  ...options,
  ...debug,
}

export default CONFIG
