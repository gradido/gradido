import { createConnection, Connection, FileLogger } from 'typeorm'
import CONFIG from '../config'
import { entities } from '@entity/index'

const connection = async (): Promise<Connection | null> => {
  let con = null
  try {
    con = await createConnection({
      name: 'default',
      type: 'mysql',
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      username: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE,
      entities,
      synchronize: false,
      logging: true,
      logger: new FileLogger('all', {
        logPath: CONFIG.TYPEORM_LOGGING_RELATIVE_PATH,
      }),
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  return con
}

export default connection
