const Joi = require('joi')

module.exports = Joi.object({
  BROWSER_PROTOCOL: Joi.string()
    .valid('http', 'https')
    .description(
      'Protocol for all URLs in the browser, must be either http or https to prevent mixed content issues.',
    )
    .default('http')
    .require(),

  COMMUNITY_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('BROWSER_PROTOCOL', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('The base URL of the community, should have the same scheme like frontend, admin and backend api to prevent mixed contend issues.')
    .default('http://0.0.0.0')
    .require(),

  GRAPHQL_URI: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('BROWSER_PROTOCOL', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description(
      `
      The external URL of the backend service,
      accessible from outside the server (e.g., via Nginx or the server's public URL),
      must use the same protocol as browser_protocol.      
    `,
    )
    .default('http://0.0.0.0/graphql')
    .require(),

  COMMUNITY_NAME: Joi.string()
    .min(3)
    .max(100)
    .description('The name of the community')
    .default('Gradido Entwicklung')
    .require(),  

  COMMUNITY_DESCRIPTION: Joi.string()
    .min(10)
    .max(300)
    .description('A short description of the community')
    .default('Die lokale Entwicklungsumgebung von Gradido.')
    .require(),

  COMMUNITY_SUPPORT_MAIL: Joi.string()
    .email()
    .description('The support email address for the community will be used in frontend and E-Mails')
    .default('support@supportmail.com')
    .require(),

  COMMUNITY_LOCATION: Joi.string()
    .pattern(/^[-+]?[0-9]{1,2}(\.[0-9]+)?,\s?[-+]?[0-9]{1,3}(\.[0-9]+)?$/)
    // TODO: ask chatgpt for the correct way
    .when('GMS_ACTIVE', {
      is: true,
      then: Joi.string().require(),
      otherwise: Joi.string().optional()
    })
    .description('Geographical location of the community in "latitude, longitude" format')
    .default('49.280377, 9.690151')
    .require(),
  
  GRAPHIQL: Joi.boolean()
    .description('Flag for enabling graphql playground for debugging.')
    .default(false)
    .require(), // todo: only allow true in development mode

  GMS_ACTIVE: Joi.boolean()
    .description('Flag to indicate if the GMS (Geographic Member Search) service is used.')
    .default(false)
    .require(),

  HUMHUB_ACTIVE: Joi.boolean()
    .description('Flag to indicate if the HumHub based Community Server is used.')
    .default(false)
    .require(),

  LOG_LEVEL: Joi.string()
    .valid(['INFO', 'ERROR']) // TODO: lookup values
    .description('set log level')
    .default('INFO')
    .required(),

  DB_HOST: Joi.string()
    .uri({ scheme: ['http'] })
    .description("database host like 'localhost' or 'mariadb' in docker setup")
    .default('localhost')
    .required(),
  
DB_PORT: Joi.number()
  .integer()
  .min(1024)
  .max(49151)
  .description('database port, default: 3306')
  .default(3306)
  .required(), 

// TODO: check allowed users for mariadb
DB_USER: Joi.string()
  .description('database user name like root (default) or gradido')
  .default('root')
  .required(),

DB_PASSWORD: Joi.string()
  .description('database password')
  .default('')
  .required(),

DB_DATABASE: Joi.string()
  .description('database name like gradido_community')
  .default('gradido_community')
  .required(),
})