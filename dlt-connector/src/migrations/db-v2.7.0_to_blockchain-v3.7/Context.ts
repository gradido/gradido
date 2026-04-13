import { heapStats } from 'bun:jsc'
import dotenv from 'dotenv'
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import { Filter, Profiler, SearchDirection_ASC } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import mysql from 'mysql2/promise'
import { loadConfig } from '../../bootstrap/init'
import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'
import { Uuidv4 } from '../../schemas/typeGuard.schema'
import { bytesToMbyte } from './utils'
import { CommunityContext } from './valibot.schema'

dotenv.config()

export class Context {
  public logger: Logger
  public db: MySql2Database
  public communities: Map<string, CommunityContext>
  public cache: KeyPairCacheManager
  private timeUsed: Profiler

  constructor(logger: Logger, db: MySql2Database, cache: KeyPairCacheManager) {
    this.logger = logger
    this.db = db
    this.cache = cache
    this.communities = new Map<string, CommunityContext>()
    this.timeUsed = new Profiler()
  }

  static async create(): Promise<Context> {
    loadConfig()

    const connection = await mysql.createConnection({
      host: CONFIG.MYSQL_HOST,
      user: CONFIG.MYSQL_USER,
      password: CONFIG.MYSQL_PASSWORD,
      database: CONFIG.MYSQL_DATABASE,
      port: CONFIG.MYSQL_PORT,
    })
    const db = drizzle({ client: connection })
    const logger = getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.5`)
    return new Context(logger, db, KeyPairCacheManager.getInstance())
  }

  getCommunityContextByUuid(communityUuid: Uuidv4): CommunityContext {
    const community = this.communities.get(communityUuid)
    if (!community) {
      throw new Error(`Community not found for communityUuid ${communityUuid}`)
    }
    return community
  }

  logRuntimeStatistics() {
    this.logger.info(`${this.timeUsed.string()} for synchronizing to blockchain`)
    const runtimeStats = heapStats()
    this.logger.info(
      `Memory Statistics: heap size: ${bytesToMbyte(runtimeStats.heapSize)} MByte, heap capacity: ${bytesToMbyte(runtimeStats.heapCapacity)} MByte, extra memory: ${bytesToMbyte(runtimeStats.extraMemorySize)} MByte`,
    )
  }

  logBlogchain(communityUuid: Uuidv4) {
    const communityContext = this.getCommunityContextByUuid(communityUuid)
    const f = new Filter()
    f.pagination.size = 0
    f.searchDirection = SearchDirection_ASC

    const transactions = communityContext.blockchain.findAll(f)
    for (let i = 0; i < transactions.size(); i++) {
      const transaction = transactions.get(i)
      const confirmedTransaction = transaction?.getConfirmedTransaction()
      this.logger.info(confirmedTransaction?.toJson(true))
    }
  }

  // TODO: move into utils
}
