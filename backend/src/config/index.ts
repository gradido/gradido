// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)

import dotenv from 'dotenv'
dotenv.config()

const server = {
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'secret123',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '10m',
  GRAPHIQL: process.env.GRAPHIQL === 'true' || false,
  LOGIN_API_URL: process.env.LOGIN_API_URL || 'http://login-server:1201/',
  COMMUNITY_API_URL: process.env.COMMUNITY_API_URL || 'http://nginx/api/',
  GDT_API_URL: process.env.GDT_API_URL || 'https://gdt.gradido.net',
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}

const database = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_community',
}

const klicktipp = {
  KLICKTIPP: process.env.KLICKTIPP === 'true' || false,
  KLICKTTIPP_API_URL: process.env.KLICKTIPP_API_URL || 'https://api.klicktipp.com',
  KLICKTIPP_USER: process.env.KLICKTIPP_USER || 'gradido_test',
  KLICKTIPP_PASSWORD: process.env.KLICKTIPP_PASSWORD || 'secret321',
  KLICKTIPP_APIKEY_DE: process.env.KLICKTIPP_APIKEY_DE || 'SomeFakeKeyDE',
  KLICKTIPP_APIKEY_EN: process.env.KLICKTIPP_APIKEY_EN || 'SomeFakeKeyEN',
}

const community = {
  COMMUNITY_NAME: process.env.COMMUNITY_NAME || 'Gradido Entwicklung',
  COMMUNITY_URL: process.env.COMMUNITY_URL || 'http://localhost/vue/',
  COMMUNITY_REGISTER_URL: process.env.COMMUNITY_REGISTER_URL || 'http://localhost/vue/register',
  COMMUNITY_DESCRIPTION:
    process.env.COMMUNITY_DESCRIPTION || 'Die lokale Entwicklungsumgebung von Gradido.',
}

const loginServer = {
  LOGIN_APP_SECRET: process.env.LOGIN_APP_SECRET || '21ffbbc616fe',
  LOGIN_SERVER_KEY: process.env.LOGIN_SERVER_KEY || 'a51ef8ac7ef1abf162fb7a65261acd7a',
}

const email = {
  EMAIL: process.env.EMAIL === 'true' || false,
  EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'gradido_email',
  EMAIL_SENDER: process.env.EMAIL_SENDER || 'info@gradido.net',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'xxx',
  EMAIL_SMTP_URL: process.env.EMAIL_SMTP_URL || 'gmail.com',
  EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT || '587',
  EMAIL_LINK_VERIFICATION:
    process.env.EMAIL_LINK_VERIFICATION || 'http://localhost/vue/checkEmail/$1',
  EMAIL_LINK_SETPASSWORD:
    process.env.EMAIL_LINK_SETPASSWORD || 'http://localhost/vue/setPassword/$1',
}

// This is needed by graphql-directive-auth
process.env.APP_SECRET = server.JWT_SECRET

const CONFIG = { ...server, ...database, ...klicktipp, ...community, ...email, ...loginServer }

export default CONFIG
