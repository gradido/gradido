import { DataSource, FileLogger } from '@dbTools/typeorm'
import { entities } from '@entity/index'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'

export class TestDB {
  // eslint-disable-next-line no-use-before-define
  private static _instance: TestDB

  private constructor() {
    if (!CONFIG.DB_DATABASE_TEST) {
      throw new LogError('no test db in config')
    }
    this.dbConnect = new DataSource({
      type: 'mysql',
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      username: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE_TEST,
      entities,
      synchronize: true,
      dropSchema: true,
      logging: true,
      logger: new FileLogger('all', {
        logPath: CONFIG.TYPEORM_LOGGING_RELATIVE_PATH,
      }),
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
    })
  }

  public static get instance(): TestDB {
    if (!this._instance) this._instance = new TestDB()
    return this._instance
  }

  public dbConnect!: DataSource

  async setupTestDB() {
    // eslint-disable-next-line no-console
    try {
      await this.dbConnect.initialize()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    }
  }

  async teardownTestDB() {
    await this.dbConnect.destroy()
  }
}
