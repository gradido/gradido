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

  // Create Database `gradido_dlt`
  await con.query(`
    CREATE DATABASE IF NOT EXISTS ${CONFIG.DB_DATABASE} 
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci;`)

  await con.end()
}
