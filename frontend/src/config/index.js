// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const constants = {
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v2.2022-04-07',
    CURRENT: '',
  },
}

const version = {
  APP_VERSION: pkg.version,
  BUILD_COMMIT: process.env.BUILD_COMMIT || null,
  // self reference of `version.BUILD_COMMIT` is not possible at this point, hence the duplicate code
  BUILD_COMMIT_SHORT: (process.env.BUILD_COMMIT || '0000000').slice(0, 7),
}

const environment = {
  NODE_ENV: process.env.NODE_ENV,
  DEBUG: process.env.NODE_ENV !== 'production' || false,
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
  DEFAULT_PUBLISHER_ID: process.env.DEFAULT_PUBLISHER_ID || 2896,
  PORT: process.env.PORT || 3000,
}

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost/graphql',
  ADMIN_AUTH_URL: process.env.ADMIN_AUTH_URL || 'http://localhost/admin/authenticate?token={token}',
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME || 'Gradido Entwicklung',
  COMMUNITY_URL: process.env.COMMUNITY_URL || 'http://localhost/',
  COMMUNITY_REGISTER_URL: process.env.COMMUNITY_REGISTER_URL || 'http://localhost/register',
  COMMUNITY_DESCRIPTION:
    process.env.COMMUNITY_DESCRIPTION || 'Die lokale Entwicklungsumgebung von Gradido.',
}

const meta = {
  META_URL: process.env.META_URL || 'http://localhost',
  META_TITLE_DE: process.env.META_TITLE_DE || 'Gradido – Dein Dankbarkeitskonto',
  META_TITLE_EN: process.env.META_TITLE_EN || 'Gradido - Your gratitude account',
  META_DESCRIPTION_DE:
    process.env.META_DESCRIPTION_DE ||
    'Dankbarkeit ist die Währung der neuen Zeit. Immer mehr Menschen entfalten ihr Potenzial und gestalten eine gute Zukunft für alle. Achtung: Jeder kann diesen Link einlösen. Gib ihn bitte nicht weiter!',
  META_DESCRIPTION_EN:
    process.env.META_DESCRIPTION_EN ||
    'Gratitude is the currency of the new age. More and more people are unleashing their potential and shaping a good future for all. Attention: Anyone can redeem this link. Please do not share it!',
  META_KEYWORDS_DE:
    process.env.META_KEYWORDS_DE ||
    'Grundeinkommen, Währung, Dankbarkeit, Schenk-Ökonomie, Natürliche Ökonomie des Lebens, Ökonomie, Ökologie, Potenzialentfaltung, Schenken und Danken, Kreislauf des Lebens, Geldsystem',
  META_KEYWORDS_EN:
    process.env.META_KEYWORDS_EN ||
    'Basic Income, Currency, Gratitude, Gift Economy, Natural Economy of Life, Economy, Ecology, Potential Development, Giving and Thanking, Cycle of Life, Monetary System',
  META_AUTHOR: process.env.META_AUTHOR || 'Bernd Hückstädt - Gradido-Akademie',
}

// Check config version
constants.CONFIG_VERSION.CURRENT = process.env.CONFIG_VERSION || constants.CONFIG_VERSION.DEFAULT
if (
  ![constants.CONFIG_VERSION.EXPECTED, constants.CONFIG_VERSION.DEFAULT].includes(
    constants.CONFIG_VERSION.CURRENT,
  )
) {
  throw new Error(
    `Fatal: Config Version incorrect - expected "${constants.CONFIG_VERSION.EXPECTED}" or "${constants.CONFIG_VERSION.DEFAULT}", but found "${constants.CONFIG_VERSION.CURRENT}"`,
  )
}

const CONFIG = {
  ...constants,
  ...version,
  ...environment,
  ...endpoints,
  ...community,
  ...meta,
}

module.exports = CONFIG
