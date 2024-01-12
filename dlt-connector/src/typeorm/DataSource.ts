// TODO This is super weird - since the entities are defined in another project they have their own globals.
//      We cannot use our connection here, but must use the external typeorm installation
import { DataSource as DBDataSource, FileLogger } from '@dbTools/typeorm'
import { entities } from '@entity/index'
import { Migration } from '@entity/Migration'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Connection {
  // eslint-disable-next-line no-use-before-define
  private static instance: Connection
  private connection: DBDataSource

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */
  // eslint-disable-next-line no-useless-constructor, @typescript-eslint/no-empty-function
  private constructor() {
    this.connection = new DBDataSource({
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
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
    })
  }

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */
  public static getInstance(): Connection {
    if (!Connection.instance) {
      Connection.instance = new Connection()
    }
    return Connection.instance
  }

  public getDataSource(): DBDataSource {
    return this.connection
  }

  public async init(): Promise<void> {
    await this.connection.initialize()
    try {
      Connection.getInstance()
    } catch (error) {
      // try and catch for logging
      logger.fatal(`Couldn't open connection to database!`)
      throw error
    }

    // check for correct database version
    await this.checkDBVersion(CONFIG.DB_VERSION)
  }

  async checkDBVersion(DB_VERSION: string): Promise<void> {
    const dbVersion = await Migration.find({ order: { version: 'DESC' }, take: 1 })
    if (!dbVersion || dbVersion.length < 1) {
      throw new LogError('found no db version in migrations, could dlt-database run successfully?')
    }
    //  return dbVersion ? dbVersion.fileName : null
    if (!dbVersion[0].fileName.includes(DB_VERSION)) {
      throw new LogError(
        `Wrong database version detected - the backend requires '${DB_VERSION}' but found '${
          dbVersion[0].fileName ?? 'None'
        }`,
      )
    }
  }
}

export const getDataSource = () => Connection.getInstance().getDataSource()
