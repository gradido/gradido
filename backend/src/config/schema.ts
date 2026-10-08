import {
  ANTHROPIC_ACTIVE,
  booleanSchema,
  COMMUNITY_DESCRIPTION,
  COMMUNITY_HOST,
  COMMUNITY_NAME,
  COMMUNITY_SUPPORT_MAIL,
  COMMUNITY_URL,
  communityUrlOf,
  DLT_ACTIVE,
  DLT_CONNECTOR_URL,
  GDT_ACTIVE,
  GDT_API_URL,
  GMS_ACTIVE,
  GRAPHIQL,
  graphiqlOnlyInDevelopment,
  HUMHUB_ACTIVE,
  HUMHUB_API_URL,
  httpsUrlSchema,
  httpUrlSchema,
  integerSchema,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  LOG4JS_CONFIG,
  LOGIN_APP_SECRET,
  LOGIN_SERVER_KEY,
  NODE_ENV,
  nonEmptyStringSchema,
  portSchema,
  requiredWhen,
  URL_PROTOCOL,
} from 'config-schema'
import * as v from 'valibot'

// What the environment can set, and the value used where it does not. CONFIG is read straight
// out of process.env with this, so the keys are the variable names. The URLs a mail or a link
// points to are put together from COMMUNITY_URL and a path in the transform at the end.

// time in minutes, at most 30 days
const minutesSchema = (description: string) =>
  v.pipe(integerSchema, v.minValue(1), v.maxValue(43200), v.description(description))

// a time span like "10m", "1h", "1d" as a numeric string
const jwtExpirationSchema = (description: string) =>
  v.pipe(v.string(), v.regex(/^\d+[smhdw]$/), v.description(description))

// the path behind COMMUNITY_URL a link is built from
const pathSchema = (description: string) => v.pipe(v.string(), v.description(description))

