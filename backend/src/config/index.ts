// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)
/* eslint-disable n/no-process-env */

import { Decimal } from 'decimal.js-light'
import dotenv from 'dotenv'

dotenv.config()

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})

const constants = {
  DB_VERSION: '0071-add-pending_transactions-table',
  DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v19.2023-08-25',
    CURRENT: '',
  },
}

const server = {
  PORT: process.env.PORT ?? 4000,
  JWT_SECRET: process.env.JWT_SECRET ?? 'secret123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '10m',
  GRAPHIQL: process.env.GRAPHIQL === 'true' || false,
  GDT_API_URL: process.env.GDT_API_URL ?? 'https://gdt.gradido.net',
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const database = {
  DB_HOST: process.env.DB_HOST ?? 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER ?? 'root',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_DATABASE: process.env.DB_DATABASE ?? 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH: process.env.TYPEORM_LOGGING_RELATIVE_PATH ?? 'typeorm.backend.log',
}

const klicktipp = {
  KLICKTIPP: process.env.KLICKTIPP === 'true' || false,
  KLICKTTIPP_API_URL: process.env.KLICKTIPP_API_URL ?? 'https://api.klicktipp.com',
  KLICKTIPP_USER: process.env.KLICKTIPP_USER ?? 'gradido_test',
  KLICKTIPP_PASSWORD: process.env.KLICKTIPP_PASSWORD ?? 'secret321',
  KLICKTIPP_APIKEY_DE: process.env.KLICKTIPP_APIKEY_DE ?? 'SomeFakeKeyDE',
  KLICKTIPP_APIKEY_EN: process.env.KLICKTIPP_APIKEY_EN ?? 'SomeFakeKeyEN',
}

const dltConnector = {
  DLT_CONNECTOR: process.env.DLT_CONNECTOR === 'true' || false,
  DLT_CONNECTOR_URL: process.env.DLT_CONNECTOR_URL ?? 'http://localhost:6010',
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME ?? 'Gradido Entwicklung',
  COMMUNITY_URL: process.env.COMMUNITY_URL ?? 'http://localhost/',
  COMMUNITY_REGISTER_URL: process.env.COMMUNITY_REGISTER_URL ?? 'http://localhost/register',
  COMMUNITY_REDEEM_URL: process.env.COMMUNITY_REDEEM_URL ?? 'http://localhost/redeem/{code}',
  COMMUNITY_REDEEM_CONTRIBUTION_URL:
    process.env.COMMUNITY_REDEEM_CONTRIBUTION_URL ?? 'http://localhost/redeem/CL-{code}',
  COMMUNITY_DESCRIPTION:
    process.env.COMMUNITY_DESCRIPTION ?? 'Die lokale Entwicklungsumgebung von Gradido.',
  COMMUNITY_SUPPORT_MAIL: process.env.COMMUNITY_SUPPORT_MAIL ?? 'support@supportmail.com',
}

const loginServer = {
  LOGIN_APP_SECRET: process.env.LOGIN_APP_SECRET ?? '21ffbbc616fe',
  LOGIN_SERVER_KEY: process.env.LOGIN_SERVER_KEY ?? 'a51ef8ac7ef1abf162fb7a65261acd7a',
}

const email = {
  EMAIL: process.env.EMAIL === 'true' || false,
  EMAIL_TEST_MODUS: process.env.EMAIL_TEST_MODUS === 'true' || false,
  EMAIL_TEST_RECEIVER: process.env.EMAIL_TEST_RECEIVER ?? 'stage1@gradido.net',
  EMAIL_USERNAME: process.env.EMAIL_USERNAME ?? '',
  EMAIL_SENDER: process.env.EMAIL_SENDER ?? 'info@gradido.net',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ?? '',
  EMAIL_SMTP_URL: process.env.EMAIL_SMTP_URL ?? 'mailserver',
  EMAIL_SMTP_PORT: Number(process.env.EMAIL_SMTP_PORT) || 1025,
  // eslint-disable-next-line no-unneeded-ternary
  EMAIL_TLS: process.env.EMAIL_TLS === 'false' ? false : true,
  EMAIL_LINK_VERIFICATION:
    process.env.EMAIL_LINK_VERIFICATION ?? 'http://localhost/checkEmail/{optin}{code}',
  EMAIL_LINK_SETPASSWORD:
    process.env.EMAIL_LINK_SETPASSWORD ?? 'http://localhost/reset-password/{optin}',
  EMAIL_LINK_FORGOTPASSWORD:
    process.env.EMAIL_LINK_FORGOTPASSWORD ?? 'http://localhost/forgot-password',
  EMAIL_LINK_OVERVIEW: process.env.EMAIL_LINK_OVERVIEW ?? 'http://localhost/overview',
  // time in minutes a optin code is valid
  EMAIL_CODE_VALID_TIME: process.env.EMAIL_CODE_VALID_TIME
    ? parseInt(process.env.EMAIL_CODE_VALID_TIME) || 1440
    : 1440,
  // time in minutes that must pass to request a new optin code
  EMAIL_CODE_REQUEST_TIME: process.env.EMAIL_CODE_REQUEST_TIME
    ? parseInt(process.env.EMAIL_CODE_REQUEST_TIME) || 10
    : 10,
}

const webhook = {
  // Elopage
  WEBHOOK_ELOPAGE_SECRET: process.env.WEBHOOK_ELOPAGE_SECRET ?? 'secret',
}

// This is needed by graphql-directive-auth
process.env.APP_SECRET = server.JWT_SECRET

// Check config version
constants.CONFIG_VERSION.CURRENT = process.env.CONFIG_VERSION ?? constants.CONFIG_VERSION.DEFAULT
if (
  ![constants.CONFIG_VERSION.EXPECTED, constants.CONFIG_VERSION.DEFAULT].includes(
    constants.CONFIG_VERSION.CURRENT,
  )
) {
  throw new Error(
    `Fatal: Config Version incorrect - expected "${constants.CONFIG_VERSION.EXPECTED}" or "${constants.CONFIG_VERSION.DEFAULT}", but found "${constants.CONFIG_VERSION.CURRENT}"`,
  )
}

const federation = {
  FEDERATION_VALIDATE_COMMUNITY_TIMER:
    Number(process.env.FEDERATION_VALIDATE_COMMUNITY_TIMER) || 60000,
  // default value for community-uuid is equal uuid of stage-3
  FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID:
    process.env.FEDERATION_XCOM_RECEIVER_COMMUNITY_UUID ?? '56a55482-909e-46a4-bfa2-cd025e894ebc',
  FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS:
    process.env.FEDERATION_XCOM_MAXREPEAT_REVERTSENDCOINS ?? 3,
}

export const CONFIG = {
  ...constants,
  ...server,
  ...database,
  ...klicktipp,
  ...dltConnector,
  ...community,
  ...email,
  ...loginServer,
  ...webhook,
  ...federation,
}
