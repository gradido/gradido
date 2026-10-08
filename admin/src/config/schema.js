const {
  ANTHROPIC_ACTIVE,
  APP_VERSION,
  BUILD_COMMIT,
  booleanSchema,
  COMMUNITY_NAME,
  COMMUNITY_URL,
  configRule,
  GRAPHQL_URI,
  HUMHUB_ACTIVE,
  HUMHUB_API_URL,
  hostSchema,
  httpUrlSchema,
  NODE_ENV,
  portSchema,
} = require('config-schema/schema')
const v = require('valibot')

// What the environment can set, and the value used where it does not. index.js hands the
// variables over one by one, so the keys are the variable names. The URLs are put together
// from COMMUNITY_URL, WALLET_URL and a path in the transform at the end.

// the path behind a base URL a link is built from
const pathSchema = (description) => v.pipe(v.string(), v.description(description))

const environment = v.object({
  NODE_ENV,

  ADMIN_HOSTING: v.optional(
    v.pipe(
      v.picklist(['nodejs', 'nginx']),
      v.description('set to `nodejs` if admin is hosted by vite with a own nodejs instance'),
    ),
  ),
  ADMIN_MODULE_PROTOCOL: v.optional(
    v.pipe(
      v.picklist(['http', 'https']),
      v.description(
        `
      Protocol for admin module hosting
      - it has to be the same as for backend api url and frontend to prevent mixed block errors,
      - if admin is served with nodejs:
          is have to be http or setup must be updated to include a ssl certificate
      `,
      ),
    ),
    'http',
  ),
  ADMIN_MODULE_HOST: v.optional(
    v.pipe(
      hostSchema,
      v.description(
        'Host (domain, IPv4, or localhost) for the admin, default is 0.0.0.0 for local hosting during develop',
      ),
    ),
    '0.0.0.0',
  ),
  ADMIN_MODULE_PORT: v.optional(
    v.pipe(
      portSchema,
      v.description('Port for hosting Admin with Vite as a Node.js instance, default: 8080'),
    ),
    8080,
  ),
  APP_VERSION,
  BUILD_COMMIT: v.optional(BUILD_COMMIT),

  COMMUNITY_URL: v.optional(COMMUNITY_URL),
  WALLET_URL: v.optional(
    v.pipe(
      httpUrlSchema,
      v.description('Extern Url of the wallet-frontend, COMMUNITY_URL where not set'),
    ),
  ),
  GRAPHQL_URL: v.optional(GRAPHQL_URI),
  GRAPHQL_PATH: v.optional(
    pathSchema('Path of the backend api, behind COMMUNITY_URL where GRAPHQL_URL is not set'),
    '/graphql',
  ),
  WALLET_AUTH_PATH: v.optional(
    pathSchema('Path of the wallet login the admin forwards to, behind WALLET_URL'),
    '/authenticate?token=',
  ),
  WALLET_LOGIN_PATH: v.optional(
    pathSchema('Path of the wallet login the admin forwards to after a logout, behind WALLET_URL'),
    '/login',
  ),

  // the rule below keeps it false in production
  DEBUG_DISABLE_AUTH: v.optional(
    v.pipe(booleanSchema, v.description('Flag for disable authorization during development')),
    false,
  ),
  HUMHUB_ACTIVE: v.optional(HUMHUB_ACTIVE, false),
  HUMHUB_API_URL: v.optional(HUMHUB_API_URL),
  ANTHROPIC_ACTIVE: v.optional(ANTHROPIC_ACTIVE, false),
  // Printed on the starting bonus cheque, where it tells the guest which community
  // the code belongs to. Same value and same fallback as in the wallet.
  COMMUNITY_NAME: v.optional(COMMUNITY_NAME, 'Gradido Entwicklung'),
})

const schema = v.pipe(
  environment,
  v.transform((env) => {
    // with its own nodejs instance the admin answers on a port, behind nginx it does not
    const ADMIN_MODULE_URL =
      env.ADMIN_HOSTING === 'nodejs'
        ? `${env.ADMIN_MODULE_PROTOCOL}://${env.ADMIN_MODULE_HOST}:${env.ADMIN_MODULE_PORT}`
        : `${env.ADMIN_MODULE_PROTOCOL}://${env.ADMIN_MODULE_HOST}`
    const COMMUNITY_URL = env.COMMUNITY_URL ?? ADMIN_MODULE_URL
    const WALLET_URL = env.WALLET_URL ?? COMMUNITY_URL
    return {
      ...env,
      DEBUG: env.NODE_ENV !== 'production',
      PRODUCTION: env.NODE_ENV === 'production',
      BUILD_COMMIT_SHORT: (env.BUILD_COMMIT ?? '0000000').slice(0, 7),
      ADMIN_MODULE_URL,
      COMMUNITY_URL,
      WALLET_URL,
      GRAPHQL_URI: env.GRAPHQL_URL ?? COMMUNITY_URL + env.GRAPHQL_PATH,
      WALLET_AUTH_URL: WALLET_URL + env.WALLET_AUTH_PATH,
      WALLET_LOGIN_URL: WALLET_URL + env.WALLET_LOGIN_PATH,
      HUMHUB_API_URL: env.HUMHUB_API_URL ?? `${COMMUNITY_URL}/community/`,
    }
  }),
  // https only behind nginx: served by vite's own node instance, the admin cannot offer it
  configRule(
    'ADMIN_MODULE_PROTOCOL',
    (config) => config.ADMIN_HOSTING === 'nginx' || config.ADMIN_MODULE_PROTOCOL === 'http',
    'ADMIN_MODULE_PROTOCOL must be http unless ADMIN_HOSTING is nginx',
  ),
  // never without login in production
  configRule(
    'DEBUG_DISABLE_AUTH',
    (config) => config.NODE_ENV !== 'production' || config.DEBUG_DISABLE_AUTH === false,
    'DEBUG_DISABLE_AUTH must be false when NODE_ENV is production',
  ),
)

module.exports = { schema }
