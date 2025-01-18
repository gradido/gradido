const Joi = require('joi')

module.exports = {
  BROWSER_PROTOCOL: Joi.string()
    .valid('http', 'https')
    .description(
      'Protocol for all URLs in the browser, must be either http or https to prevent mixed content issues.',
    )
    .default('http')
    .required(),

  COMMUNITY_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('BROWSER_PROTOCOL', {
      is: 'https',
      then: Joi.string().uri({ scheme: 'https' }), 
      otherwise: Joi.string().uri({ scheme: 'http' }),
    })
    .description('The base URL of the community, should have the same scheme like frontend, admin and backend api to prevent mixed contend issues.')
    .default('http://0.0.0.0')
    .required(),

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
    .required(),

  COMMUNITY_NAME: Joi.string()
    .min(3)
    .max(100)
    .description('The name of the community')
    .default('Gradido Entwicklung')
    .required(),  

  COMMUNITY_DESCRIPTION: Joi.string()
    .min(10)
    .max(300)
    .description('A short description of the community')
    .default('Die lokale Entwicklungsumgebung von Gradido.')
    .required(),

  COMMUNITY_SUPPORT_MAIL: Joi.string()
    .email()
    .description('The support email address for the community will be used in frontend and E-Mails')
    .default('support@supportmail.com')
    .required(),

  COMMUNITY_LOCATION: Joi.string()
    .pattern(/^[-+]?[0-9]{1,2}(\.[0-9]+)?,\s?[-+]?[0-9]{1,3}(\.[0-9]+)?$/)
    .when('GMS_ACTIVE', {
      is: true,
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    })
    .description('Geographical location of the community in "latitude, longitude" format')
    .default('49.280377, 9.690151'),    
  
    GRAPHIQL: Joi.boolean()
      .description('Flag for enabling GraphQL playground for debugging.')
      .default(false)
      .when('NODE_ENV', {
        is: 'development',
        then: Joi.boolean().valid(true).required(), // only allow true in development mode
        otherwise: Joi.boolean().valid(false).required() // false in any other mode
      }),

  GMS_ACTIVE: Joi.boolean()
    .description('Flag to indicate if the GMS (Geographic Member Search) service is used.')
    .default(false)
    .required(),

  HUMHUB_ACTIVE: Joi.boolean()
    .description('Flag to indicate if the HumHub based Community Server is used.')
    .default(false)
    .required(),

  LOG_LEVEL: Joi.string()
    .valid('all', 'mark', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off') 
    .description('set log level')
    .default('info')
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

  
  DB_USER: Joi.string()
    .pattern(/^[A-Za-z0-9]([A-Za-z0-9-_\.]*[A-Za-z0-9])?$/) // Validates MariaDB username rules
    .min(1)  // Minimum length 1
    .max(16) // Maximum length 16
    .message(
      'Valid database username (letters, numbers, hyphens, underscores, dots allowed; no spaces, must not start or end with hyphen, dot, or underscore)'
    )
    .description('database username for mariadb')
    .default('root')
    .required(),

  DB_PASSWORD: Joi.string()
    .when(Joi.ref('NODE_ENV'), {
      is: 'development',
      then: Joi.string().allow(''), 
      otherwise: Joi.string()
        .min(8) 
        .max(32)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).+$/)
        .message(
          'Password must be between 8 and 32 characters long, and contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g., !@#$%^&*).'
        )
    })
    .description(
      'Password for the database user. In development mode, an empty password is allowed. In other environments, a complex password is required.'
    )
    .default('') 
    .required(),

  DB_DATABASE: Joi.string()
    .pattern(/^[a-zA-Z][a-zA-Z0-9_-]{1,63}$/)
    .description('Database name like gradido_community (must start with a letter, and can only contain letters, numbers, underscores, or dashes)')
    .default('gradido_community')
    .required(),

  APP_VERSION: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .message('Version must be in the format "major.minor.patch" (e.g., "2.4.1")')
    .description('App Version from package.json, alle modules share one version')
    .required(),

  BUILD_COMMIT: Joi.string()
    .pattern(/^[0-9a-f]{40}$/)
    .message('The commit hash must be a 40-character hexadecimal string.')
    .description('The full git commit hash.')    
    .optional(),

  BUILD_COMMIT_SHORT: Joi.string()
    .pattern(/^[0-9a-f]{7}$/)
    .message('The first 7 hexadecimal character from git commit hash.')
    .description('A short version from the git commit hash.')    
    .required(),

  NODE_ENV: Joi.string()
    .valid('production', 'development')
    .default('development')
    .description('Specifies the environment in which the application is running, "production" or "development".'),

  DEBUG: Joi.boolean()
    .description('Indicates whether the application is in debugging mode. Set to true when NODE_ENV is not "production".')
    .default(false)
    .required(),
    
  PRODUCTION: Joi.boolean()
    .default(false)
    .description('Indicates whether the application is running in production mode. Set to true when NODE_ENV is "production".')
    .required(),
}