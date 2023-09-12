import { DataSource as DBDataSource, FileLogger } from '@dbTools/typeorm'
import { entities } from '@entity/index'

import { CONFIG } from '@/config'

export let DataSourceTest: DBDataSource | null = null

export const init = async () => {
  if (CONFIG.DB_DATABASE_TEST) {
    DataSourceTest = new DBDataSource({
      type: 'mysql',
      host: CONFIG.DB_HOST,
      port: CONFIG.DB_PORT,
      username: CONFIG.DB_USER,
      password: CONFIG.DB_PASSWORD,
      database: CONFIG.DB_DATABASE_TEST,
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
    await DataSourceTest.initialize()
  } else {
    throw new Error('no test data source configured')
  }
}
