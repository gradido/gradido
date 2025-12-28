import { Filter, InMemoryBlockchain, KeyPairEd25519, MemoryBlockPtr, Profiler, SearchDirection_DESC } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../../../config/const'
import { deriveFromKeyPairAndIndex, deriveFromKeyPairAndUuid } from '../../../../data/deriveKeyPair'
import { Uuidv4 } from '../../../../schemas/typeGuard.schema'
import { Context } from '../../Context'
import { Balance } from '../../data/Balance'
import { CommunityContext } from '../../valibot.schema'

export abstract class AbstractSyncRole<T> {
  private items: T[] = []
  private offset = 0
  protected logger: Logger

  constructor(protected readonly context: Context) {
    this.logger = getLogger(
      `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.5.interaction.syncDbWithBlockchain`,
    )
  }

  getAccountKeyPair(communityContext: CommunityContext, gradidoId: Uuidv4): KeyPairEd25519 {
    return this.context.cache.getKeyPairSync(gradidoId, () => {
      return deriveFromKeyPairAndIndex(deriveFromKeyPairAndUuid(communityContext.keyPair, gradidoId), 1)
    })
  }

  getLastBalanceForUser(publicKey: MemoryBlockPtr, blockchain: InMemoryBlockchain, communityId: string = ''): Balance {
    if (publicKey.isEmpty()) {
      throw new Error('publicKey is empty')
    }
    const lastSenderTransaction = blockchain.findOne(Filter.lastBalanceFor(publicKey))
    if (!lastSenderTransaction) {
      return new Balance(publicKey, communityId)
    }
    const lastConfirmedTransaction = lastSenderTransaction.getConfirmedTransaction()
    if (!lastConfirmedTransaction) {
      throw new Error(`invalid transaction, getConfirmedTransaction call failed for transaction nr: ${lastSenderTransaction.getTransactionNr()}`)
    }
    const senderLastAccountBalance = lastConfirmedTransaction.getAccountBalance(publicKey, communityId)
    if (!senderLastAccountBalance) {
      return new Balance(publicKey, communityId)
    }
    return Balance.fromAccountBalance(senderLastAccountBalance, lastConfirmedTransaction.getConfirmedAt().getDate())
  }

  logLastBalanceChangingTransactions(publicKey: MemoryBlockPtr, blockchain: InMemoryBlockchain, transactionCount: number = 5) {
    if (!this.context.logger.isDebugEnabled()) {
      return
    }
    const f = new Filter()
    f.updatedBalancePublicKey = publicKey
    f.searchDirection = SearchDirection_DESC
    f.pagination.size = transactionCount
    const lastTransactions = blockchain.findAll(f)
    for (let i = lastTransactions.size() - 1; i >= 0; i--) {
      const tx = lastTransactions.get(i)
      this.context.logger.debug(`${tx?.getConfirmedTransaction()!.toJson(true)}`)
    }
  }

  abstract getDate(): Date
  abstract loadFromDb(offset: number, count: number): Promise<T[]>
  abstract pushToBlockchain(item: T): void
  abstract itemTypeName(): string

  // return count of new loaded items
  async ensureFilled(batchSize: number): Promise<number> {
    if (this.items.length === 0) {
      let timeUsed: Profiler | undefined
      if (this.logger.isDebugEnabled()) {
        timeUsed = new Profiler()
      }
      this.items = await this.loadFromDb(this.offset, batchSize)
      this.offset += this.items.length
      if (timeUsed && this.items.length) {
        this.logger.debug(
          `${timeUsed.string()} for loading ${this.items.length} ${this.itemTypeName()} from db`,
        )
      }
      return this.items.length
    }
    return 0
  }  

  toBlockchain(): void {
    if (this.isEmpty()) {
      throw new Error(`[toBlockchain] No items, please call this only if isEmpty returns false`)
    }
    this.pushToBlockchain(this.shift())
  }

  peek(): T {
    if (this.isEmpty()) {
      throw new Error(`[peek] No items, please call this only if isEmpty returns false`)
    }
    return this.items[0]
  }

  shift(): T {
    const item = this.items.shift()
    if (!item) {
      throw new Error(`[shift] No items, shift return undefined`)
    }
    return item
  }

  get length(): number {
    return this.items.length
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }
}
