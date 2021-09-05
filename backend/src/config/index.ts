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
}

const database = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_community',
}

const klicktipp = {
  KLICKTTIPP_API_URL: process.env.KLICKTIPP_API_URL || 'https://api.klicktipp.com',
  KLICKTIPP_USER: process.env.KLICKTIPP_USER || 'gradido_test',
  KLICKTIPP_PASSWORD: process.env.KLICKTIPP_PASSWORD || 'secret321',
  KLICKTIPP_APIKEY_DE: process.env.KLICKTIPP_APIKEY_DE || 'SomeFakeKeyDE',
  KLICKTIPP_APIKEY_EN: process.env.KLICKTIPP_APIKEY_EN || 'SomeFakeKeyEN',
}

// This is needed by graphql-directive-auth
process.env.APP_SECRET = server.JWT_SECRET

const CONFIG = { ...server, ...database, ...klicktipp }

export default CONFIG
