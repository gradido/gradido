import { Transaction } from '@entity/Transaction'

import { TransactionBuilder } from '@/data/Transaction.builder'

export class AbstractTransactionRecipeRole {
  protected transactionBuilder: TransactionBuilder

  public constructor() {
    this.transactionBuilder = new TransactionBuilder()
  }

  public getTransaction(): Transaction {
    return this.transactionBuilder.getTransaction()
  }
}
