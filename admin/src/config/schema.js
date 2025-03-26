import {
  APP_VERSION,
  BUILD_COMMIT,
  BUILD_COMMIT_SHORT,
  COMMUNITY_URL,
  DEBUG,
  GRAPHQL_URI,
  HUMHUB_ACTIVE,
  HUMHUB_API_URL,
  NODE_ENV,
  OPENAI_ACTIVE,
  PRODUCTION,
} from 'config'
import Joi from 'joi'

export default Joi.object({
  APP_VERSION,
  BUILD_COMMIT,
  BUILD_COMMIT_SHORT,
  COMMUNITY_URL,
  DEBUG,
  GRAPHQL_URI,
  HUMHUB_ACTIVE,
  HUMHUB_API_URL,
  NODE_ENV,
  OPENAI_ACTIVE,
  PRODUCTION,

  ADMIN_HOSTING: Joi.string()
    .valid('nodejs', 'nginx')
    .description('set to `nodejs` if admin is hosted by vite with a own nodejs instance')
    .optional(),

  ADMIN_MODULE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('COMMUNITY_URL', {
      is: Joi.exist(),
      then: Joi.optional(), // not required if COMMUNITY_URL is provided
      otherwise: Joi.required(), // required if COMMUNITY_URL is missing
    })
    .description("Base Url for reaching admin in browser, only needed if COMMUNITY_URL wasn't set")
    .optional(), // optional in general, but conditionally required

  ADMIN_MODULE_PROTOCOL: Joi.string()
    .when('ADMIN_HOSTING', {
      is: Joi.valid('nodejs'),
      then: Joi.valid('http').required(),
      otherwise: Joi.valid('http', 'https').required(),
    })
    .description(
      `
      Protocol for admin module hosting
      - it has to be the same as for backend api url and frontend to prevent mixed block errors,
      - if admin is served with nodejs:
          is have to be http or setup must be updated to include a ssl certificate
      `,
    )
    .default('http')
    .required(),

  ADMIN_MODULE_HOST: Joi.alternatives()
    .try(
      Joi.string().valid('localhost').messages({ 'any.invalid': 'Must be localhost' }),
      Joi.string()
        .ip({ version: ['ipv4'] })
        .messages({ 'string.ip': 'Must be a valid IPv4 address' }),
      Joi.string().domain().messages({ 'string.domain': 'Must be a valid domain' }),
    )
    .when('ADMIN_HOSTING', {
      is: 'nodejs',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .when('COMMUNITY_URL', {
      is: null,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description(
      'Host (domain, IPv4, or localhost) for the admin, default is 0.0.0.0 for local hosting during develop',
    )
    .default('0.0.0.0'),

  ADMIN_MODULE_PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting Admin with Vite as a Node.js instance, default: 8080')
    .default(8080)
    .when('ADMIN_HOSTING', {
      is: 'nodejs',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  WALLET_AUTH_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('Extern Url from wallet-frontend for forwarding from admin')
    .default('http://0.0.0.0/authenticate?token=')
    .required(),

  WALLET_LOGIN_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('Extern Url from wallet-frontend for forwarding after logout')
    .default('http://0.0.0.0/login')
    .required(),

  DEBUG_DISABLE_AUTH: Joi.boolean()
    .description('Flag for disable authorization during development')
    .default(false)
    .optional(), // true is only allowed in not-production setup
})
