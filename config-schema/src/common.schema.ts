import * as v from 'valibot'
import {
  booleanSchema,
  emailSchema,
  hexSchema,
  httpUrlSchema,
  nonEmptyStringSchema,
  urlSchema,
} from './base.schema'
import { DECAY_START_TIME } from './const'
import { LOG_LEVEL as logLevelSchema } from './log4js-config/types/LogLevel'
import { requiredWhen } from './rules'

// Keys are named like the environment variables they check and describe one value each. A
// module wraps a key in `v.optional(KEY, default)` where it has a default of its own; the
// defaults differ between modules, so they are not set here. The one exception is NODE_ENV.
//
// Rules between keys - "required while that flag is on" - are exported next to the key they
// belong to and piped after the object schema by every module that uses the key.

// undefined for what is no URL: this check also runs after an entry failed its own
const protocolOf = (url: string): string | undefined => {
  try {
    return new URL(url).protocol
  } catch {
    return undefined
  }
}

const sameProtocol = (urls: (string | undefined)[]): boolean => {
  const protocols = urls.map((url) => (url === undefined ? undefined : protocolOf(url)))
  return new Set(protocols.filter((protocol) => protocol !== undefined)).size <= 1
}

// `undefined` entries are skipped: a module lists URLs it may not have set
export const browserUrls = v.pipe(
  v.array(v.optional(urlSchema)),
  v.check(sameProtocol, 'All URLs need to have same protocol to prevent mixed block errors'),
  v.description('All URLs need to have same protocol to prevent mixed block errors'),
)

export const COMMUNITY_URL = v.pipe(
  httpUrlSchema,
  v.check((url) => !url.endsWith('/'), 'URL should not end with a slash (/)'),
  v.description(
    'The base URL of the community, should have the same protocol as frontend, admin and backend api to prevent mixed contend issues.',
  ),
)

// COMMUNITY_URL is put together from these two where it is not set itself
export const COMMUNITY_HOST = v.optional(
  v.pipe(
    nonEmptyStringSchema,
    v.description('Host of the community, used for COMMUNITY_URL where that is not set'),
  ),
  'localhost',
)

export const URL_PROTOCOL = v.optional(
  v.pipe(
    v.picklist(['http', 'https']),
    v.description('Protocol of the community, used for COMMUNITY_URL where that is not set'),
  ),
  'http',
)

export const communityUrlOf = (env: {
  COMMUNITY_URL?: string
  URL_PROTOCOL: string
  COMMUNITY_HOST: string
}): string => env.COMMUNITY_URL ?? `${env.URL_PROTOCOL}://${env.COMMUNITY_HOST}`

export const DLT_ACTIVE = v.pipe(
  booleanSchema,
  v.description('Flag to indicate if the DLT (Decentralized Ledger Technology) service is used.'),
)

export const DLT_CONNECTOR_URL = v.pipe(httpUrlSchema, v.description('The URL for DLT connector'))

export const dltConnectorUrlRequiredWhenActive = <
  TConfig extends { DLT_ACTIVE: boolean; DLT_CONNECTOR_URL?: string },
>() => requiredWhen<TConfig>('DLT_CONNECTOR_URL', 'DLT_ACTIVE')

export const GRAPHQL_URI = v.pipe(
  httpUrlSchema,
  v.description(
    `
    The external URL of the backend service,
    accessible from outside the server (e.g., via Nginx or the server's public URL),
    should have the same protocol as frontend and admin to prevent mixed contend issues.
  `,
  ),
)

export const COMMUNITY_NAME = v.pipe(
  nonEmptyStringSchema,
  v.minLength(3),
  v.maxLength(40),
  v.description('The name of the community'),
)

export const COMMUNITY_DESCRIPTION = v.pipe(
  nonEmptyStringSchema,
  v.minLength(10),
  v.maxLength(255),
  v.description('A short description of the community'),
)

export const COMMUNITY_SUPPORT_MAIL = v.pipe(
  emailSchema,
  v.description('The support email address for the community will be used in frontend and E-Mails'),
)

export const COMMUNITY_LOCATION = v.pipe(
  nonEmptyStringSchema,
  v.regex(/^[-+]?[0-9]{1,2}(\.[0-9]+)?,\s?[-+]?[0-9]{1,3}(\.[0-9]+)?$/),
  v.description('Geographical location of the community in "latitude, longitude" format'),
)

export const communityLocationRequiredWhenGmsActive = <
  TConfig extends { GMS_ACTIVE: boolean; COMMUNITY_LOCATION?: string },
>() => requiredWhen<TConfig>('COMMUNITY_LOCATION', 'GMS_ACTIVE')

export const GMS_ACTIVE = v.pipe(
  booleanSchema,
  v.description('Flag to indicate if the GMS (Geographic Member Search) service is used.'),
)

// Deliberately separate from GMS_ACTIVE: that one switches the older GMS
// integration (the overview card and the position export), and it is on in
// production. Hanging the new matching off it would publish unfinished work the
// moment an instance enables the old service.
export const MATCHING_ACTIVE = v.pipe(
  booleanSchema,
  v.description('Flag to indicate if the new matching (entries, map, list) is offered to members.'),
)