const environment = v.object({
  LOG4JS_CONFIG: v.optional(LOG4JS_CONFIG, 'log4js-config.json'),
  // default log level on production should be info
  // log level for default log4js-config.json, don't change existing log4js-config.json
  LOG_LEVEL: v.optional(LOG_LEVEL, 'info'),
  LOG_FILES_BASE_PATH: v.optional(LOG_FILES_BASE_PATH, '../logs/backend'),

  NODE_ENV,
  BACKEND_PORT: v.optional(
    v.pipe(portSchema, v.description('Port for hosting backend, default: 4000')),
    4000,
  ),
  DLT_ACTIVE: v.optional(DLT_ACTIVE, false),
  // TODO: check format
  JWT_SECRET: v.optional(
    v.pipe(nonEmptyStringSchema, v.description('jwt secret for jwt tokens used for login')),
    'secret123',
  ),
  JWT_EXPIRES_IN: v.optional(
    jwtExpirationSchema('Time for JWT token to expire, auto logout'),
    '10m',
  ),
  REDEEM_JWT_TOKEN_EXPIRATION: v.optional(
    jwtExpirationSchema('Time for x-community redeem JWT token to expire'),
    '10m',
  ),
  GRAPHIQL: v.optional(GRAPHIQL, false),
  GDT_ACTIVE: v.optional(GDT_ACTIVE, false),
  GDT_API_URL: v.optional(GDT_API_URL, 'https://gdt.gradido.net'),
  // ES-014: the function-test area in the wallet settings, admins only. On by default, so
  // the areas can be used on every server without anybody editing an environment file --
  // a community that does not want it switches it off with one line.
  //
  // ⛔ Deliberately NOT in .env.dist or any .env.template: a name a server's own .env has
  // never seen is left standing by `envsubst` as a literal `$NAME`, which is a self
  // reference that kills the frontend build AFTER start.sh has stopped the services
  // (10./11.08.2026, twice). Read here with a default, and handed to the wallet through
  // firstCreationStatus.functionTestsEnabled -- no frontend env either.
  FUNCTION_TESTS_ENABLED: v.optional(
    v.pipe(
      booleanSchema,
      v.description(
        'ES-014: the function-test area in the wallet settings, for admins. On by default so it works on every server without an environment file being touched; set to false to hide it.',
      ),
    ),
    true,
  ),

  KLICKTIPP: v.optional(
    v.pipe(
      booleanSchema,
      v.description("Indicates whether Klicktipp integration is enabled, 'true' or 'false'"),
    ),
    false,
  ),
  KLICKTTIPP_API_URL: v.optional(
    v.pipe(
      httpsUrlSchema,
      v.description("The API URL for Klicktipp, must be a valid URL starting with 'https'"),
    ),
    'https://api.klicktipp.com',
  ),
  KLICKTIPP_USER: v.optional(
    v.pipe(nonEmptyStringSchema, v.description('The username for Klicktipp')),
    'gradido_test',
  ),
  KLICKTIPP_PASSWORD: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.minLength(6),
      v.description('The password for Klicktipp, should be at least 6 characters'),
    ),
    'secret321',
  ),
  KLICKTIPP_APIKEY_DE: v.optional(
    v.pipe(nonEmptyStringSchema, v.description('The API key for Klicktipp (German version)')),
    'SomeFakeKeyDE',
  ),
  KLICKTIPP_APIKEY_EN: v.optional(
    v.pipe(nonEmptyStringSchema, v.description('The API key for Klicktipp (English version)')),
    'SomeFakeKeyEN',
  ),

  COMMUNITY_HOST,
  URL_PROTOCOL,
  COMMUNITY_URL: v.optional(COMMUNITY_URL),
  DLT_CONNECTOR_PORT: v.optional(
    v.pipe(
      integerSchema,
      v.minValue(1),
      v.maxValue(65535),
      v.description('Port of the DLT connector, used for DLT_CONNECTOR_URL where that is not set'),
    ),
    6010,
  ),
  DLT_CONNECTOR_URL: v.optional(DLT_CONNECTOR_URL),

  COMMUNITY_NAME: v.optional(COMMUNITY_NAME, 'Gradido Entwicklung'),
  COMMUNITY_REDEEM_PATH: v.optional(
    pathSchema('The path for redeeming link transactions, behind COMMUNITY_URL'),
    '/redeem/',
  ),
  COMMUNITY_REDEEM_CONTRIBUTION_PATH: v.optional(
    pathSchema('The path for redeeming contribution link transactions, behind COMMUNITY_URL'),
    '/redeem/CL-',
  ),
  COMMUNITY_DESCRIPTION: v.optional(
    COMMUNITY_DESCRIPTION,
    'Die lokale Entwicklungsumgebung von Gradido.',
  ),
  COMMUNITY_SUPPORT_MAIL: v.optional(COMMUNITY_SUPPORT_MAIL, 'support@supportmail.com'),

  LOGIN_APP_SECRET: v.optional(LOGIN_APP_SECRET, '21ffbbc616fe'),
  LOGIN_SERVER_KEY: v.optional(LOGIN_SERVER_KEY, 'a51ef8ac7ef1abf162fb7a65261acd7a'),
  USE_CRYPTO_WORKER: v.optional(
    v.pipe(
      booleanSchema,
      v.description(
        'Flag to enable or disable password encryption in separate thread, should be enabled if possible',
      ),
    ),
    false,
  ),

  EMAIL_LINK_VERIFICATION_PATH: v.optional(
    pathSchema('Path of the link to activate an email, behind COMMUNITY_URL'),
    '/checkEmail/',
  ),
  EMAIL_LINK_SETPASSWORD_PATH: v.optional(
    pathSchema('Path of the link to set the initial password, behind COMMUNITY_URL'),
    '/reset-password/',
  ),
  EMAIL_LINK_OVERVIEW_PATH: v.optional(
    pathSchema('Path of the link to the wallet overview, behind COMMUNITY_URL'),
    '/overview',
  ),
  // time in minutes a optin code is valid
  EMAIL_CODE_VALID_TIME: v.optional(minutesSchema('Time in minutes a code is valid'), 1440),
  // time in minutes that must pass to request a new optin code
  EMAIL_CODE_REQUEST_TIME: v.optional(
    minutesSchema('Time in minutes before a new code can be requested'),
    10,
  ),

  // Elopage
  WEBHOOK_ELOPAGE_SECRET: v.optional(
    v.pipe(nonEmptyStringSchema, v.description("isn't really used any more")),
    'secret',
  ),

  FEDERATION_VALIDATE_COMMUNITY_TIMER: v.optional(
    v.pipe(
      integerSchema,
      v.minValue(1000),
      v.description('Timer interval in milliseconds for community validation'),
    ),
    60000,
  ),

  // Any string: chatVideoServers() reads it entry by entry and skips an unusable entry with a
  // warning. A rule here would keep the whole backend from starting over one mistyped server.
  // Only the seed since V3: the table chat_video_servers is the list, kept on the admin page.
  CHAT_VIDEO_SERVERS: v.optional(
    v.pipe(
      v.string(),
      v.description(
        'Seed for the list of Jitsi servers for chat video rooms, "base address|operator|room prefix" separated by ";" -- written into the table chat_video_servers at a start while the table is empty, after that the admin page "Chat" keeps the list; empty: the checked public servers built into the backend',
      ),
    ),
    '',
  ),

  GMS_ACTIVE: v.optional(GMS_ACTIVE, false),
  GMS_CREATE_USER_THROW_ERRORS: v.optional(
    v.pipe(
      booleanSchema,
      v.description('Whether errors should be thrown when creating users in GMS'),
    ),
    false,
  ),
  // koordinates of Illuminz-instance of GMS
  GMS_API_URL: v.optional(
    v.pipe(httpUrlSchema, v.description('The API URL for the GMS service')),
    'http://localhost:4044/',
  ),
  GMS_DASHBOARD_URL: v.optional(
    v.pipe(httpUrlSchema, v.description('The URL for the GMS dashboard')),
    'http://localhost:8080/',
  ),
  GMS_USER_SEARCH_FRONTEND_ROUTE: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^[\w_-]*$/),
      v.description(
        'gms frontend playground route, user-search for standalone playground, usersearch-playground for old, empty for testing local',
      ),
    ),
    'user-search',
  ),
  // used as secret postfix attached at the gms community-auth-url endpoint ('/hook/gms/' + 'secret')
  GMS_WEBHOOK_SECRET: v.optional(
    v.pipe(nonEmptyStringSchema, v.description('The secret postfix for the GMS webhook endpoint')),
    'secret',
  ),

  HUMHUB_ACTIVE: v.optional(HUMHUB_ACTIVE, false),
  HUMHUB_API_URL: v.optional(HUMHUB_API_URL),
  // the rule below asks for it once HumHub is on
  HUMHUB_JWT_KEY: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.description('JWT key for HumHub integration, must be the same as configured in humhub'),
    ),
  ),

  ANTHROPIC_ACTIVE: v.optional(ANTHROPIC_ACTIVE, false),
  // TODO: move next to GMS_ACTIVE once there is a matching block to put it in. It is
  // here because that is where it was added, not because it belongs to Anthropic.
  // The community's matching switch. Read here as well as in the frontend, and for a
  // reason the frontend does not have: the keying run spends money. With matching off
  // no member can even reach the feature, so working out words for entries that
  // predate the switch would be paying a language model for something nobody can see.
  //
  // Defaults to off, and that is the direction a missing value has to fail in: a
  // community that never asked for this must not be billed for it.
  MATCHING_ACTIVE: v.optional(
    v.pipe(booleanSchema, v.description('Whether the matching feature is on for this community')),
    false,
  ),
  // the rule below asks for it once Anthropic is on
  ANTHROPIC_API_KEY: v.optional(
    v.pipe(
      v.string(),
      v.regex(/^sk-ant-[A-Za-z0-9-_]{20,}$/, 'must be an Anthropic API key (sk-ant-...)'),
      v.description(
        'API key for the Anthropic (Claude) API, used by the Crea moderation assistant',
      ),
    ),
  ),
  ANTHROPIC_MODEL: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.description(
        'Claude model id for Crea (production floor claude-sonnet-5; claude-opus-4-8 for hard cases)',
      ),
    ),
    'claude-sonnet-5',
  ),
  // Opt-in preview: with no API key set, `CREA_STUB=true` makes Crea return a canned
  // evaluation (no API call) so the UI/DB path and deterministics can be exercised
  // without a key. Off by default in production.
  CREA_STUB: v.optional(
    v.pipe(
      booleanSchema,
      v.description(
        'Opt-in preview: with no API key, return a canned evaluation (no API call) so the UI/DB/deterministics can be exercised without a key. Off by default in production.',
      ),
    ),
    false,
  ),
})

