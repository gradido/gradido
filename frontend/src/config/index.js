// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const constants = {
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
}

const version = {
  FRONTEND_MODULE_PROTOCOL: process.env.FRONTEND_MODULE_PROTOCOL ?? 'http',
  FRONTEND_MODULE_HOST: process.env.FRONTEND_MODULE_HOST ?? '0.0.0.0',
  FRONTEND_MODULE_PORT: process.env.FRONTEND_MODULE_PORT ?? '3000',
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT ?? undefined,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT ?? '0000000').slice(0, 7),
}

let FRONTEND_MODULE_URL

// in case of hosting the frontend module with a nodejs-instance
if (process.env.FRONTEND_HOSTING === 'nodejs') {
  FRONTEND_MODULE_URL =
    version.FRONTEND_MODULE_PROTOCOL +
    '://' +
    version.FRONTEND_MODULE_HOST +
    ':' +
    version.FRONTEND_MODULE_PORT
} else {
  // in case of hosting the frontend module with a nginx
  FRONTEND_MODULE_URL = version.FRONTEND_MODULE_PROTOCOL + '://' + version.FRONTEND_MODULE_HOST
}

// const FRONTEND_MODULE_URI = version.FRONTEND_MODULE_PROTOCOL + '://' + version.FRONTEND_MODULE_HOST // +
// ':' +
// version.FRONTEND_MODULE_PORT

const features = {
  DLT_ACTIVE: process.env.DLT_ACTIVE === 'true',
  GMS_ACTIVE: process.env.GMS_ACTIVE === 'true',
  HUMHUB_ACTIVE: process.env.HUMHUB_ACTIVE === 'true',
  AUTO_POLL_INTERVAL: Number.parseInt(process.env.AUTO_POLL_INTERVAL ?? 0),
  CROSS_TX_REDEEM_LINK_ACTIVE: process.env.CROSS_TX_REDEEM_LINK_ACTIVE === 'true',
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production',
  PRODUCTION: process.env.NODE_ENV === 'production',
}

// const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? 'localhost'
// const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? FRONTEND_MODULE_URL

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URI ?? COMMUNITY_URL + (process.env.GRAPHQL_PATH ?? '/graphql'),
  ADMIN_AUTH_URL:
    process.env.ADMIN_AUTH_URL ??
    COMMUNITY_URL + (process.env.ADMIN_AUTH_PATH ?? '/admin/authenticate?token='),
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME ?? 'Gradido Entwicklung',
  COMMUNITY_URL,
  COMMUNITY_REGISTER_URL: COMMUNITY_URL + (process.env.COMMUNITY_REGISTER_PATH ?? '/register'),
  COMMUNITY_DESCRIPTION:
    process.env.COMMUNITY_DESCRIPTION ?? 'Die lokale Entwicklungsumgebung von Gradido.',
  COMMUNITY_SUPPORT_MAIL: process.env.COMMUNITY_SUPPORT_MAIL ?? 'support@supportmail.com',
  COMMUNITY_LOCATION: process.env.COMMUNITY_LOCATION ?? '49.280377, 9.690151',
}

const meta = {
  META_URL: process.env.META_URL ?? 'http://localhost',
  META_TITLE_DE: process.env.META_TITLE_DE ?? 'Gradido – Dein Dankbarkeitskonto',
  META_TITLE_EN: process.env.META_TITLE_EN ?? 'Gradido - Your gratitude account',
  META_DESCRIPTION_DE:
    process.env.META_DESCRIPTION_DE ??
    'Dankbarkeit ist die Währung der neuen Zeit. Immer mehr Menschen entfalten ihr Potenzial und gestalten eine gute Zukunft für alle.',
  META_DESCRIPTION_EN:
    process.env.META_DESCRIPTION_EN ??
    'Gratitude is the currency of the new age. More and more people are unleashing their potential and shaping a good future for all.',
  META_KEYWORDS_DE:
    process.env.META_KEYWORDS_DE ??
    'Grundeinkommen, Währung, Dankbarkeit, Schenk-Ökonomie, Natürliche Ökonomie des Lebens, Ökonomie, Ökologie, Potenzialentfaltung, Schenken und Danken, Kreislauf des Lebens, Geldsystem',
  META_KEYWORDS_EN:
    process.env.META_KEYWORDS_EN ??
    'Basic Income, Currency, Gratitude, Gift Economy, Natural Economy of Life, Economy, Ecology, Potential Development, Giving and Thanking, Cycle of Life, Monetary System',
  META_AUTHOR: process.env.META_AUTHOR ?? 'Bernd Hückstädt - Gradido-Akademie',
}

const CONFIG = {
  ...version,
  ...features,
  ...environment,
  ...endpoints,
  ...community,
  ...meta,
  ...constants,
  FRONTEND_MODULE_URL,
}

module.exports = CONFIG
