const {
  APP_VERSION,
  BUILD_COMMIT,
  booleanSchema,
  COMMUNITY_DESCRIPTION,
  COMMUNITY_LOCATION,
  COMMUNITY_NAME,
  COMMUNITY_SUPPORT_MAIL,
  COMMUNITY_URL,
  configRule,
  DLT_ACTIVE,
  decayStartTimeSchema,
  GMS_ACTIVE,
  GRAPHQL_URI,
  HUMHUB_ACTIVE,
  hostSchema,
  httpUrlSchema,
  integerSchema,
  MATCHING_ACTIVE,
  NODE_ENV,
  nonEmptyStringSchema,
  portSchema,
} = require('config-schema/schema')
const v = require('valibot')

// What the environment can set, and the value used where it does not. index.js hands the
// variables over one by one, so the keys are the variable names. The URLs are put together
// from COMMUNITY_URL and a path in the transform at the end.

// the path behind COMMUNITY_URL a link is built from
const pathSchema = (description) => v.pipe(v.string(), v.description(description))

const flagSchema = (description) =>
  v.optional(v.pipe(booleanSchema, v.description(description)), false)

const environment = v.object({
  NODE_ENV,

  FRONTEND_HOSTING: v.optional(
    v.pipe(
      v.picklist(['nodejs', 'nginx']),
      v.description('set to `nodejs` if frontend is hosted by vite with a own nodejs instance'),
    ),
  ),
  FRONTEND_MODULE_PROTOCOL: v.optional(
    v.pipe(
      v.picklist(['http', 'https']),
      v.description(
        `
      Protocol for frontend module hosting
      - it has to be the same as for backend api url and admin to prevent mixed block errors,
      - if frontend is served with nodejs:
          is have to be http or setup must be updated to include a ssl certificate
      `,
      ),
    ),
    'http',
  ),
  FRONTEND_MODULE_HOST: v.optional(
    v.pipe(
      hostSchema,
      v.description(
        'Host (domain, IPv4, or localhost) for the frontend, default is 0.0.0.0 for local hosting during development.',
      ),
    ),
    '0.0.0.0',
  ),
  FRONTEND_MODULE_PORT: v.optional(
    v.pipe(
      portSchema,
      v.description('Port for hosting Frontend with Vite as a Node.js instance, default: 3000'),
    ),
    3000,
  ),
  APP_VERSION,
  BUILD_COMMIT: v.optional(BUILD_COMMIT),

  DLT_ACTIVE: v.optional(DLT_ACTIVE, false),
  GMS_ACTIVE: v.optional(GMS_ACTIVE, false),
  GMS_LEGACY_ACTIVE: flagSchema('if legacy gradido mapping service should be used'),
  MATCHING_ACTIVE: v.optional(MATCHING_ACTIVE, false),
  HUMHUB_ACTIVE: v.optional(HUMHUB_ACTIVE, false),
  AUTO_POLL_INTERVAL: v.optional(
    v.pipe(
      integerSchema,
      v.minValue(0),
      v.maxValue(600000),
      v.description('Auto Polling for new data in ms. 0 = disabled = default. Experimental!'),
    ),
    0,
  ),
  CROSS_TX_REDEEM_LINK_ACTIVE: flagSchema('Enable cross-community redeem links'),

  COMMUNITY_URL: v.optional(COMMUNITY_URL),
  GRAPHQL_URI: v.optional(GRAPHQL_URI),
  GRAPHQL_PATH: v.optional(
    pathSchema('Path of the backend api, behind COMMUNITY_URL where GRAPHQL_URI is not set'),
    '/graphql',
  ),
  ADMIN_AUTH_URL: v.optional(v.pipe(httpUrlSchema, v.description('Extern Url for admin-frontend'))),
  ADMIN_AUTH_PATH: v.optional(
    pathSchema('Path of the admin login, behind COMMUNITY_URL where ADMIN_AUTH_URL is not set'),
    '/admin/authenticate?token=',
  ),

  COMMUNITY_NAME: v.optional(COMMUNITY_NAME, 'Gradido Entwicklung'),
  COMMUNITY_REGISTER_PATH: v.optional(
    pathSchema('Path for registering a new account, behind COMMUNITY_URL'),
    '/register',
  ),
  COMMUNITY_DESCRIPTION: v.optional(
    COMMUNITY_DESCRIPTION,
    'Die lokale Entwicklungsumgebung von Gradido.',
  ),
  COMMUNITY_SUPPORT_MAIL: v.optional(COMMUNITY_SUPPORT_MAIL, 'support@supportmail.com'),
  COMMUNITY_LOCATION: v.optional(COMMUNITY_LOCATION, '49.280377, 9.690151'),

  // Gradido's own map server: the tile file, and its fonts and sprites next to it
  MAP_TILES_URL: v.optional(
    v.pipe(
      httpUrlSchema,
      v.description('URL of the PMTiles file the wallet reads place names from'),
    ),
    'https://maptiles.gradido.net/planet.pmtiles',
  ),
  MAP_ASSETS_URL: v.optional(
    v.pipe(
      httpUrlSchema,
      v.description('Base URL of the fonts/ and sprites/ that belong to the map tiles'),
    ),
    'https://maptiles.gradido.net',
  ),

  META_URL: v.optional(
    v.pipe(httpUrlSchema, v.description('The base URL for the meta tags.')),
    'http://localhost',
  ),
  META_AUTHOR: v.optional(
    v.pipe(nonEmptyStringSchema, v.description('The author for the meta tags.')),
    'Bernd Hückstädt - Gradido-Akademie',
  ),

  DECAY_START_TIME: decayStartTimeSchema,
})

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
 * ✅ Should a community ever want its own wording, it is three lines back: read them from
 * the environment above and hand the names through `frontend/.env.template`. Nobody has
 * wanted it in the four years these have existed.
 *
 * `META_URL` and `META_AUTHOR` stay in the environment: the first genuinely differs per
 * server (it is built from the host), and the second names whoever runs it.
 */
