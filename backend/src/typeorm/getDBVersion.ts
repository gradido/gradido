import { Migration } from "@entity/Migration"

const getDBVersion = async (): Promise<string | null> => {
  try {
    const dbVersion = await Migration.findOne({ order: { version: 'DESC' } })
    return dbVersion ? dbVersion.fileName : null
  } catch (error) {
    return null
  }
}

export default getDBVersion
