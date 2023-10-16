import { Field, Message } from 'protobufjs'

import { TimestampSeconds } from './TimestampSeconds'
import { TransferAmount } from './TransferAmount'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionBase } from '../TransactionBase'
import { TransactionValidationLevel } from '@/graphql/enum/TransactionValidationLevel'
import { TransactionRecipe } from '@entity/TransactionRecipe'
import Decimal from 'decimal.js-light'
import { Account } from '@entity/Account'

// need signature from group admin or
// percent of group users another than the receiver
// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoCreation extends Message<GradidoCreation> implements TransactionBase {
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

  @Field.d(1, TransferAmount)
  public recipient: TransferAmount

  @Field.d(3, 'TimestampSeconds')
  public targetDate: TimestampSeconds

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(level: TransactionValidationLevel): boolean {
    throw new Error('Method not implemented.')
  }

  public fillTransactionRecipe(recipe: TransactionRecipe): void {
    recipe.amount = new Decimal(this.recipient.amount ?? 0)
  }
}
