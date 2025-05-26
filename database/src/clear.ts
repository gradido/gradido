import { Connection } from 'mysql2/promise'
import { CONFIG } from './config'
import { connectToDatabaseServer } from './prepare'

export async function truncateTables(connection: Connection) {
  const [tables] = await connection.query('SHOW TABLES')
  const tableNames = (tables as any[]).map((table) => Object.values(table)[0])

  if (tableNames.length === 0) {
    // No tables found in database.
    return
  }
  await connection.query(`USE ${CONFIG.DB_DATABASE}`)

  // Disabling foreign key checks...
  await connection.query('SET FOREIGN_KEY_CHECKS = 0')

  // Truncating all tables...
  for (const tableName of tableNames) {
    if (tableName === CONFIG.MIGRATIONS_TABLE) {
      continue
    }
    await connection.query(`TRUNCATE TABLE \`${tableName}\``)
  }

  // Re-enabling foreign key checks...
  await connection.query('SET FOREIGN_KEY_CHECKS = 1')
}

export async function clearDatabase() {
  const connection = await connectToDatabaseServer(
    CONFIG.DB_CONNECT_RETRY_COUNT,
    CONFIG.DB_CONNECT_RETRY_DELAY_MS,
  )
  if (!connection) {
    throw new Error('Could not connect to database server')
  }

  await truncateTables(connection)

  // Database cleared successfully.
  await connection.end()
}

// Execute if this file is run directly
if (require.main === module) {
  clearDatabase()
    .then(() => {
      // Database clear operation completed.
      process.exit(0)
    })
    .catch((error) => {
      // biome-ignore lint/suspicious/noConsole: no logger present
      console.error('Failed to clear database:', error)
      process.exit(1)
    })
}
