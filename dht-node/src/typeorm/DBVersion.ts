import { Migration } from 'database'

import { logger } from '@/server/logger'

import { CONFIG } from '@/config'
import { Connection as DbConnection } from 'typeorm'
import { connection as connectionFunc } from './connection'

async function checkDBVersionUntil(maxRetries: number, delayMs: number): Promise<DbConnection> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const connection = await connectionFunc()
      if (connection?.isInitialized) {
        const dbVersion = await checkDBVersion(CONFIG.DB_VERSION)
        if (dbVersion) {
          logger.info('Database connection and version check succeeded.')
          return connection
        }
      }
    } catch (err) {
      logger.warn(`Attempt ${attempt}: Waiting for DB...`, err)
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  logger.fatal(
    `Fatal: Could not connect to database or version check failed after ${maxRetries} attempts.`,
  )
  throw new Error('Fatal: Database not ready.')
}

const getDBVersion = async (): Promise<string | null> => {
  try {
    const [dbVersion] = await Migration.find({ order: { version: 'DESC' }, take: 1 })
    return dbVersion ? dbVersion.fileName : null
  } catch (error) {
    logger.error(error)
    return null
  }
}

const checkDBVersion = async (DB_VERSION: string): Promise<boolean> => {
  const dbVersion = await getDBVersion()
  if (!dbVersion || dbVersion.indexOf(DB_VERSION) === -1) {
    logger.error(
      `Wrong database version detected - the dht-node requires '${DB_VERSION}' but found '${
        dbVersion || 'None'
      }`,
    )
    return false
  }
  return true
}

export { checkDBVersion, getDBVersion, checkDBVersionUntil }
