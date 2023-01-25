// ATTENTION: DO NOT PUT ANY SECRETS IN HERE (or the .env)
import dotenv from 'dotenv'
dotenv.config()
/*
import Decimal from 'decimal.js-light'

Decimal.set({
  precision: 25,
  rounding: Decimal.ROUND_HALF_UP,
})
*/

const constants = {
  DB_VERSION: '0060-update_communities_table',
  // DECAY_START_TIME: new Date('2021-05-13 17:46:31-0000'), // GMT+0
  LOG4JS_CONFIG: 'log4js-config.json',
  // default log level on production should be info
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CONFIG_VERSION: {
    DEFAULT: 'DEFAULT',
    EXPECTED: 'v1.2023-01-09',
    CURRENT: '',
  },
}

const server = {
  PORT: process.env.PORT || 5000,
  // JWT_SECRET: process.env.JWT_SECRET || 'secret123',
  // JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '10m',
  GRAPHIQL: process.env.GRAPHIQL === 'true' || false,
  // GDT_API_URL: process.env.GDT_API_URL || 'https://gdt.gradido.net',
  PRODUCTION: process.env.NODE_ENV === 'production' || false,
}
const database = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_DATABASE: process.env.DB_DATABASE || 'gradido_community',
  TYPEORM_LOGGING_RELATIVE_PATH:
    process.env.TYPEORM_LOGGING_RELATIVE_PATH || 'typeorm.backend.log',
}
/*
const community = {
   COMMUNITY_NAME: process.env.COMMUNITY_NAME || 'Gradido Entwicklung',
   COMMUNITY_URL: process.env.COMMUNITY_URL || 'http://localhost/',
   COMMUNITY_REGISTER_URL: process.env.COMMUNITY_REGISTER_URL || 'http://localhost/register',
   COMMUNITY_REDEEM_URL: process.env.COMMUNITY_REDEEM_URL || 'http://localhost/redeem/{code}',
   COMMUNITY_REDEEM_CONTRIBUTION_URL:
     process.env.COMMUNITY_REDEEM_CONTRIBUTION_URL || 'http://localhost/redeem/CL-{code}',
   COMMUNITY_DESCRIPTION:
     process.env.COMMUNITY_DESCRIPTION || 'Die lokale Entwicklungsumgebung von Gradido.',
}
*/
// const eventProtocol = {
// global switch to enable writing of EventProtocol-Entries
// EVENT_PROTOCOL_DISABLED: process.env.EVENT_PROTOCOL_DISABLED === 'true' || false,
// }

// This is needed by graphql-directive-auth
// process.env.APP_SECRET = server.JWT_SECRET

// Check config version
constants.CONFIG_VERSION.CURRENT =
  process.env.CONFIG_VERSION || constants.CONFIG_VERSION.DEFAULT
if (
  ![
    constants.CONFIG_VERSION.EXPECTED,
    constants.CONFIG_VERSION.DEFAULT,
  ].includes(constants.CONFIG_VERSION.CURRENT)
) {
  throw new Error(
    `Fatal: Config Version incorrect - expected "${constants.CONFIG_VERSION.EXPECTED}" or "${constants.CONFIG_VERSION.DEFAULT}", but found "${constants.CONFIG_VERSION.CURRENT}"`
  )
}

const federation = {
  // FEDERATION_DHT_TOPIC: process.env.FEDERATION_DHT_TOPIC || null,
  // FEDERATION_DHT_SEED: process.env.FEDERATION_DHT_SEED || null,
  FEDERATION_PORT: process.env.FEDERATION_PORT || 5000,
  FEDERATION_API: process.env.FEDERATION_API || '1_0',
  FEDERATION_COMMUNITY_URL: process.env.FEDERATION_COMMUNITY_URL || null,
}

const CONFIG = {
  ...constants,
  ...server,
  ...database,
  // ...community,
  // ...eventProtocol,
  ...federation,
}

export default CONFIG
