import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { Decimal } from 'decimal.js-light'
import { Field, Message } from 'protobufjs'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'

import { AbstractTransaction } from '../AbstractTransaction'

import { TimestampSeconds } from './TimestampSeconds'
import { TransferAmount } from './TransferAmount'

// need signature from group admin or
// percent of group users another than the receiver
// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoCreation extends Message<GradidoCreation> implements AbstractTransaction {
  constructor(transaction?: TransactionDraft, recipientAccount?: Account) {
    if (transaction) {
      if (!transaction.targetDate) {
        throw new TransactionError(
          TransactionErrorType.MISSING_PARAMETER,
          'missing targetDate for contribution',
        )
      }
      super({
        recipient: new TransferAmount({
          amount: transaction.amount.toString(),
          pubkey: recipientAccount?.derive2Pubkey,
        }),
        targetDate: new TimestampSeconds(new Date(transaction.targetDate)),
      })
    } else {
      super()
    }
  }

  // recipient: TransferAmount contain
  // - recipient public key
  // - amount
  // - communityId // only set if not the same as recipient community
  @Field.d(1, TransferAmount)
  public recipient: TransferAmount

  @Field.d(3, 'TimestampSeconds')
  public targetDate: TimestampSeconds

  public fillTransactionRecipe(recipe: Transaction): void {
    recipe.amount = new Decimal(this.recipient.amount ?? 0)
  }
}
