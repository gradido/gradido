import { connectToDatabaseServer } from "../prepare"
import { CONFIG } from "../../src/config"
import { drizzle, MySql2Database } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"

export async function removeCrossGroupTransactions(db: MySql2Database) {
  const connection = await connectToDatabaseServer(
      CONFIG.DB_CONNECT_RETRY_COUNT,
      CONFIG.DB_CONNECT_RETRY_DELAY_MS,
    )
  if (!connection) {
    throw new Error('Could not connect to database')
  }
  

  // Implementation here
  console.log('Removing cross-group transactions...')
}


async function main() {
  const connection = await mysql.createConnection({
      host: CONFIG.DB_HOST,
      user: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE,
      port: CONFIG.DB_PORT,
      waitForConnections: true,
    })
  const db = drizzle({ client: connection })
  
  await removeCrossGroupTransactions(db)
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
