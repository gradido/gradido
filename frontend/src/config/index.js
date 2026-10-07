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
  FRONTEND_HOSTING: env(process.env.FRONTEND_HOSTING),
  FRONTEND_MODULE_PROTOCOL: env(process.env.FRONTEND_MODULE_PROTOCOL),
  FRONTEND_MODULE_HOST: env(process.env.FRONTEND_MODULE_HOST),
  FRONTEND_MODULE_PORT: env(process.env.FRONTEND_MODULE_PORT),
  APP_VERSION: pkg.version,
  BUILD_COMMIT: env(process.env.BUILD_COMMIT),
  DLT_ACTIVE: env(process.env.DLT_ACTIVE),
  GMS_ACTIVE: env(process.env.GMS_ACTIVE),
  GMS_LEGACY_ACTIVE: env(process.env.GMS_LEGACY_ACTIVE),
  MATCHING_ACTIVE: env(process.env.MATCHING_ACTIVE),
  HUMHUB_ACTIVE: env(process.env.HUMHUB_ACTIVE),
  AUTO_POLL_INTERVAL: env(process.env.AUTO_POLL_INTERVAL),
  CROSS_TX_REDEEM_LINK_ACTIVE: env(process.env.CROSS_TX_REDEEM_LINK_ACTIVE),
  COMMUNITY_URL: env(process.env.COMMUNITY_URL),
  GRAPHQL_URI: env(process.env.GRAPHQL_URI),
  GRAPHQL_PATH: env(process.env.GRAPHQL_PATH),
  ADMIN_AUTH_URL: env(process.env.ADMIN_AUTH_URL),
  ADMIN_AUTH_PATH: env(process.env.ADMIN_AUTH_PATH),
  COMMUNITY_NAME: env(process.env.COMMUNITY_NAME),
  COMMUNITY_REGISTER_PATH: env(process.env.COMMUNITY_REGISTER_PATH),
  COMMUNITY_DESCRIPTION: env(process.env.COMMUNITY_DESCRIPTION),
  COMMUNITY_SUPPORT_MAIL: env(process.env.COMMUNITY_SUPPORT_MAIL),
  COMMUNITY_LOCATION: env(process.env.COMMUNITY_LOCATION),
  MAP_TILES_URL: env(process.env.MAP_TILES_URL),
  MAP_ASSETS_URL: env(process.env.MAP_ASSETS_URL),
  META_URL: env(process.env.META_URL),
  META_AUTHOR: env(process.env.META_AUTHOR),
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
})

module.exports = CONFIG
