import { DataSource as DBDataSource, FileLogger } from 'typeorm'
import { entities, Migration } from '@/entity'

import { CONFIG } from '@/config'
import { logger } from '@/logging'
import { latestDbVersion } from '.'

export class AppDatabase {
  private static instance: AppDatabase
  private connection: DBDataSource | undefined

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
  public static getInstance(): AppDatabase {
    if (!AppDatabase.instance) {
      AppDatabase.instance = new AppDatabase()
    }
    return AppDatabase.instance
  }

  public getDataSource(): DBDataSource {
    if (!this.connection) {
      throw new Error('Connection not initialized')
    }
    return this.connection
  }

  // create database connection, initialize with automatic retry and check for correct database version
  public async init(): Promise<void> {
    if (this.connection?.isInitialized) return
    
    // log sql query only of enable by .env, this produce so much data it should be only used when really needed
    const logging: boolean = CONFIG.TYPEORM_LOGGING_ACTIVE
    this.connection = new DBDataSource({
      type: 'mysql',
      legacySpatialSupport: false,
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      username: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE,
      entities,
      synchronize: false,
      logging,
      logger: logging ? new FileLogger('all', {
        logPath: CONFIG.TYPEORM_LOGGING_RELATIVE_PATH,
      }) : undefined,
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
    })
    // retry connection on failure some times to allow database to catch up
    for (let attempt = 1; attempt <= CONFIG.DB_CONNECT_RETRY_COUNT; attempt++) {
      try {
        await this.connection.initialize()
        if(this.connection.isInitialized) {
          logger.info(`Database connection established on attempt ${attempt}`)
          break
        }
      } catch (error) {
        logger.warn(`Attempt ${attempt} failed to connect to DB:`, error)
        await new Promise((resolve) => setTimeout(resolve, CONFIG.DB_CONNECT_RETRY_DELAY_MS))
      }
    }
    if (!this.connection?.isInitialized) {
      throw new Error('Could not connect to database')
    }
    // check for correct database version
    await this.checkDBVersion()
  }

  public async close(): Promise<void> {
    await this.connection?.destroy()
  }
  // ######################################
  // private methods
  // ######################################
  private async checkDBVersion(): Promise<void> {
    const [dbVersion] = await Migration.find({ order: { version: 'DESC' }, take: 1 })
    if(!dbVersion) {
      throw new Error('Could not find database version')
    }
    if (!dbVersion.fileName.startsWith(latestDbVersion)) {
      throw new Error(
        `Wrong database version detected - the backend requires '${latestDbVersion}' but found '${
          dbVersion.fileName
        }`,
      )
    }    
  }
}

export const getDataSource = () => AppDatabase.getInstance().getDataSource()
