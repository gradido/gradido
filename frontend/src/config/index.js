// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env).
//            The whole contents is exposed to the client

// Load Package Details for some default values
const pkg = require('../../package')

const constants = {
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v1.2022-03-18',
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

const meta = {
  META_URL: process.env.META_URL || 'http://localhost',
  META_TITLE_DE: process.env.META_TITLE_DE || 'Gradido – Dein Dankbarkeitskonto',
  META_TITLE_EN: process.env.META_TITLE_EN || 'Gradido - Your gratitude account',
  META_DESCRIPTION_DE:
    process.env.META_DESCRIPTION_DE ||
    'Dankbarkeit ist die Währung der neuen Zeit. Immer mehr Menschen entfalten ihr Potenzial und gestalten eine gute Zukunft für alle.',
  META_DESCRIPTION_EN:
    process.env.META_DESCRIPTION_EN ||
    'Gratitude is the currency of the new age. More and more people are unleashing their potential and shaping a good future for all.',
  META_KEYWORDS_DE:
    process.env.META_KEYWORDS_DE ||
    'Grundeinkommen, Währung, Dankbarkeit, Schenk-Ökonomie, Natürliche Ökonomie des Lebens, Ökonomie, Ökologie, Potenzialentfaltung, Schenken und Danken, Kreislauf des Lebens, Geldsystem',
  META_KEYWORDS_EN:
    process.env.META_KEYWORDS_EN ||
    'Basic Income, Currency, Gratitude, Gift Economy, Natural Economy of Life, Economy, Ecology, Potential Development, Giving and Thanking, Cycle of Life, Monetary System',
  META_AUTHOR: process.env.META_AUTHOR || 'Bernd Hückstädt - Gradido-Akademie',
}

const endpoints = {
  GRAPHQL_URI: process.env.GRAPHQL_URI || 'http://localhost/graphql',
  ADMIN_AUTH_URL: process.env.ADMIN_AUTH_URL || 'http://localhost/admin/authenticate?token={token}',
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
  ...meta,
}

module.exports = CONFIG
