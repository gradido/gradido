import { Profiler } from 'gradido-blockchain-js'
import { getLogger, Logger } from 'log4js'
import { LOG4JS_BASE_CATEGORY } from '../../../../config/const'
import { Context } from '../../Context'

export abstract class AbstractSyncRole<T> {
  private items: T[] = []
  private offset = 0
  protected logger: Logger

  constructor(protected readonly context: Context) {
    this.logger = getLogger(
      `${LOG4JS_BASE_CATEGORY}.migrations.db-v2.7.0_to_blockchain-v3.5.interaction.syncDbWithBlockchain`,
    )
  }

  abstract getDate(): Date
  abstract loadFromDb(offset: number, count: number): Promise<T[]>
  abstract pushToBlockchain(item: T): Promise<void>
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

  async toBlockchain(): Promise<void> {
    if (this.isEmpty()) {
      throw new Error(`[toBlockchain] No items, please call this only if isEmpty returns false`)
    }
    await this.pushToBlockchain(this.shift())
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
