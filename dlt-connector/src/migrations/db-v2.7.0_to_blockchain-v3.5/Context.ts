import { drizzle, MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { InMemoryBlockchain } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'

import { HieroId, Uuidv4 } from '../../schemas/typeGuard.schema'

import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { loadConfig } from '../../bootstrap/init'
import { CONFIG } from '../../config'
import { LOG4JS_BASE_CATEGORY } from '../../config/const'

export type CommunityContext = {
  communityId: string
  blockchain: InMemoryBlockchain
  topicId: HieroId
}

export class Context {
  public logger: Logger
  public db: MySql2Database
  public communities: Map<string, CommunityContext>
  public cache: KeyPairCacheManager

  constructor(logger: Logger, db: MySql2Database, cache: KeyPairCacheManager) {
    this.logger = logger
    this.db = db
    this.cache = cache
    this.communities = new Map<string, CommunityContext>()
  }

  static async create(): Promise<Context> {
    loadConfig()

    const connection = await mysql.createConnection({
      host: CONFIG.MYSQL_HOST,
      user: CONFIG.MYSQL_USER,
      password: CONFIG.MYSQL_PASSWORD,
      database: CONFIG.MYSQL_DATABASE,
      port: CONFIG.MYSQL_PORT
    })
    return new Context(
      getLogger(`${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.5`),
      drizzle({ client: connection }), 
      KeyPairCacheManager.getInstance()
    )
  }

  getCommunityContextByUuid(communityUuid: Uuidv4): CommunityContext {
    const community = this.communities.get(communityUuid)
    if (!community) {
      throw new Error(`Community not found for communityUuid ${communityUuid}`)
    }
    return community
  }
}
