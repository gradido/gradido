// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

// Load Package Details for some default values
// const pkg = require('../../package')

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const server = {
  LOGIN_API_URL: process.env.LOGIN_API_URL || 'http://localhost/login_api/',
  COMMUNITY_API_STATE_BALANCE_URL: process.env.COMMUNITY_API_STATE_BALANCE_URL || 'http://localhost/state-balances/',
  COMMUNITY_API_TRANSACTION_CREATION_URL: process.env.COMMUNITY_API_TRANSACTION_CREATION_URL || 'http://localhost/transaction-creations/',
}

const CONFIG = {
  ...environment,
  ...server,
}

export default CONFIG
