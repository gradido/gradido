import { createConnection } from 'mysql2/promise'

import { CONFIG } from './config'

export const createDatabase = async (): Promise<void> => {
  const con = await createConnection({
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
  })

  await con.connect()

  // Create Database `gradido_community`
  await con.query(`
    CREATE DATABASE IF NOT EXISTS ${CONFIG.DB_DATABASE} 
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci;`)

  /* LEGACY CODE
  import { RowDataPacket } from 'mysql2/promise'
  // Check if old migration table is present, delete if needed
  const [rows] = await con.query(`SHOW TABLES FROM \`${CONFIG.DB_DATABASE}\` LIKE 'migrations';`)
  if ((<RowDataPacket>rows).length > 0) {
    const [rows] = await con.query(
      `SHOW COLUMNS FROM \`${CONFIG.DB_DATABASE}\`.\`migrations\` LIKE 'db_version';`,
    )
    if ((<RowDataPacket>rows).length > 0) {
      await con.query(`DROP TABLE \`${CONFIG.DB_DATABASE}\`.\`migrations\``)
      // eslint-disable-next-line no-console
      console.log('Found and dropped old migrations table')
    }
  }
  */

  await con.end()
}
