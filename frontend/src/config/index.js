// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const version = {
  APP_VERSION: pkg.version,
  BUILD_COMMIT:
    process.env.BUILD_COMMIT ||
    // the check for undefined is because of a conflict between webpack-dotenv and vue cli env filtering
    (process.env.VUE_APP_BUILD_COMMIT !== 'undefined' ? process.env.VUE_APP_BUILD_COMMIT : null) ||
    null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (
    process.env.BUILD_COMMIT ||
    (process.env.VUE_APP_BUILD_COMMIT !== 'undefined' ? process.env.VUE_APP_BUILD_COMMIT : null) ||
    '0000000'
  ).substr(0, 7),
  // unused
  // BUILD_DATE: process.env.BUILD_DATE || process.env.VUE_APP_BUILD_DATE || '1970-01-01T00:00:00.00Z',
  // BUILD_VERSION: process.env.BUILD_VERSION || process.env.VUE_APP_BUILD_VERSION || '0.0.0.0',
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const server = {
  LOGIN_API_URL: process.env.LOGIN_API_URL || 'http://localhost/login_api/',
  COMMUNITY_API_URL: process.env.COMMUNITY_API_URL || 'http://localhost/api/',
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost:4000/graphql',
}

const options = {
  ALLOW_REGISTER: process.env.ALLOW_REGISTER !== 'false',
}

const CONFIG = {
  ...version,
  ...environment,
  ...server,
  ...options,
}

export default CONFIG
