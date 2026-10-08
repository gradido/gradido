import {
  booleanSchema,
  COMMUNITY_HOST,
  COMMUNITY_SUPPORT_MAIL,
  COMMUNITY_URL,
  communityUrlOf,
  configRule,
  DLT_ACTIVE,
  DLT_CONNECTOR_URL,
  emailSchema,
  hexSchema,
  hostnameSchema,
  integerSchema,
  NODE_ENV,
  nonEmptyStringSchema,
  requiredWhen,
  URL_PROTOCOL,
  uuidSchema,
} from 'config-schema'
import * as v from 'valibot'

// What the environment can set, and the value used where it does not. CONFIG is read straight
// out of process.env with this, so the keys are the variable names.

const SMTP_USERNAME = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const SMTP_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/

const environment = v.object({
  NODE_ENV,

  FEDERATION_BACKEND_SEND_ON_API: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.regex(/^\d+_\d+$/),
      v.description('API Version of sending requests to another communities, e.g., "1_0"'),
    ),
    '1_0',
  ),
  FEDERATION_XCOM_SENDCOINS_ENABLED: v.optional(
    v.pipe(booleanSchema, v.description('Enable or disable the federation send coins feature')),
    false,
  ),
  // default value for community-uuid is equal uuid of stage-3
  FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID: v.optional(
    v.pipe(
      uuidSchema,
      v.description(
        'UUID of the receiver community for federation cross-community transactions if the receiver is unknown',
      ),
    ),
    '56a55482-909e-46a4-bfa2-cd025e894ebc',
  ),
  FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS: v.optional(
    v.pipe(
      integerSchema,
      v.minValue(0),
      v.description('Maximum number of retries for reverting send coins transactions'),
    ),
    3,
  ),

  COMMUNITY_HOST,
  URL_PROTOCOL,
  COMMUNITY_URL: v.optional(COMMUNITY_URL),
  COMMUNITY_SUPPORT_MAIL: v.optional(COMMUNITY_SUPPORT_MAIL, 'support@supportmail.com'),
  HOME_COMMUNITY_SEED: v.optional(
    v.pipe(hexSchema, v.length(64), v.description('expect seed length 64 characters (32 Bytes)')),
  ),

  EMAIL: v.optional(
    v.pipe(booleanSchema, v.description('Enable or disable email functionality')),
    false,
  ),
  EMAIL_LINK_FORGOTPASSWORD_PATH: v.optional(
    v.pipe(
      v.string(),
      v.description(
        'Path of the link to set a new password when the old one was forgotten, behind COMMUNITY_URL',
      ),
    ),
    '/forgot-password',
  ),
  EMAIL_TLS: v.optional(
    v.pipe(booleanSchema, v.description('Enable or disable TLS for SMTP')),
    true,
  ),
  EMAIL_TEST_MODUS: v.optional(
    v.pipe(
      booleanSchema,
      v.description('When enabled, all emails are sended to EMAIL_TEST_RECEIVER'),
    ),
    false,
  ),
  EMAIL_TEST_RECEIVER: v.optional(
    v.pipe(emailSchema, v.description('Email address used in test mode')),
    'stage1@gradido.net',
  ),
  // the rule below asks for it with EMAIL on outside development
  EMAIL_USERNAME: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.description('Username for SMTP authentication (optional in development)'),
    ),
  ),
  EMAIL_SENDER: v.optional(
    v.pipe(emailSchema, v.description('Email address used as sender')),
    'info@gradido.net',
  ),
  // the rule below asks for it with EMAIL on outside development
  EMAIL_PASSWORD: v.optional(
    v.pipe(
      nonEmptyStringSchema,
      v.description('Password for SMTP authentication (optional in development)'),
    ),
  ),
  EMAIL_SMTP_HOST: v.optional(
    v.pipe(hostnameSchema, v.description('SMTP server hostname')),
    'mailserver',
  ),
  EMAIL_SMTP_PORT: v.optional(
    v.pipe(integerSchema, v.minValue(1), v.description('SMTP server port')),
    1025,
  ),

  DLT_ACTIVE: v.optional(DLT_ACTIVE, false),
  DLT_CONNECTOR_URL: v.optional(DLT_CONNECTOR_URL, 'http://localhost:6010'),
})

export const schema = v.pipe(
  environment,
  v.transform((env) => {
    const COMMUNITY_URL = communityUrlOf(env)
    return {
      ...env,
      COMMUNITY_URL,
      EMAIL_LINK_FORGOTPASSWORD: COMMUNITY_URL + env.EMAIL_LINK_FORGOTPASSWORD_PATH,
    }
  }),
  requiredWhen('HOME_COMMUNITY_SEED', 'DLT_ACTIVE'),
  // with email on outside development, the SMTP login has to be set and well-formed
  configRule(
    'EMAIL_USERNAME',
    (config) =>
      !config.EMAIL ||
      config.NODE_ENV === 'development' ||
      (config.EMAIL_USERNAME !== undefined && SMTP_USERNAME.test(config.EMAIL_USERNAME)),
    'Valid SMTP username required in production',
  ),
  configRule(
    'EMAIL_PASSWORD',
    (config) =>
      !config.EMAIL ||
      config.NODE_ENV === 'development' ||
      (config.EMAIL_PASSWORD !== undefined && SMTP_PASSWORD.test(config.EMAIL_PASSWORD)),
    'Password must be at least 8 characters long, include uppercase and lowercase letters, a number, and a special character',
  ),
)
