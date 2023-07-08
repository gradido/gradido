import { Migration } from '@entity/Migration'

import { logger } from '@/server/logger'

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

export { checkDBVersion, getDBVersion }
