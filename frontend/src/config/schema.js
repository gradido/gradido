const commonSchema = require('../../../config/common.schema')
const Joi = require('joi')

module.exports = commonSchema.keys({
  FRONTEND_MODULE_PROTOCOL: Joi.string()
    .valid('http', 'https')
    .when('BROWSER_PROTOCOL', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description(
      'Protocol for frontend module hosting, has to be the same as for backend api url and admin to prevent mixed block errors'
    )
    .default('http')
    .required(),
    
  FRONTEND_HOSTING: Joi.string()
    .valid('nodejs')
    .description('set to `nodejs` if frontend is hosted by vite with a own nodejs instance')
    .optional(),

  FRONTEND_MODULE_HOST: Joi.alternatives()
    .try(
      Joi.string().valid('localhost').messages({ 'any.invalid': 'Must be localhost' }),
      Joi.string()
        .ip({ version: ['ipv4'] })
        .messages({ 'string.ip': 'Must be a valid IPv4 address' }),
      Joi.string().domain().messages({ 'string.domain': 'Must be a valid domain' }),
    )
    .description(
      'Host (domain, IPv4, or localhost) for the frontend, default is 0.0.0.0 for local hosting during develop',
    )
    .default('0.0.0.0')
    .required(), // required only if community_url isn't set or FRONTEND_HOSTING is nodejs

  FRONTEND_MODULE_PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting Frontend with Vite as a Node.js instance, default: 3000')
    .default(3000)
    .required(), // required only if FRONTEND_HOSTING is nodejs

  ADMIN_AUTH_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('browser_protocol', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }),
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('Extern Url for admin-frontend')
    .default('http://0.0.0.0/admin/authenticate?token='),

  META_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('The base URL for the meta tags.')
    .default('http://localhost')
    .required(),

  META_TITLE_DE: Joi.string()
    .description('Meta title in German.')
    .default('Gradido – Dein Dankbarkeitskonto')
    .required(),

  META_TITLE_EN: Joi.string()
    .description('Meta title in English.')
    .default('Gradido - Your gratitude account')
    .required(),

  META_DESCRIPTION_DE: Joi.string()
    .description('Meta description in German.')
    .default(
      'Dankbarkeit ist die Währung der neuen Zeit. Immer mehr Menschen entfalten ihr Potenzial und gestalten eine gute Zukunft für alle.',
    )
    .required(),

  META_DESCRIPTION_EN: Joi.string()
    .description('Meta description in English.')
    .default(
      'Gratitude is the currency of the new age. More and more people are unleashing their potential and shaping a good future for all.',
    )
    .required(),

  META_KEYWORDS_DE: Joi.string()
    .description('Meta keywords in German.')
    .default(
      'Grundeinkommen, Währung, Dankbarkeit, Schenk-Ökonomie, Natürliche Ökonomie des Lebens, Ökonomie, Ökologie, Potenzialentfaltung, Schenken und Danken, Kreislauf des Lebens, Geldsystem',
    )
    .required(),

  META_KEYWORDS_EN: Joi.string()
    .description('Meta keywords in English.')
    .default(
      'Basic Income, Currency, Gratitude, Gift Economy, Natural Economy of Life, Economy, Ecology, Potential Development, Giving and Thanking, Cycle of Life, Monetary System',
    )
    .required(),

  META_AUTHOR: Joi.string()
    .description('The author for the meta tags.')
    .default('Bernd Hückstädt - Gradido-Akademie')
    .required(),
})
