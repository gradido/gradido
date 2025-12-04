import {
  COMMUNITY_DESCRIPTION,
  COMMUNITY_NAME,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  LOG4JS_CONFIG,
  NODE_ENV,
  PRODUCTION,
} from 'config-schema'
import Joi from 'joi'

export const schema = Joi.object({
  COMMUNITY_NAME,
  COMMUNITY_DESCRIPTION,
  LOG4JS_CONFIG,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  NODE_ENV,
  PRODUCTION,

  FEDERATION_DHT_TOPIC: Joi.string()
    .default('GRADIDO_HUB')
    .description('The topic for the DHT (Distributed Hash Table), defaults to GRADIDO_HUB')
    .required(),

  FEDERATION_DHT_SEED: Joi.string()
    .when('NODE_ENV', {
      is: 'development',
      then: Joi.allow(null), // Allow empty for development
      otherwise: Joi.string()
        .hex()
        .length(64)
        .message('need to be valid hex with 64 character')
        .required(), // Valid hex and 64 characters for other environments
    })
    .description(
      'Seed for libsodium crypto_sign_seed_keypair. Valid hex with 64 characters in production',
    )
    .default(''), // Default to empty string

  FEDERATION_COMMUNITY_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default(Joi.ref('COMMUNITY_URL'))
    .description('Community URL for federation, defaults to COMMUNITY_URL')
    .required(),

  FEDERATION_COMMUNITY_APIS: Joi.string()
    .valid('1_0', '1_1')
    .default('1_0')
    .description('Federation community API version, defaults to 1_0')
    .required(),
})
