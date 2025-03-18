/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// eslint-disable-next-line import/no-unresolved
import {
  COMMUNITY_NAME,
  COMMUNITY_URL,
  COMMUNITY_DESCRIPTION,
  COMMUNITY_SUPPORT_MAIL,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  DB_VERSION,
  DB_DATABASE,
  DECAY_START_TIME,
  GDT_API_URL,
  GDT_ACTIVE,
  GMS_ACTIVE,
  GRAPHIQL,
  HUMHUB_ACTIVE,
  HUMHUB_API_URL,
  LOG4JS_CONFIG,
  LOGIN_APP_SECRET,
  LOGIN_SERVER_KEY,
  LOG_LEVEL,
  NODE_ENV,
  OPENAI_ACTIVE,
  PRODUCTION,
  TYPEORM_LOGGING_RELATIVE_PATH,
} from '@config/commonSchema'
import Joi from 'joi'

export const schema = Joi.object({
  COMMUNITY_NAME,
  COMMUNITY_URL,
  COMMUNITY_DESCRIPTION,
  COMMUNITY_SUPPORT_MAIL,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  DB_VERSION,
  DB_DATABASE,
  DECAY_START_TIME,
  GDT_API_URL,
  GDT_ACTIVE,
  GMS_ACTIVE,
  GRAPHIQL,
  HUMHUB_ACTIVE,
  HUMHUB_API_URL,
  LOG4JS_CONFIG,
  LOGIN_APP_SECRET,
  LOGIN_SERVER_KEY,
  LOG_LEVEL,
  NODE_ENV,
  OPENAI_ACTIVE,
  PRODUCTION,
  TYPEORM_LOGGING_RELATIVE_PATH,

  COMMUNITY_REDEEM_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .description('The url for redeeming link transactions, must start with frontend base url')
    .default('http://0.0.0.0/redeem/')
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .required(),

  COMMUNITY_REDEEM_CONTRIBUTION_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .description(
      'The url for redeeming contribution link transactions, must start with frontend base url.',
    )
    .default('http://0.0.0.0/redeem/CL-')
    .required(),

  DLT_CONNECTOR: Joi.boolean()
    .description('Flag to indicate if DLT-Connector is used. (Still in development)')
    .default(false)
    .required(),

  DLT_CONNECTOR_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:6010')
    .when('DLT_CONNECTOR', { is: true, then: Joi.required() })
    .description('The URL for GDT API endpoint'),

  EMAIL: Joi.boolean()
    .default(false)
    .description('Enable or disable email functionality')
    .required(),

  EMAIL_TEST_MODUS: Joi.boolean()
    .default(false)
    .description('When enabled, all emails are sended to EMAIL_TEST_RECEIVER')
    .optional(),

  EMAIL_TEST_RECEIVER: Joi.string()
    .email()
    .default('stage1@gradido.net')
    .when('EMAIL_TEST_MODUS', { is: true, then: Joi.required() })
    .description('Email address used in test mode'),

  EMAIL_USERNAME: Joi.alternatives().conditional(Joi.ref('EMAIL'), {
    is: true,
    then: Joi.alternatives().conditional(Joi.ref('NODE_ENV'), {
      is: 'development',
      then: Joi.string()
        .allow('')
        .description('Username for SMTP authentication (optional in development)'),
      otherwise: Joi.string()
        .pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        .description('Valid SMTP username required in production')
        .required(),
    }),
    otherwise: Joi.string().allow('').optional(),
  }),

  EMAIL_SENDER: Joi.string()
    .email()
    .when('EMAIL', { is: true, then: Joi.required() })
    .default('info@gradido.net')
    .description('Email address used as sender'),

  EMAIL_PASSWORD: Joi.alternatives().conditional(Joi.ref('EMAIL'), {
    is: true,
    then: Joi.alternatives().conditional(Joi.ref('NODE_ENV'), {
      is: 'development',
      then: Joi.string()
        .allow('')
        .description('Password for SMTP authentication (optional in development)'),
      otherwise: Joi.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/)
        .description(
          'Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character',
        )
        .required(),
    }),
    otherwise: Joi.string().allow('').optional(),
  }),

  EMAIL_SMTP_HOST: Joi.string()
    .hostname()
    .when('EMAIL', { is: true, then: Joi.required() })
    .default('mailserver')
    .description('SMTP server hostname'),

  EMAIL_SMTP_PORT: Joi.number()
    .integer()
    .positive()
    .when('EMAIL', { is: true, then: Joi.required() })
    .default(1025)
    .description('SMTP server port'),

  EMAIL_TLS: Joi.boolean().default(true).description('Enable or disable TLS for SMTP').optional(),

  EMAIL_LINK_VERIFICATION: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .description('Email Verification link for activate Email.')
    .required(),

  EMAIL_LINK_SETPASSWORD: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .description('Email Verification link for set initial Password.')
    .required(),

  EMAIL_LINK_FORGOTPASSWORD: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .description('Email Verification link for set new Password, when old Password was forgotten.')
    .required(),

  EMAIL_LINK_OVERVIEW: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .description('Link to Wallet Overview')
    .required(),

  EMAIL_CODE_VALID_TIME: Joi.number()
    .integer()
    .positive()
    .max(43200) // max at 30 days
    .default(1440)
    .description('Time in minutes a code is valid')
    .required(),

  EMAIL_CODE_REQUEST_TIME: Joi.number()
    .integer()
    .positive()
    .max(43200) // max at 30 days
    .default(10)
    .description('Time in minutes before a new code can be requested')
    .required(),

  FEDERATION_BACKEND_SEND_ON_API: Joi.string()
    .pattern(/^\d+_\d+$/)
    .default('1_0')
    .description('API Version of sending requests to another communities, e.g., "1_0"')
    .required(),

  FEDERATION_VALIDATE_COMMUNITY_TIMER: Joi.number()
    .integer()
    .min(1000)
    .default(60000)
    .description('Timer interval in milliseconds for community validation')
    .required(),

  FEDERATION_XCOM_SENDCOINS_ENABLED: Joi.boolean()
    .default(false)
    .description('Enable or disable the federation send coins feature')
    .optional(),

  FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID: Joi.string()
    .uuid()
    .default('56a55482-909e-46a4-bfa2-cd025e894ebc')
    .description(
      'UUID of the receiver community for federation cross-community transactions if the receiver is unknown',
    )
    .required(),

  FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS: Joi.number()
    .integer()
    .min(0)
    .default(3)
    .description('Maximum number of retries for reverting send coins transactions')
    .required(),

  GMS_CREATE_USER_THROW_ERRORS: Joi.boolean()
    .default(false)
    .when('GMS_ACTIVE', { is: true, then: Joi.required(), otherwise: Joi.optional() })
    .description('Whether errors should be thrown when creating users in GMS'),

  GMS_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('GMS_ACTIVE', { is: true, then: Joi.required(), otherwise: Joi.optional() })
    .default('http://localhost:4044/')
    .description('The API URL for the GMS service'),

  GMS_DASHBOARD_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('GMS_ACTIVE', { is: true, then: Joi.required(), otherwise: Joi.optional() })
    .default('http://localhost:8080/')
    .description('The URL for the GMS dashboard'),

  GMS_WEBHOOK_SECRET: Joi.string()
    .min(1)
    .default('secret')
    .when('GMS_ACTIVE', { is: true, then: Joi.required(), otherwise: Joi.optional() })
    .description('The secret postfix for the GMS webhook endpoint'),

  HUMHUB_JWT_KEY: Joi.string()
    .min(1)
    .when('HUMHUB_ACTIVE', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.string().allow('').optional(),
    })
    .description('JWT key for HumHub integration, must be the same as configured in humhub'),

  PORT: Joi.number()
    .integer()
    .min(1024)
    .max(49151)
    .description('Port for hosting backend, default: 4000')
    .default(4000)
    .required(),

  KLICKTIPP: Joi.boolean()
    .default(false)
    .description("Indicates whether Klicktipp integration is enabled, 'true' or 'false'"),

  KLICKTTIPP_API_URL: Joi.string()
    .uri({ scheme: ['https'] }) // Sicherstellen, dass es eine gültige HTTPS-URL ist
    .default('https://api.klicktipp.com')
    .description("The API URL for Klicktipp, must be a valid URL starting with 'https'"),

  KLICKTIPP_USER: Joi.string().default('gradido_test').description('The username for Klicktipp'),

  KLICKTIPP_PASSWORD: Joi.string()
    .min(6)
    .default('secret321')
    .description('The password for Klicktipp, should be at least 6 characters'),

  KLICKTIPP_APIKEY_DE: Joi.string()
    .default('SomeFakeKeyDE')
    .description('The API key for Klicktipp (German version)'),

  KLICKTIPP_APIKEY_EN: Joi.string()
    .default('SomeFakeKeyEN')
    .description('The API key for Klicktipp (English version)'),

  OPENAI_API_KEY: Joi.string()
    .pattern(/^sk-[A-Za-z0-9-_]{20,}$/)
    .when(Joi.ref('OPENAI_ACTIVE', { adjust: (v) => Boolean(v) }), {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description(
      'API key for OpenAI, must be at least 20 characters long and contain only alphanumeric characters, dashes, or underscores',
    ),

  OPENAI_ASSISTANT_ID: Joi.string()
    .pattern(/^asst_[A-Za-z0-9-]{20,}$/)
    .when(Joi.ref('OPENAI_ACTIVE', { adjust: (v) => Boolean(v) }), {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .description('Assistant ID for OpenAI'),

  USE_CRYPTO_WORKER: Joi.boolean()
    .default(false)
    .description(
      'Flag to enable or disable password encryption in separate thread, should be enabled if possible',
    ),

  // TODO: check format
  JWT_SECRET: Joi.string()
    .default('secret123')
    .description('jwt secret for jwt tokens used for login')
    .required(),

  JWT_EXPIRES_IN: Joi.alternatives()
    .try(
      Joi.string()
        .pattern(/^\d+[smhdw]$/) // Time specification such as “10m”, “1h”, “2d”, etc.
        .description('Expiration time for JWT login token, in format like "10m", "1h", "1d"')
        .default('10m'),
      Joi.number()
        .positive() // positive number to accept seconds
        .description('Expiration time for JWT login token in seconds'),
    )
    .required()
    .description('Time for JWT token to expire, auto logout'),

  WEBHOOK_ELOPAGE_SECRET: Joi.string().description("isn't really used any more").optional(),
})
