import { getRepository } from 'typeorm'
import { Migration } from '@entity/Migration'

const getDBVersion = async (): Promise<string | null> => {
  try {
    const dbVersion = await getRepository(Migration).findOne({ order: { version: 'DESC' } })
    return dbVersion ? dbVersion.fileName : null
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
    return null
  }
}

const checkDBVersion = async (DB_VERSION: string): Promise<boolean> => {
  const dbVersion = await getDBVersion()
  if (!dbVersion || dbVersion.indexOf(DB_VERSION) === -1) {
    // eslint-disable-next-line no-console
    console.log(
      `Wrong database version detected - the backend requires '${DB_VERSION}' but found '${
        dbVersion || 'None'
      }`,
    )
    return false
  }
  return true
}

export { checkDBVersion, getDBVersion }
