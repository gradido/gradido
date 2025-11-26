import Joi from 'joi'

export const browserUrls = Joi.array()
  .items(Joi.string().uri())
  .sparse(true)
  .custom((value: string[], helpers: Joi.CustomHelpers<string[]>) => {
    let protocol: string | undefined
    for (const url of value) {
      if (url === undefined) {
        continue
      }
      const urlObject = new URL(url)
      if (!protocol) {
        protocol = urlObject.protocol
      } else if (urlObject.protocol !== protocol) {
        return helpers.error('any.invalid')
      }
    }
    return value
  })
  .required()
  .description('All URLs need to have same protocol to prevent mixed block errors')

export const COMMUNITY_URL = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .custom((value: string, helpers: Joi.CustomHelpers<string>) => {
    if (value.endsWith('/')) {
      return helpers.error('any.invalid', { message: 'URL should not end with a slash (/)' })
    }
    return value
  })
  .description(
    'The base URL of the community, should have the same protocol as frontend, admin and backend api to prevent mixed contend issues.',
  )
  .default('http://0.0.0.0')
  .required()

export const DLT_ACTIVE = Joi.boolean()
  .description('Flag to indicate if the DLT (Decentralized Ledger Technology) service is used.')
  .default(false)
  .required()

export const GRAPHQL_URI = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .description(
    `
    The external URL of the backend service,
    accessible from outside the server (e.g., via Nginx or the server's public URL),
    should have the same protocol as frontend and admin to prevent mixed contend issues.
  `,
  )
  .default('http://0.0.0.0/graphql')
  .required()

export const COMMUNITY_NAME = Joi.string()
  .min(3)
  .max(40)
  .description('The name of the community')
  .default('Gradido Entwicklung')
  .required()

export const COMMUNITY_DESCRIPTION = Joi.string()
  .min(10)
  .max(255)
  .description('A short description of the community')
  .default('Die lokale Entwicklungsumgebung von Gradido.')
  .required()

export const COMMUNITY_SUPPORT_MAIL = Joi.string()
  .email()
  .description('The support email address for the community will be used in frontend and E-Mails')
  .default('support@supportmail.com')
  .required()

export const COMMUNITY_LOCATION = Joi.string()
  .pattern(/^[-+]?[0-9]{1,2}(\.[0-9]+)?,\s?[-+]?[0-9]{1,3}(\.[0-9]+)?$/)
  .when('GMS_ACTIVE', {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.string().optional(),
  })
  .description('Geographical location of the community in "latitude, longitude" format')
  .default('49.280377, 9.690151')

export const GRAPHIQL = Joi.boolean()
  .description('Flag for enabling GraphQL playground for debugging.')
  .default(false)
  .when('NODE_ENV', {
    is: 'development',
    then: Joi.boolean().valid(true, false).required(), // only allow true in development mode
    otherwise: Joi.boolean().valid(false).required(), // false in any other mode
  })

export const GMS_ACTIVE = Joi.boolean()
  .description('Flag to indicate if the GMS (Geographic Member Search) service is used.')
  .default(false)
  .required()

export const GDT_ACTIVE = Joi.boolean()
  .description('Flag to indicate if the GDT (Gradido Transform) service is used.')
  .default(false)
  .required()

export const GDT_API_URL = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .default('https://gdt.gradido.net')
  .when('GDT_ACTIVE', { is: true, then: Joi.required() })
  .description('The URL for GDT API endpoint')

export const HUMHUB_ACTIVE = Joi.boolean()
  .description('Flag to indicate if the HumHub based Community Server is used.')
  .default(false)
  .required()

export const HUMHUB_API_URL = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .when('HUMHUB_ACTIVE', { is: true, then: Joi.required(), otherwise: Joi.optional() })
  .description('The API URL for HumHub integration')

export const LOG_LEVEL = Joi.string()
  .valid('all', 'mark', 'trace', 'debug', 'info', 'warn', 'error', 'fatal', 'off')
  .description('set log level')
  .default('info')
  .required()

export const LOG4JS_CONFIG = Joi.string()
  .pattern(/^[a-zA-Z0-9-_]+\.json$/)
  .message('LOG4JS_CONFIG must be a valid filename ending with .json')
  .description('config file name for log4js config file')
  .default('log4js-config.json')
  .required()

export const LOG4JS_CONFIG_PLACEHOLDER = Joi.string()
  .pattern(/^[a-zA-Z0-9-_]+(%v)?\.json$/)
  .message(
    'LOG4JS_CONFIG_PLACEHOLDER must be a valid filename ending with .json can contain %v as API Version placeholder before ending',
  )
  .description('config file name for log4js config file')
  .default('log4js-config.json')
  .required()

export const LOG_FILES_BASE_PATH = Joi.string()
  .pattern(/^[a-zA-Z0-9-_\/\.]+$/)
  .message('LOG_FILES_BASE_PATH must be a valid folder name, relative or absolute')
  .description('log folder name for module log files')
  .default('../logs/backend')
  .optional()

export const LOGIN_APP_SECRET = Joi.string()
  .pattern(/^[a-fA-F0-9]+$/)
  .message('need to be valid hex')
  .default('21ffbbc616fe')
  .description('App secret for salt component for libsodium crypto_pwhash')
  .required()

export const LOGIN_SERVER_KEY = Joi.string()
  .pattern(/^[a-fA-F0-9]+$/)
  .length(32)
  .message('need to be valid hex and 32 character')
  .default('a51ef8ac7ef1abf162fb7a65261acd7a')
  .description(
    'Server key for password hashing as additional salt for libsodium crypto_shorthash_keygen',
  )
  .required()

export const OPENAI_ACTIVE = Joi.boolean()
  .default(false)
  .description('Flag to enable or disable OpenAI API')
  .required()

export const APP_VERSION = Joi.string()
  .pattern(/^\d+\.\d+\.\d+$/)
  .message('Version must be in the format "major.minor.patch" (e.g., "2.4.1")')
  .description('App Version from package.json, alle modules share one version')
  .required()

export const BUILD_COMMIT = Joi.string()
  .pattern(/^[0-9a-f]{40}$/)
  .message('The commit hash must be a 40-character hexadecimal string.')
  .description('The full git commit hash.')
  .optional()

export const BUILD_COMMIT_SHORT = Joi.string()
  .pattern(/^[0-9a-f]{7}$/)
  .message('The first 7 hexadecimal character from git commit hash.')
  .description('A short version from the git commit hash.')
  .required()

export const NODE_ENV = Joi.string()
  .valid('production', 'development', 'test')
  .default('development')
  .description('Specifies the environment in which the application is running.')

export const DEBUG = Joi.boolean()
  .description(
    'Indicates whether the application is in debugging mode. Set to true when NODE_ENV is not "production".',
  )
  .default(false)
  .required()

export const PRODUCTION = Joi.boolean()
  .default(false)
  .description(
    'Indicates whether the application is running in production mode. Set to true when NODE_ENV is "production".',
  )
  .required()
