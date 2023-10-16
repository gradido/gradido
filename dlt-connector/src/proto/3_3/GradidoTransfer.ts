import { Field, Message } from 'protobufjs'

import { TransferAmount } from './TransferAmount'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionBase } from '../TransactionBase'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionRecipe } from '@entity/TransactionRecipe'
import Decimal from 'decimal.js-light'
import { Account } from '@entity/Account'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransfer extends Message<GradidoTransfer> implements TransactionBase {
  constructor(
    transaction?: TransactionDraft,
    signingAccount?: Account,
    recipientAccount?: Account,
    coinOrigin?: string,
  ) {
    if (transaction) {
      super({
        sender: new TransferAmount({
          amount: transaction.amount.toString(),
          pubkey: signingAccount?.derive2Pubkey,
          communityId: coinOrigin,
        }),
        recipient: recipientAccount?.derive2Pubkey,
      })
    } else {
      super()
    }
  }

  @Field.d(1, TransferAmount)
  public sender: TransferAmount

  @Field.d(2, 'bytes')
  public recipient: Buffer

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(level: TransactionValidationLevel): boolean {
    throw new Error('Method not implemented.')
  }

  public fillTransactionRecipe(recipe: TransactionRecipe): void {
    recipe.amount = new Decimal(this.sender?.amount ?? 0)
  }
}
