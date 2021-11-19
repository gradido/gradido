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
  DEFAULT_PUBLISHER_ID: process.env.DEFAULT_PUBLISHER_ID || 2896,
}

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost:4000/graphql',
  // TODO port
  ADMIN_AUTH_URL: process.env.ADMIN_AUTH_URL || 'http://localhost:8080/admin/authenticate?token=$1'
}

const options = {}

const CONFIG = {
  ...version,
  ...environment,
  ...endpoints,
  ...options,
}

export default CONFIG
