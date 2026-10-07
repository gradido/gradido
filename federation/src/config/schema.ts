import {
  booleanSchema,
  COMMUNITY_HOST,
  COMMUNITY_URL,
  communityUrlOf,
  GRAPHIQL,
  graphiqlOnlyInDevelopment,
  httpUrlSchema,
  integerSchema,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  LOG4JS_CONFIG_PLACEHOLDER,
  NODE_ENV,
  portSchema,
  URL_PROTOCOL,
} from 'config-schema'
import * as v from 'valibot'

// What the environment can set, and the value used where it does not. CONFIG is read straight
// out of process.env with this, so the keys are the variable names.

const environment = v.object({
  LOG4JS_CONFIG_PLACEHOLDER: v.optional(LOG4JS_CONFIG_PLACEHOLDER, 'log4js-config-%v.json'),
  // default log level on production should be info
  // log level for default log4js-config.json, don't change existing log4js-config.json
  LOG_LEVEL: v.optional(LOG_LEVEL, 'info'),
  LOG_FILES_BASE_PATH: v.optional(LOG_FILES_BASE_PATH, '../logs/federation'),

  NODE_ENV,
  GRAPHIQL: v.optional(GRAPHIQL, false),

  COMMUNITY_HOST,
  URL_PROTOCOL,
  COMMUNITY_URL: v.optional(COMMUNITY_URL),

  FEDERATION_API: v.optional(
    v.pipe(v.picklist(['1_0', '1_1']), v.description('Federation API version, defaults to 1_0')),
    '1_0',
  ),
  FEDERATION_PORT: v.optional(
    v.pipe(portSchema, v.description('Port number for the federation service, defaults to 5010')),
    5010,
  ),
  FEDERATION_COMMUNITY_URL: v.optional(
    v.pipe(httpUrlSchema, v.description('Community URL for federation, defaults to COMMUNITY_URL')),
  ),
  // not read from the environment: the one trading level there is
  FEDERATION_TRADING_LEVEL: v.optional(
    v.pipe(
      v.strictObject({
        RECEIVER_COMMUNITY_URL: v.pipe(
          httpUrlSchema,
          v.description('URL of the receiver community for trading'),
        ),
        SEND_COINS: v.pipe(
          booleanSchema,
          v.description('Indicates if coins can be sent to the receiver community'),
        ),
        AMOUNT: v.pipe(
          integerSchema,
          v.minValue(1),
          v.description('Maximum amount of coins allowed for trading'),
        ),
      }),
      v.description('Trading level configuration for federation'),
    ),
    { RECEIVER_COMMUNITY_URL: 'https://stage3.gradido.net/api/', SEND_COINS: true, AMOUNT: 100 },
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
  graphiqlOnlyInDevelopment(),
)
