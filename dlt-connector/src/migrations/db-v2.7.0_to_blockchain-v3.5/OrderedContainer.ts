
export type Loader<T, ContextType> = (context: ContextType, offset: number, count: number) => Promise<T[]>

export interface Orderable<ContextType> {
  getDate(): Date
  // return count of new loaded items
  ensureFilled(context: ContextType, batchSize: number): Promise<number>
  pushToBlockchain(context: ContextType): Promise<void>
  isEmpty(): boolean
  get length(): number
}

export class OrderedContainer<T, ContextType> implements Orderable<ContextType> {
  private items: T[] = []
  private offset = 0

  constructor(
    private readonly loader: Loader<T, ContextType>,
    private readonly getDateHandler: (item: T) => Date,
    private readonly pushToBlockchainHandler: (context: ContextType, item: T) => Promise<void>
  ) {}


  async ensureFilled(context: ContextType, batchSize: number): Promise<number> {
    if (this.items.length === 0) {
      this.items = await this.loader(context, this.offset, batchSize)
      this.offset += this.items.length
      return this.items.length
    }
    return 0
  }

  async pushToBlockchain(context: ContextType): Promise<void> {
    return this.pushToBlockchainHandler(context, this.shift())
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

  getDate(): Date {
    return this.getDateHandler(this.peek())
  }

  isEmpty(): boolean {
    return this.items.length === 0
  }
}