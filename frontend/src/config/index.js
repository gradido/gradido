// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

// Load Package Details for some default values
const pkg = require('../../package')

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
  ALLOW_REGISTER: process.env.ALLOW_REGISTER !== 'false',
}

const server = {
  LOGIN_API_URL: process.env.LOGIN_API_URL || 'http://localhost/login_api/',
  COMMUNITY_API_URL: process.env.COMMUNITY_API_URL || 'http://localhost/api/',
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost:4000/graphql',
}

// eslint-disable-next-line no-console
console.log('hash: %o', process.env.VUE_APP_BUILD_COMMIT)

const CONFIG = {
  ...environment,
  ...server,
  APP_VERSION: pkg.version,
  COMMIT_HASH:
    process.env.VUE_APP_BUILD_COMMIT === 'undefined'
      ? '00000000'
      : process.env.VUE_APP_BUILD_COMMIT,
}

export default CONFIG
