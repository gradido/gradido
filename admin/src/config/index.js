// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

const { parseConfig } = require('config-schema/schema')
// Load Package Details for some default values
const pkg = require('../../package')
const { schema } = require('./schema')

// Read twice: by vite.config.mjs on the server that builds, and again in the browser. Each
// `process.env.<NAME>` has to stay a static property access, because Vite replaces every
// one listed in vite.config.mjs with its value at build time, and leaves the others
// undefined. A listed variable without a value arrives as null, which counts as not set.
const env = (value) => value ?? undefined

const CONFIG = parseConfig(schema, {
  NODE_ENV: env(process.env.NODE_ENV),
  ADMIN_HOSTING: env(process.env.ADMIN_HOSTING),
  ADMIN_MODULE_PROTOCOL: env(process.env.ADMIN_MODULE_PROTOCOL),
  ADMIN_MODULE_HOST: env(process.env.ADMIN_MODULE_HOST),
  ADMIN_MODULE_PORT: env(process.env.ADMIN_MODULE_PORT),
  APP_VERSION: pkg.version,
  BUILD_COMMIT: env(process.env.BUILD_COMMIT),
  COMMUNITY_URL: env(process.env.COMMUNITY_URL),
  WALLET_URL: env(process.env.WALLET_URL),
  GRAPHQL_URL: env(process.env.GRAPHQL_URL),
  GRAPHQL_PATH: env(process.env.GRAPHQL_PATH),
  WALLET_AUTH_PATH: env(process.env.WALLET_AUTH_PATH),
  WALLET_LOGIN_PATH: env(process.env.WALLET_LOGIN_PATH),
  DEBUG_DISABLE_AUTH: env(process.env.DEBUG_DISABLE_AUTH),
  HUMHUB_ACTIVE: env(process.env.HUMHUB_ACTIVE),
  HUMHUB_API_URL: env(process.env.HUMHUB_API_URL),
  ANTHROPIC_ACTIVE: env(process.env.ANTHROPIC_ACTIVE),
  COMMUNITY_NAME: env(process.env.COMMUNITY_NAME),
})

module.exports = CONFIG
