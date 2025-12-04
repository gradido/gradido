import { COMMUNITY_SUPPORT_MAIL, COMMUNITY_URL, NODE_ENV } from 'config-schema'
import Joi from 'joi'

export const schema = Joi.object({
  COMMUNITY_SUPPORT_MAIL,
  COMMUNITY_URL,
  NODE_ENV,

  EMAIL: Joi.boolean()
    .default(false)
    .description('Enable or disable email functionality')
    .required(),

  EMAIL_LINK_FORGOTPASSWORD: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .custom((value: string, helpers: Joi.CustomHelpers<string>): string | Joi.ErrorReport => {
      if (!value.startsWith(helpers.state.ancestors[0].COMMUNITY_URL)) {
        return helpers.error('string.pattern.base', { value, communityUrl: COMMUNITY_URL })
      }
      return value
    })
    .description('Email Verification link for set new Password, when old Password was forgotten.')
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

  FEDERATION_BACKEND_SEND_ON_API: Joi.string()
    .pattern(/^\d+_\d+$/)
    .default('1_0')
    .description('API Version of sending requests to another communities, e.g., "1_0"')
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
})
