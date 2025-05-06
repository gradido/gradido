/* eslint-disable no-unused-vars */
import { Connection, ResultSetHeader, RowDataPacket, createConnection } from 'mysql2/promise'

import { CONFIG } from './config'
import { latestDbVersion } from './config/detectLastDBVersion'

export enum DatabaseState {
  NOT_CONNECTED = 'NOT_CONNECTED',
  LOWER_VERSION = 'LOWER_VERSION',
  HIGHER_VERSION = 'HIGHER_VERSION',
  SAME_VERSION = 'SAME_VERSION',
}

export async function connectToDatabaseServer(maxRetries = 15, delayMs = 500): Promise<Connection | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createConnection({
        host: CONFIG.DB_HOST,
        port: CONFIG.DB_PORT,
        user: CONFIG.DB_USER,
        password: CONFIG.DB_PASSWORD,
      })
    } catch (e) {
      // biome-ignore lint/suspicious/noConsole: no logger present
      console.log(`could not connect to database server, retry in ${delayMs} ms`, e)
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return null
}

export const getDatabaseState = async (): Promise<DatabaseState> => {
  const connection = await connectToDatabaseServer()
  if (!connection) {
    return DatabaseState.NOT_CONNECTED
  }

  // make sure the database exists
  const [result] = await connection.query<ResultSetHeader>(`
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

      console.log('Found and dropped old migrations table')
    }
  */
  if (result.affectedRows === 1) {
    // biome-ignore lint/suspicious/noConsole: no logger present
    console.log(`Database ${CONFIG.DB_DATABASE} created`)
    return DatabaseState.LOWER_VERSION
  }

  await connection.query(`USE ${CONFIG.DB_DATABASE}`)

  // check if the database is up to date
  const [rows] = await connection.query<RowDataPacket[]>(
    `SELECT * FROM ${CONFIG.MIGRATIONS_TABLE} ORDER BY version DESC LIMIT 1`,
  )
  if (rows.length === 0) {
    return DatabaseState.LOWER_VERSION
  }
  connection.destroy()
  const dbVersion = rows[0].fileName.split('.')[0]
  return dbVersion === latestDbVersion
    ? DatabaseState.SAME_VERSION
    : dbVersion < latestDbVersion
      ? DatabaseState.LOWER_VERSION
      : DatabaseState.HIGHER_VERSION
}
