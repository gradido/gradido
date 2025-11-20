import { DataSource as DBDataSource, FileLogger } from 'typeorm'
import { Migration, entities } from './entity'

import { getLogger } from 'log4js'
import { latestDbVersion } from '.'
import { CONFIG } from './config'
import { LOG4JS_BASE_CATEGORY_NAME } from './config/const'
import Redis from 'ioredis'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.AppDatabase`)

export class AppDatabase {
  private static instance: AppDatabase
  private dataSource: DBDataSource | undefined
  private redisClient: Redis

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

  public isConnected(): boolean {
    return this.dataSource?.isInitialized ?? false
  }

  public getDataSource(): DBDataSource {
    if (!this.dataSource) {
      throw new Error('Connection not initialized')
    }
    return this.dataSource
  }

  // create database connection, initialize with automatic retry and check for correct database version
  public async init(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      return
    }
    if (!this.dataSource) {
      this.dataSource = new DBDataSource({
        type: 'mysql',
        legacySpatialSupport: false,
        host: CONFIG.DB_HOST,
        port: CONFIG.DB_PORT,
        username: CONFIG.DB_USER,
        password: CONFIG.DB_PASSWORD,
        database: CONFIG.DB_DATABASE,
        entities,
        synchronize: false,
        logging: CONFIG.TYPEORM_LOGGING_ACTIVE,
        logger: CONFIG.TYPEORM_LOGGING_ACTIVE
          ? new FileLogger('all', {
              // workaround to let previous path working, because with esbuild the script root path has changed
              logPath: (CONFIG.PRODUCTION ? '../' : '') + CONFIG.TYPEORM_LOGGING_RELATIVE_PATH,
            })
          : undefined,
        extra: {
          charset: 'utf8mb4_unicode_ci',
        },
      })
    }
    // retry connection on failure some times to allow database to catch up
    for (let attempt = 1; attempt <= CONFIG.DB_CONNECT_RETRY_COUNT; attempt++) {
      try {
        await this.dataSource.initialize()
        if (this.dataSource.isInitialized) {
          logger.info(`Database connection established on attempt ${attempt}`)
          break
        }
      } catch (error) {
        logger.warn(`Attempt ${attempt} failed to connect to DB:`, error)
        await new Promise((resolve) => setTimeout(resolve, CONFIG.DB_CONNECT_RETRY_DELAY_MS))
      }
    }
    if (!this.dataSource?.isInitialized) {
      throw new Error('Could not connect to database')
    }
    // check for correct database version
    await this.checkDBVersion()

    this.redisClient = new Redis(CONFIG.REDIS_URL)
    console.log('Redis status=', this.redisClient.status)
    logger.info('Redis status=', this.redisClient.status)
  }

  public async destroy(): Promise<void> {
    await this.dataSource?.destroy()
    if (this.redisClient) {
      this.redisClient.quit()
    }
  }

  public getRedisClient(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis client not initialized')
    }
    return this.redisClient
  }
 
  // ######################################
  // private methods
  // ######################################
  private async checkDBVersion(): Promise<void> {
    const [dbVersion] = await Migration.find({ order: { version: 'DESC' }, take: 1 })
    if (!dbVersion) {
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
