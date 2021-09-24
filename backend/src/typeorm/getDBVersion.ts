import { getConnection } from 'typeorm'
import { Migration } from './entity/Migration'

const getDBVersion = async (): Promise<string | null> => {
  const connection = getConnection()
  const migrations = connection.getRepository(Migration)
  try {
    const dbVersion = await migrations.findOne({ order: { version: 'DESC' } })
    return dbVersion ? dbVersion.fileName : null
  } catch (error) {
    return null
  }
}

export default getDBVersion
