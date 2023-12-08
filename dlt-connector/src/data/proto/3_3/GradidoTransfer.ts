import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { Field, Message } from 'protobufjs'

import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'

import { AbstractTransaction } from '../AbstractTransaction'

import { TransferAmount } from './TransferAmount'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransfer extends Message<GradidoTransfer> implements AbstractTransaction {
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

  public fillTransactionRecipe(recipe: Transaction): void {
    recipe.amount = new Decimal(this.sender?.amount ?? 0)
  }
}
