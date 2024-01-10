import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import Decimal from 'decimal.js-light'
import { Field, Message } from 'protobufjs'

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

  // sender: TransferAmount contain
  // - sender public key
  // - amount
  // - communityId // only set if not the same as sender and recipient community
  @Field.d(1, TransferAmount)
  public sender: TransferAmount

  // the recipient public key
  @Field.d(2, 'bytes')
  public recipient: Buffer

  public fillTransactionRecipe(recipe: Transaction): void {
    recipe.amount = new Decimal(this.sender?.amount ?? 0)
  }
}
