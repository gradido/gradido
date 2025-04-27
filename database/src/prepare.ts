import {
  type Connection,
  type ResultSetHeader,
  type RowDataPacket,
  createConnection,
} from 'mysql2/promise'

import { CONFIG } from './config'
import { latestDbVersion } from './config/detectLastDBVersion'

export enum DatabaseState {
  NOT_CONNECTED = 'NOT_CONNECTED',
  LOWER_VERSION = 'LOWER_VERSION',
  HIGHER_VERSION = 'HIGHER_VERSION',
  SAME_VERSION = 'SAME_VERSION',
}

async function connectToDatabaseServer(): Promise<Connection | null> {
  try {
    return await createConnection({
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
    })
  } catch (_error) {
    return null
  }
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

  if (result.affectedRows === 1) {
    // biome-ignore lint/suspicious/noConsole: no logger
    console.log(`Database ${CONFIG.DB_DATABASE} created`)
    return DatabaseState.LOWER_VERSION
  }

  await connection.query(`USE ${CONFIG.DB_DATABASE}`)
  try {
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
  } catch (_error) {
    return DatabaseState.LOWER_VERSION
  }
}
