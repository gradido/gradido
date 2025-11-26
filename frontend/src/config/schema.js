import {
  APP_VERSION,
  BUILD_COMMIT,
  BUILD_COMMIT_SHORT,
  COMMUNITY_DESCRIPTION,
  COMMUNITY_LOCATION,
  COMMUNITY_NAME,
  COMMUNITY_SUPPORT_MAIL,
  COMMUNITY_URL,
  DEBUG,
  DECAY_START_TIME,
  DLT_ACTIVE,
  GMS_ACTIVE,
  GRAPHQL_URI,
  HUMHUB_ACTIVE,
  NODE_ENV,
  PRODUCTION,
} from 'config-schema'
import Joi from 'joi'

// console.log(commonSchema)

module.exports = Joi.object({
  APP_VERSION,
  BUILD_COMMIT,
  BUILD_COMMIT_SHORT,
  COMMUNITY_DESCRIPTION,
  COMMUNITY_NAME,
  COMMUNITY_SUPPORT_MAIL,
  COMMUNITY_LOCATION,
  COMMUNITY_URL,
  DEBUG,
  DECAY_START_TIME,
  DLT_ACTIVE,
  GMS_ACTIVE,
  GRAPHQL_URI,
  HUMHUB_ACTIVE,
  NODE_ENV,
  PRODUCTION,

  ADMIN_AUTH_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('Extern Url for admin-frontend')
    .default('http://0.0.0.0/admin/authenticate?token=')
    .required(),

  AUTO_POLL_INTERVAL: Joi.number()
    .integer()
    .min(0)
    .max(600000)
    .description('Auto Polling for new data in ms. 0 = disabled = default. Experimental!')
    .default(0),

  COMMUNITY_REGISTER_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('URL for Register a new Account in frontend.')
    .required(),

  CROSS_TX_REDEEM_LINK_ACTIVE: Joi.boolean()
    .description('Enable cross-community redeem links')
    .default(false)
    .optional(),

  FRONTEND_HOSTING: Joi.string()
    .valid('nodejs', 'nginx')
    .description('set to `nodejs` if frontend is hosted by vite with a own nodejs instance')
    .optional(),

  FRONTEND_MODULE_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('COMMUNITY_URL', {
      is: Joi.exist(),
      then: Joi.optional(), // not required if COMMUNITY_URL is provided
      otherwise: Joi.required(), // required if COMMUNITY_URL is missing
    })
    .description(
      "Base Url for reaching frontend in browser, only needed if COMMUNITY_URL wasn't set",
    )
    .optional(), // optional in general, but conditionally required

  FRONTEND_MODULE_PROTOCOL: Joi.string()
    .when('FRONTEND_HOSTING', {
      is: Joi.valid('nodejs'),
      then: Joi.valid('http').required(),
      otherwise: Joi.valid('http', 'https').required(),
    })
    .description(
      `
      Protocol for frontend module hosting
      - it has to be the same as for backend api url and admin to prevent mixed block errors,
      - if frontend is served with nodejs:
          is have to be http or setup must be updated to include a ssl certificate
      `,
    )
    .default('http')
    .required(),

  FRONTEND_MODULE_HOST: Joi.alternatives()
    .try(
      Joi.string().valid('localhost').messages({ 'any.invalid': 'Must be localhost' }),
      Joi.string()
        .ip({ version: ['ipv4'] })
        .messages({ 'string.ip': 'Must be a valid IPv4 address' }),
      Joi.string().domain().messages({ 'string.domain': 'Must be a valid domain' }),
    )
    .when('FRONTEND_HOSTING', {
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
      'Host (domain, IPv4, or localhost) for the frontend, default is 0.0.0.0 for local hosting during development.',
    )
    .default('0.0.0.0'),

  FRONTEND_MODULE_PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting Frontend with Vite as a Node.js instance, default: 3000')
    .default(3000)
    .when('FRONTEND_HOSTING', {
      is: 'nodejs',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

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