const meta = {
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
}

const schema = v.pipe(
  environment,
  v.transform((env) => {
    // with its own nodejs instance the frontend answers on a port, behind nginx it does not
    const FRONTEND_MODULE_URL =
      env.FRONTEND_HOSTING === 'nodejs'
        ? `${env.FRONTEND_MODULE_PROTOCOL}://${env.FRONTEND_MODULE_HOST}:${env.FRONTEND_MODULE_PORT}`
        : `${env.FRONTEND_MODULE_PROTOCOL}://${env.FRONTEND_MODULE_HOST}`
    const COMMUNITY_URL = env.COMMUNITY_URL ?? FRONTEND_MODULE_URL
    return {
      ...env,
      ...meta,
      DEBUG: env.NODE_ENV !== 'production',
      PRODUCTION: env.NODE_ENV === 'production',
      BUILD_COMMIT_SHORT: (env.BUILD_COMMIT ?? '0000000').slice(0, 7),
      FRONTEND_MODULE_URL,
      COMMUNITY_URL,
      GRAPHQL_URI: env.GRAPHQL_URI ?? COMMUNITY_URL + env.GRAPHQL_PATH,
      ADMIN_AUTH_URL: env.ADMIN_AUTH_URL ?? COMMUNITY_URL + env.ADMIN_AUTH_PATH,
      COMMUNITY_REGISTER_URL: COMMUNITY_URL + env.COMMUNITY_REGISTER_PATH,
    }
  }),
  // https only behind nginx: served by vite's own node instance, the frontend cannot offer it
  configRule(
    'FRONTEND_MODULE_PROTOCOL',
    (config) => config.FRONTEND_HOSTING === 'nginx' || config.FRONTEND_MODULE_PROTOCOL === 'http',
    'FRONTEND_MODULE_PROTOCOL must be http unless FRONTEND_HOSTING is nginx',
  ),
)

module.exports = { schema }
