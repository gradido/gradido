// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import { LogLevel, validate } from 'config-schema'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()


const federation = {
  FEDERATION_BACKEND_SEND_ON_API: process.env.FEDERATION_BACKEND_SEND_ON_API ?? '1_0',
  FEDERATION_XCOM_SENDCOINS_ENABLED:
    process.env.FEDERATION_XCOM_SENDCOINS_ENABLED === 'true' || false,
  // default value for community-uuid is equal uuid of stage-3
  FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID:
    process.env.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID ?? '56a55482-909e-46a4-bfa2-cd025e894ebc',
  FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS: parseInt(
    process.env.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS ?? '3',
  ),
}

const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? 'localhost'
const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? `${URL_PROTOCOL}://${COMMUNITY_HOST}`

const community = {
  COMMUNITY_SUPPORT_MAIL: process.env.COMMUNITY_SUPPORT_MAIL ?? 'support@supportmail.com',
  COMMUNITY_URL,
}


const email = {
  EMAIL: process.env.EMAIL === 'true',
  EMAIL_LINK_FORGOTPASSWORD:
    COMMUNITY_URL + (process.env.EMAIL_LINK_FORGOTPASSWORD_PATH ?? '/forgot-password'),
  EMAIL_TLS: process.env.EMAIL_TLS !== 'false',
  EMAIL_TEST_MODUS: process.env.EMAIL_TEST_MODUS === 'true',
  EMAIL_TEST_RECEIVER: process.env.EMAIL_TEST_RECEIVER ?? 'stage1@gradido.net',
  EMAIL_USERNAME: process.env.EMAIL_USERNAME ?? '',
  EMAIL_SENDER: process.env.EMAIL_SENDER ?? 'info@gradido.net',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ?? '',
  EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST ?? 'mailserver',
  EMAIL_SMTP_PORT: Number(process.env.EMAIL_SMTP_PORT) || 1025,
}


export const CONFIG = {
  ...federation,
  ...community,
  ...email,
}
validate(schema, CONFIG)
