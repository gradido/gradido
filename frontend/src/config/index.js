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
  GMS_LEGACY_ACTIVE: process.env.GMS_LEGACY_ACTIVE === 'true',
  MATCHING_ACTIVE: process.env.MATCHING_ACTIVE === 'true',
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

// Gradido's own map server: the tile file, and its fonts and sprites next to it
const map = {
  MAP_TILES_URL: process.env.MAP_TILES_URL ?? 'https://maptiles.gradido.net/planet.pmtiles',
  MAP_ASSETS_URL: process.env.MAP_ASSETS_URL ?? 'https://maptiles.gradido.net',
}

/**
 * What a link preview of this wallet says about it.
 *
 * ⛔ The title, description and keywords are NOT read from the environment, and that is
 * the point of this block. They are the product's own words -- the same on every server --
 * while an environment variable is per-server configuration. The difference is not
 * academic: a server keeps its OWN `.env`, `.env.dist` is only the template it was once
 * copied from, and `frontend/.env.template` used to carry these six names straight through
 * from there. So changing the words here changed nothing anywhere: every server went on
 * serving what its own file said, until somebody with shell access edited all of them by
 * hand. Measured on 20.09.2026, ki-playground and stage1 served byte-identical texts -- the
 * knob had never once been turned, and it was the only thing standing between a decided
 * wording and the people reading it.
 *
 * ✅ Should a community ever want its own wording, it is three lines back: read
 * `process.env` here again and hand the names through `frontend/.env.template`. Nobody has
 * wanted it in the four years these have existed.
 *
 * `META_URL` and `META_AUTHOR` stay in the environment: the first genuinely differs per
 * server (it is built from the host), and the second names whoever runs it.
 */
const meta = {
  META_URL: process.env.META_URL ?? 'http://localhost',
  META_TITLE_DE: 'Gradido – Helfen. Schenken. Danken.',
  META_TITLE_EN: 'Gradido – Help. Give. Thank.',
  META_DESCRIPTION_DE:
    'Ein Netzwerk von Menschen, die einander helfen, beschenken und danken. Kostenfrei. Gemeinschaftsbasiert. Open Source.',
  META_DESCRIPTION_EN:
    'A network of people who help, give to and thank each other. Free of charge. Community-based. Open source.',
  META_KEYWORDS_DE:
    'Helfen, Schenken, Danken, Gemeinschaft, Nachbarschaft, Ehrenamt, Gemeinwohl, Dankbarkeit',
  META_KEYWORDS_EN:
    'Helping, Giving, Thanking, Community, Neighbourhood, Volunteering, Common Good, Gratitude',
  META_AUTHOR: process.env.META_AUTHOR ?? 'Bernd Hückstädt - Gradido-Akademie',
}

const CONFIG = {
  ...version,
  ...features,
  ...environment,
  ...endpoints,
  ...community,
  ...map,
  ...meta,
  ...constants,
  FRONTEND_MODULE_URL,
}

module.exports = CONFIG
