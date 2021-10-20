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

export default getDBVersion
