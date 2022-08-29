/* eslint-disable @typescript-eslint/no-var-requires */

const CONFIG = require('./src/config')

module.export = {
  name: 'default',
  type: 'mysql',
  host: CONFIG.DB_HOST,
  port: CONFIG.DB_PORT,
  username: CONFIG.DB_USER,
  password: CONFIG.DB_PASSWORD,
  database: CONFIG.DB_DATABASE,
}