export const GDT_ACTIVE = v.pipe(
  booleanSchema,
  v.description('Flag to indicate if the GDT (Gradido Transform) service is used.'),
)

export const GDT_API_URL = v.pipe(httpUrlSchema, v.description('The URL for GDT API endpoint'))

export const gdtApiUrlRequiredWhenActive = <
  TConfig extends { GDT_ACTIVE: boolean; GDT_API_URL?: string },
>() => requiredWhen<TConfig>('GDT_API_URL', 'GDT_ACTIVE')

export const HUMHUB_ACTIVE = v.pipe(
  booleanSchema,
  v.description('Flag to indicate if the HumHub based Community Server is used.'),
)

export const HUMHUB_API_URL = v.pipe(
  httpUrlSchema,
  v.description('The API URL for HumHub integration'),
)

export const humhubApiUrlRequiredWhenActive = <
  TConfig extends { HUMHUB_ACTIVE: boolean; HUMHUB_API_URL?: string },
>() => requiredWhen<TConfig>('HUMHUB_API_URL', 'HUMHUB_ACTIVE')

export const LOG_LEVEL = v.pipe(logLevelSchema, v.description('set log level'))

export const LOG4JS_CONFIG = v.pipe(
  nonEmptyStringSchema,
  v.regex(/^[a-zA-Z0-9-_]+\.json$/, 'LOG4JS_CONFIG must be a valid filename ending with .json'),
  v.description('config file name for log4js config file'),
)

export const LOG4JS_CONFIG_PLACEHOLDER = v.pipe(
  nonEmptyStringSchema,
  v.regex(
    /^[a-zA-Z0-9-_]+(%v)?\.json$/,
    'LOG4JS_CONFIG_PLACEHOLDER must be a valid filename ending with .json can contain %v as API Version placeholder before ending',
  ),
  v.description('config file name for log4js config file'),
)

export const LOG_FILES_BASE_PATH = v.pipe(
  nonEmptyStringSchema,
  v.regex(
    /^[a-zA-Z0-9-_\/\.]+$/,
    'LOG_FILES_BASE_PATH must be a valid folder name, relative or absolute',
  ),
  v.description('log folder name for module log files'),
)

export const LOGIN_APP_SECRET = v.pipe(
  hexSchema,
  v.description('App secret for salt component for libsodium crypto_pwhash'),
)

export const LOGIN_SERVER_KEY = v.pipe(
  hexSchema,
  v.length(32, 'need to be valid hex and 32 character'),
  v.description(
    'Server key for password hashing as additional salt for libsodium crypto_shorthash_keygen',
  ),
)

// Shared by backend and admin: the backend wakes Crea on it, the admin shows the
// Crea chat window on it. One switch, so the assistant and its chat are never half on.
export const ANTHROPIC_ACTIVE = v.pipe(
  booleanSchema,
  v.description('Flag to enable or disable the Anthropic (Claude) API used by Crea'),
)

export const APP_VERSION = v.pipe(
  nonEmptyStringSchema,
  v.regex(/^\d+\.\d+\.\d+$/, 'Version must be in the format "major.minor.patch" (e.g., "2.4.1")'),
  v.description('App Version from package.json, alle modules share one version'),
)

export const BUILD_COMMIT = v.pipe(
  nonEmptyStringSchema,
  v.regex(/^[0-9a-f]{40}$/, 'The commit hash must be a 40-character hexadecimal string.'),
  v.description('The full git commit hash.'),
)

export const BUILD_COMMIT_SHORT = v.pipe(
  nonEmptyStringSchema,
  v.regex(/^[0-9a-f]{7}$/, 'The first 7 hexadecimal character from git commit hash.'),
  v.description('A short version from the git commit hash.'),
)

// The one key with its default here: it is the same for every module, and rules on other
// keys read it, so a module without NODE_ENV counts as development.
export const NODE_ENV = v.optional(
  v.pipe(
    v.picklist(['production', 'development', 'test']),
    v.description('Specifies the environment in which the application is running.'),
  ),
  'development',
)

export const DEBUG = v.pipe(
  booleanSchema,
  v.description(
    'Indicates whether the application is in debugging mode. Set to true when NODE_ENV is not "production".',
  ),
)

export const PRODUCTION = v.pipe(
  booleanSchema,
  v.description(
    'Indicates whether the application is running in production mode. Set to true when NODE_ENV is "production".',
  ),
)

// The frontend carries its own copy of the decay start as a Date; it has to be this one.
// A string or a timestamp is accepted the way `new Date()` reads it.
export const decayStartTimeSchema = v.optional(
  v.pipe(
    v.union([v.date(), v.string(), v.number()]),
    v.transform((input) => new Date(input)),
    v.check(
      (date) => date.getTime() === DECAY_START_TIME.getTime(),
      `must be ${DECAY_START_TIME.toISOString()}`,
    ),
    v.description('Start of the decay, the same on every module'),
  ),
)
