import { Field, Message } from '@apollo/protobufjs'

import { TransferAmount } from './TransferAmount'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionBase } from '@/controller/TransactionBase'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionRecipe } from '@entity/TransactionRecipe'
import Decimal from 'decimal.js-light'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransfer extends Message<GradidoTransfer> implements TransactionBase {
  constructor(transaction?: TransactionDraft, coinOrigin?: string) {
    if (transaction) {
      super({
        sender: new TransferAmount({
          amount: transaction.amount.toString(),
          communityId: coinOrigin,
        }),
      })
    } else {
      super()
    }
  }

  @Field.d(1, TransferAmount)
  public sender: TransferAmount

  @Field.d(2, 'bytes')
  public recipient: Buffer

  public validate(level: TransactionValidationLevel): boolean {
    throw new Error('Method not implemented.')
  }

  public fillTransactionRecipe(recipe: TransactionRecipe): void {
    recipe.amount = new Decimal(this.sender?.amount ?? 0)
  }
}
