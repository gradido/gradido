import { SQL } from 'bun'
import { InMemoryBlockchain } from 'gradido-blockchain-js'
import { Logger } from 'log4js'

import { HieroId, Uuidv4 } from '../../schemas/typeGuard.schema'

import { KeyPairCacheManager } from '../../cache/KeyPairCacheManager'
import { loadConfig } from '../../bootstrap/init'
import { CONFIG } from '../../config'


export type CommunityContext = {
  communityId: string
  blockchain: InMemoryBlockchain
  topicId: HieroId
}

export class Context {
  public logger: Logger
  public db: SQL
  public communities: Map<string, CommunityContext>
  public cache: KeyPairCacheManager

  constructor(logger: Logger, db: SQL, cache: KeyPairCacheManager) {
    this.logger = logger
    this.db = db
    this.cache = cache
    this.communities = new Map<string, CommunityContext>()
  }

  static create(): Context {
    return new Context(
      loadConfig(), 
      new SQL({
        adapter: 'mysql',
        hostname: CONFIG.MYSQL_HOST,
        username: CONFIG.MYSQL_USER,
        password: CONFIG.MYSQL_PASSWORD,
        database: CONFIG.MYSQL_DATABASE,
        port: CONFIG.MYSQL_PORT    
      }), 
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
