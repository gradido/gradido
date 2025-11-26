// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import { LogLevel, validate } from 'config-schema'
import dotenv from 'dotenv'

import { schema } from './schema'

dotenv.config()

const logging = {
  LOG4JS_CONFIG: process.env.LOG4JS_CONFIG ?? 'log4js-config.json',
  // default log level on production should be info
  // log level for default log4js-config.json, don't change existing log4js-config.json
  LOG_LEVEL: (process.env.LOG_LEVEL ?? 'info') as LogLevel,
  LOG_FILES_BASE_PATH: process.env.LOG_FILES_BASE_PATH ?? '../logs/backend',
}

const server = {
  PORT: process.env.PORT ?? 4000,
  JWT_SECRET: process.env.JWT_SECRET ?? 'secret123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '10m',
  REDEEM_JWT_TOKEN_EXPIRATION: process.env.REDEEM_JWT_TOKEN_EXPIRATION ?? '10m',
  GRAPHIQL: process.env.GRAPHIQL === 'true' || false,
  GDT_ACTIVE: process.env.GDT_ACTIVE === 'true' || false,
  GDT_API_URL: process.env.GDT_API_URL ?? 'https://gdt.gradido.net',
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const klicktipp = {
  KLICKTIPP: process.env.KLICKTIPP === 'true' || false,
  KLICKTTIPP_API_URL: process.env.KLICKTIPP_API_URL ?? 'https://api.klicktipp.com',
  KLICKTIPP_USER: process.env.KLICKTIPP_USER ?? 'gradido_test',
  KLICKTIPP_PASSWORD: process.env.KLICKTIPP_PASSWORD ?? 'secret321',
  KLICKTIPP_APIKEY_DE: process.env.KLICKTIPP_APIKEY_DE ?? 'SomeFakeKeyDE',
  KLICKTIPP_APIKEY_EN: process.env.KLICKTIPP_APIKEY_EN ?? 'SomeFakeKeyEN',
}

const COMMUNITY_HOST = process.env.COMMUNITY_HOST ?? 'localhost'
const URL_PROTOCOL = process.env.URL_PROTOCOL ?? 'http'
const COMMUNITY_URL = process.env.COMMUNITY_URL ?? `${URL_PROTOCOL}://${COMMUNITY_HOST}`
const DLT_CONNECTOR_PORT = process.env.DLT_CONNECTOR_PORT ?? 6010

const dltConnector = {
  DLT_CONNECTOR: process.env.DLT_CONNECTOR === 'true' || false,
  DLT_CONNECTOR_URL: process.env.DLT_CONNECTOR_URL ?? `${COMMUNITY_URL}:${DLT_CONNECTOR_PORT}`,
  DLT_GRADIDO_NODE_SERVER_HOME_FOLDER: process.env.DLT_GRADIDO_NODE_SERVER_HOME_FOLDER ?? '~/.gradido',
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME ?? 'Gradido Entwicklung',
  COMMUNITY_URL,
  COMMUNITY_REDEEM_URL: COMMUNITY_URL + (process.env.COMMUNITY_REDEEM_PATH ?? '/redeem/'),
  COMMUNITY_REDEEM_CONTRIBUTION_URL:
    COMMUNITY_URL + (process.env.COMMUNITY_REDEEM_CONTRIBUTION_PATH ?? '/redeem/CL-'),
  COMMUNITY_DESCRIPTION:
    process.env.COMMUNITY_DESCRIPTION ?? 'Die lokale Entwicklungsumgebung von Gradido.',
  COMMUNITY_SUPPORT_MAIL: process.env.COMMUNITY_SUPPORT_MAIL ?? 'support@supportmail.com',
}

const loginServer = {
  LOGIN_APP_SECRET: process.env.LOGIN_APP_SECRET ?? '21ffbbc616fe',
  LOGIN_SERVER_KEY: process.env.LOGIN_SERVER_KEY ?? 'a51ef8ac7ef1abf162fb7a65261acd7a',
  USE_CRYPTO_WORKER: process.env.USE_CRYPTO_WORKER === 'true',
}

const email = {
  EMAIL_LINK_VERIFICATION:
    COMMUNITY_URL + (process.env.EMAIL_LINK_VERIFICATION_PATH ?? '/checkEmail/'),
  EMAIL_LINK_SETPASSWORD:
    COMMUNITY_URL + (process.env.EMAIL_LINK_SETPASSWORD_PATH ?? '/reset-password/'),
  EMAIL_LINK_OVERVIEW: COMMUNITY_URL + (process.env.EMAIL_LINK_OVERVIEW_PATH ?? '/overview'),
  // time in minutes a optin code is valid
  EMAIL_CODE_VALID_TIME: process.env.EMAIL_CODE_VALID_TIME
    ? (parseInt(process.env.EMAIL_CODE_VALID_TIME) ?? 1440)
    : 1440,
  // time in minutes that must pass to request a new optin code
  EMAIL_CODE_REQUEST_TIME: process.env.EMAIL_CODE_REQUEST_TIME
    ? (parseInt(process.env.EMAIL_CODE_REQUEST_TIME) ?? 10)
    : 10,
}

const webhook = {
  // Elopage
  WEBHOOK_ELOPAGE_SECRET: process.env.WEBHOOK_ELOPAGE_SECRET ?? 'secret',
}

// This is needed by graphql-directive-auth
process.env.APP_SECRET = server.JWT_SECRET

const federation = {
  FEDERATION_VALIDATE_COMMUNITY_TIMER: Number(
    process.env.FEDERATION_VALIDATE_COMMUNITY_TIMER ?? 60000,
  ),
}

const gms = {
  GMS_ACTIVE: process.env.GMS_ACTIVE === 'true' || false,
  GMS_CREATE_USER_THROW_ERRORS: process.env.GMS_CREATE_USER_THROW_ERRORS === 'true' || false,
  // koordinates of Illuminz-instance of GMS
  GMS_API_URL: process.env.GMS_API_URL ?? 'http://localhost:4044/',
  GMS_DASHBOARD_URL: process.env.GMS_DASHBOARD_URL ?? 'http://localhost:8080/',
  GMS_USER_SEARCH_FRONTEND_ROUTE: process.env.GMS_USER_SEARCH_FRONTEND_ROUTE ?? 'user-search',
  // used as secret postfix attached at the gms community-auth-url endpoint ('/hook/gms/' + 'secret')
  GMS_WEBHOOK_SECRET: process.env.GMS_WEBHOOK_SECRET ?? 'secret',
}

const humhub = {
  HUMHUB_ACTIVE: process.env.HUMHUB_ACTIVE === 'true' || false,
  HUMHUB_API_URL: process.env.HUMHUB_API_URL ?? COMMUNITY_URL + '/community/',
  HUMHUB_JWT_KEY: process.env.HUMHUB_JWT_KEY ?? '',
}

const openai = {
  OPENAI_ACTIVE: process.env.OPENAI_ACTIVE === 'true' || false,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? '',
  OPENAI_ASSISTANT_ID: process.env.OPENAI_ASSISTANT_ID ?? '',
}

export const CONFIG = {
  ...logging,
  ...server,
  ...klicktipp,
  ...dltConnector,
  ...community,
  ...email,
  ...loginServer,
  ...webhook,
  ...federation,
  ...gms,
  ...humhub,
  ...openai,
}
validate(schema, CONFIG)
