/* PREPARE SCRIPT
 *
 * This file ensures operations our migration library
 * can not take care of are done.
 * This applies to all Database Operations like
 * creating, deleting, renaming Databases.
 */

import { createConnection } from 'mysql'
import CONFIG from './config'

export default async () => {
  const con = createConnection({
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
  })

  await con.connect()

  // Create Databse `gradido_community`
  await con.query(`
    CREATE DATABASE IF NOT EXISTS ${CONFIG.DB_DATABASE} 
      DEFAULT CHARACTER SET utf8mb4
      DEFAULT COLLATE utf8mb4_unicode_ci;`)
}
