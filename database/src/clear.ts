/* eslint-disable no-console */
import { createConnection } from 'mysql2/promise'
import { CONFIG } from './config'

export async function clearDatabase() {
  const connection = await createConnection({
    host: CONFIG.DB_HOST,
    port: CONFIG.DB_PORT,
    user: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_DATABASE,
  })

  // Connected. Getting all tables...
  const [tables] = await connection.query('SHOW TABLES')
  const tableNames = (tables as any[]).map((table) => Object.values(table)[0])

  if (tableNames.length === 0) {
    // No tables found in database.
    await connection.end()
    return
  }

  // Found ${tableNames.length} tables. Disabling foreign key checks...
  await connection.query('SET FOREIGN_KEY_CHECKS = 0')

  // Truncating all tables...
  for (const tableName of tableNames) {
    // Truncating table: ${tableName}
    await connection.query(`TRUNCATE TABLE \`${tableName}\``)
    console.log(`Truncated table: ${tableName}`)
  }

  // Re-enabling foreign key checks...
  await connection.query('SET FOREIGN_KEY_CHECKS = 1')

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
      console.error('Failed to clear database:', error)
      process.exit(1)
    })
}
