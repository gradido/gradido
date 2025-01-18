const commonSchema = require('../../../config/common.schema')
const Joi = require('joi')

module.exports = commonSchema.keys({
  ADMIN_MODULE_PROTOCOL: Joi.string()
    .valid('http', 'https')
    .when('BROWSER_PROTOCOL', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description(
      'Protocol for admin module hosting, has to be the same as for backend api url and admin to prevent mixed block errors'
    )
    .default('http')
    .required(),

  ADMIN_HOSTING: Joi.string()
    .valid('nodejs')
    .description('set to `nodejs` if admin is hosted by vite with a own nodejs instance')
    .optional(),

  ADMIN_MODULE_HOST: Joi.alternatives()
    .try(
      Joi.string().valid('localhost').messages({ 'any.invalid': 'Must be localhost' }),
      Joi.string()
        .ip({ version: ['ipv4'] })
        .messages({ 'string.ip': 'Must be a valid IPv4 address' }),
      Joi.string().domain().messages({ 'string.domain': 'Must be a valid domain' }),
    )
    .description(
      'Host (domain, IPv4, or localhost) for the admin, default is 0.0.0.0 for local hosting during develop',
    )
    .default('0.0.0.0')
    .required(), // required only if community_url isn't set or ADMIN_HOSTING is nodejs

  ADMIN_MODULE_PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting Admin with Vite as a Node.js instance, default: 8080')
    .default(8080)
    .required(), // required only if ADMIN_HOSTING is nodejs

  WALLET_AUTH_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('browser_protocol', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }),
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('Extern Url from wallet-frontend for forwarding from admin')
    .default('http://0.0.0.0/authenticate?token=')
    .required(),

  WALLET_LOGIN_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('browser_protocol', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }),
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('Extern Url from wallet-frontend for forwarding after logout')
    .default('http://0.0.0.0/login')
    .required(),

  DEBUG_DISABLE_AUTH: Joi.boolean()
    .description('Flag for disable authorization during development')
    .default(false)
    .optional(), // true is only allowed in not-production setup
})