export const schema = v.pipe(
  environment,
  v.transform((env) => {
    const COMMUNITY_URL = communityUrlOf(env)
    return {
      ...env,
      PRODUCTION: env.NODE_ENV === 'production',
      COMMUNITY_URL,
      DLT_CONNECTOR_URL: env.DLT_CONNECTOR_URL ?? `http://localhost:${env.DLT_CONNECTOR_PORT}`,
      COMMUNITY_REDEEM_URL: COMMUNITY_URL + env.COMMUNITY_REDEEM_PATH,
      COMMUNITY_REDEEM_CONTRIBUTION_URL: COMMUNITY_URL + env.COMMUNITY_REDEEM_CONTRIBUTION_PATH,
      EMAIL_LINK_VERIFICATION: COMMUNITY_URL + env.EMAIL_LINK_VERIFICATION_PATH,
      EMAIL_LINK_SETPASSWORD: COMMUNITY_URL + env.EMAIL_LINK_SETPASSWORD_PATH,
      EMAIL_LINK_OVERVIEW: COMMUNITY_URL + env.EMAIL_LINK_OVERVIEW_PATH,
      // Deliberately no environment variable of its own: a name that a server's .env has never
      // seen is left as a literal `$NAME` by start.sh and takes the frontend build down.
      EMAIL_LINK_EMAIL_CHANGE: `${COMMUNITY_URL}/email-change/`,
      // Same reasoning as above — derived, no environment variable (EM-013).
      EMAIL_LINK_CONFIRM_EMAIL: `${COMMUNITY_URL}/confirm-email/`,
      HUMHUB_API_URL: env.HUMHUB_API_URL ?? `${COMMUNITY_URL}/community/`,
    }
  }),
  graphiqlOnlyInDevelopment(),
  requiredWhen('HUMHUB_JWT_KEY', 'HUMHUB_ACTIVE'),
  requiredWhen('ANTHROPIC_API_KEY', 'ANTHROPIC_ACTIVE'),
)
