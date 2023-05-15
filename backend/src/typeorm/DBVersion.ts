import { Migration } from '@entity/Migration'

import { backendLogger as logger } from '@/server/logger'

const getDBVersion = async (): Promise<string | null> => {
  try {
    const dbVersion = await Migration.findOne({ order: { version: 'DESC' } })
    return dbVersion ? dbVersion.fileName : null
  } catch (error) {
    logger.error(error)
    return null
  }
}

const checkDBVersion = async (DB_VERSION: string): Promise<boolean> => {
  const dbVersion = await getDBVersion()
  if (!dbVersion?.includes(DB_VERSION)) {
    logger.error(
      `Wrong database version detected - the backend requires '${DB_VERSION}' but found '${
        dbVersion ?? 'None'
      }`,
    )
    return false
  }
  return true
}

export { checkDBVersion, getDBVersion }
