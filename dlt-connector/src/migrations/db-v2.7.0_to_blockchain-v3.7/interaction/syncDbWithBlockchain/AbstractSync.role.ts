import { 
  AccountBalances, 
  Filter, 
  InMemoryBlockchain, 
  KeyPairEd25519, 
  MemoryBlockPtr, 
  Profiler, 
  SearchDirection_DESC, 
  GradidoTransactionBuilder 
} from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../../../config/const'
import { deriveFromKeyPairAndIndex, deriveFromKeyPairAndUuid } from '../../../../data/deriveKeyPair'
import { Uuidv4 } from '../../../../schemas/typeGuard.schema'
import { Context } from '../../Context'
import { Balance } from '../../data/Balance'
import { CommunityContext } from '../../valibot.schema'

export type IndexType = {
  date: Date
  id: number
}
export let nanosBalanceForUser = 0
const lastBalanceOfUserTimeUsed = new Profiler

export abstract class AbstractSyncRole<ItemType> {
  private items: ItemType[] = []
  protected lastIndex: IndexType = { date: new Date(0), id: 0 }
  protected logger: Logger
  protected transactionBuilder: GradidoTransactionBuilder
  protected accountBalances: AccountBalances

  constructor(protected readonly context: Context) {
    this.logger = getLogger(
      `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.5.interaction.syncDbWithBlockchain`,
    )
    this.transactionBuilder = new GradidoTransactionBuilder()
    this.accountBalances = new AccountBalances()
  }

  getAccountKeyPair(communityContext: CommunityContext, gradidoId: Uuidv4): KeyPairEd25519 {
    return this.context.cache.getKeyPairSync(gradidoId, () => {
      return deriveFromKeyPairAndIndex(deriveFromKeyPairAndUuid(communityContext.keyPair, gradidoId), 1)
    })
  }

  getLastBalanceForUser(publicKey: MemoryBlockPtr, blockchain: InMemoryBlockchain, communityId: string
  ): Balance {
    lastBalanceOfUserTimeUsed.reset()
    if (publicKey.isEmpty()) {
      throw new Error('publicKey is empty')
    }    
    const f = Filter.lastBalanceFor(publicKey)
    f.setCommunityId(communityId)
    const lastSenderTransaction = blockchain.findOne(f)
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
    const result = Balance.fromAccountBalance(senderLastAccountBalance, lastConfirmedTransaction.getConfirmedAt().getDate(), communityId)
    nanosBalanceForUser += lastBalanceOfUserTimeUsed.nanos()
    return result
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
      this.context.logger.debug(`${i}: ${tx?.getConfirmedTransaction()!.toJson(true)}`)
    }
  }

  abstract getDate(): Date
  // for using seek rather than offset pagination approach
  abstract getLastIndex(): IndexType
  abstract loadFromDb(lastIndex: IndexType, count: number): Promise<ItemType[]>
  abstract pushToBlockchain(item: ItemType): void
  abstract itemTypeName(): string

  // return count of new loaded items
  async ensureFilled(batchSize: number): Promise<number> {
    if (this.items.length === 0) {
      let timeUsed: Profiler | undefined
      if (this.logger.isDebugEnabled()) {
        timeUsed = new Profiler()
      }
      this.items = await this.loadFromDb(this.lastIndex, batchSize)
      if (this.length > 0) {
        this.lastIndex = this.getLastIndex()
        if (timeUsed) {
          this.logger.debug(
            `${timeUsed.string()} for loading ${this.items.length} ${this.itemTypeName()} from db`,
          )
        }
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

  peek(): ItemType {
    if (this.isEmpty()) {
      throw new Error(`[peek] No items, please call this only if isEmpty returns false`)
    }
    return this.items[0]
  }
  peekLast(): ItemType {
    if (this.isEmpty()) {
      throw new Error(`[peekLast] No items, please call this only if isEmpty returns false`)
    }
    return this.items[this.items.length - 1]
  }

  shift(): ItemType {
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
