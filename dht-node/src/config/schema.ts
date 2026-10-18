import {
  COMMUNITY_HOST,
  COMMUNITY_URL,
  communityDescriptionSchema,
  communityNameSchema,
  communityUrlOf,
  httpUrlSchema,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  LOG4JS_CONFIG,
  NODE_ENV,
  nonEmptyStringSchema,
  URL_PROTOCOL,
} from 'config-schema'
import * as v from 'valibot'
import { ApiVersionType } from '../dht_node/ApiVersionType'

// What the environment can set, and the value used where it does not. CONFIG is read straight
// out of process.env with this, so the keys are the variable names.

const HEX_64 = /^[a-fA-F0-9]{64}$/

const environment = v.object({
  LOG4JS_CONFIG: v.optional(LOG4JS_CONFIG, 'log4js-config.json'),
  // default log level on production should be info
  // log level for default log4js-config.json, don't change existing log4js-config.json
  LOG_LEVEL: v.optional(LOG_LEVEL, 'info'),
  LOG_FILES_BASE_PATH: v.optional(LOG_FILES_BASE_PATH, '../logs/dht-node'),

  NODE_ENV,

  COMMUNITY_NAME: v.optional(communityNameSchema, 'Gradido Entwicklung'),
  COMMUNITY_DESCRIPTION: v.optional(
    communityDescriptionSchema,
    'Gradido-Community einer lokalen Entwicklungsumgebung.',
  ),
  COMMUNITY_HOST,
  URL_PROTOCOL,
  COMMUNITY_URL: v.optional(COMMUNITY_URL),

  FEDERATION_DHT_TOPIC: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.description('The topic for the DHT (Distributed Hash Table), defaults to GRADIDO_HUB'),
    ),
    'GRADIDO_HUB',
  ),
  // required everywhere: the home community's key pair is derived from it and never changes
  FEDERATION_DHT_SEED: v.pipe(
    v.string(),
    v.regex(HEX_64, 'need to be valid hex with 64 character'),
    v.description('Seed for libsodium crypto_sign_seed_keypair: 32 bytes as 64 hex characters'),
  ),
  FEDERATION_COMMUNITY_URL: v.optional(
    v.pipe(httpUrlSchema, v.description('Community URL for federation, defaults to COMMUNITY_URL')),
  ),
  // comma separated in the environment, a list of known versions here
  FEDERATION_COMMUNITY_APIS: v.optional(
    v.pipe(
      v.string(),
      v.transform((input) => input.split(',').map((api) => api.trim())),
      v.array(v.enum(ApiVersionType, 'unknown federation api version')),
      v.description(
        'Federation API versions this community announces, comma separated, defaults to 1_0',
      ),
    ),
    '1_0',
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
      FEDERATION_COMMUNITY_URL: env.FEDERATION_COMMUNITY_URL ?? COMMUNITY_URL,
    }
  }),
)
