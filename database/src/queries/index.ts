import { MySql2Database } from 'drizzle-orm/mysql2'
import { AppDatabase } from '../AppDatabase'
import { LOG4JS_BASE_CATEGORY_NAME } from '../config/const'

export * from './communities'
export * from './communityHandshakes'
export * from './events'
export * from './openaiThreads'
export * from './pendingTransactions'
export * from './transactionLinks'
export * from './transactions'
export * from './user'

export function drizzleDb(): MySql2Database {
  return AppDatabase.getInstance().getDrizzleDataSource()
}

export const LOG4JS_QUERIES_CATEGORY_NAME = `${LOG4JS_BASE_CATEGORY_NAME}.queries`
