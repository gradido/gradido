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
}

const CONFIG = {
  ...environment,
  ...server,
  APP_VERSION: pkg.version,
}

export default CONFIG
