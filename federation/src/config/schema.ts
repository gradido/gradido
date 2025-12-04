import {
  GRAPHIQL,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  LOG4JS_CONFIG_PLACEHOLDER,
  NODE_ENV,
  PRODUCTION,
} from 'config-schema'
import Joi from 'joi'

export const schema = Joi.object({
  GRAPHIQL,
  LOG4JS_CONFIG_PLACEHOLDER,
  LOG_FILES_BASE_PATH,
  LOG_LEVEL,
  NODE_ENV,
  PRODUCTION,

  FEDERATION_API: Joi.string()
    .valid('1_0', '1_1')
    .default('1_0')
    .description('Federation API version, defaults to 1_0')
    .required(),

  FEDERATION_PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .default(5010)
    .description('Port number for the federation service, defaults to 5010')
    .required(),

  FEDERATION_COMMUNITY_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default(Joi.ref('COMMUNITY_URL'))
    .description('Community URL for federation, defaults to COMMUNITY_URL')
    .required(),

  FEDERATION_TRADING_LEVEL: Joi.object({
    RECEIVER_COMMUNITY_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .default('https://stage3.gradido.net/api/')
      .description('URL of the receiver community for trading')
      .required(),

    SEND_COINS: Joi.boolean()
      .default(true)
      .description('Indicates if coins can be sent to the receiver community')
      .required(),

    AMOUNT: Joi.number()
      .integer()
      .min(1)
      .default(100)
      .description('Maximum amount of coins allowed for trading')
      .required(),
  })
    .default()
    .description('Trading level configuration for federation')
    .optional(),
})
