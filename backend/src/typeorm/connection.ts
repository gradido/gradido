// TODO This is super weird - since the entities are defined in another project they have their own globals.
//      We cannot use our connection here, but must use the external typeorm installation
import { type Connection as DbConnection, FileLogger, createConnection } from '@dbTools/typeorm'
import { entities } from '@entity/index'

import { CONFIG } from '@/config'

export class Connection {
  private static instance: DbConnection

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static async getInstance(): Promise<DbConnection | null> {
    if (Connection.instance) {
      return Connection.instance
    }
    try {
      Connection.instance = await createConnection({
        name: 'default',
        type: 'mysql',
        legacySpatialSupport: false,
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
        extra: {
          charset: 'utf8mb4_unicode_ci',
        },
      })
      return Connection.instance
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: maybe logger isn't initialized yet
      console.log(error)
      return null
    }
  }
}
