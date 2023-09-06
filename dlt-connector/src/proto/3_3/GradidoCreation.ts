import { Field, Message } from '@apollo/protobufjs'

import { TimestampSeconds } from './TimestampSeconds'
import { TransferAmount } from './TransferAmount'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'

// need signature from group admin or
// percent of group users another than the receiver
// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoCreation extends Message<GradidoCreation> {
  constructor(transaction: TransactionDraft) {
    if (!transaction.targetDate) {
      throw new TransactionError(
        TransactionErrorType.MISSING_PARAMETER,
        'missing targetDate for contribution',
      )
    }
    super({
      recipient: new TransferAmount({ amount: transaction.amount.toString() }),
      targetDate: new TimestampSeconds(new Date(transaction.targetDate)),
    })
  }

  @Field.d(1, TransferAmount)
  public recipient: TransferAmount

  @Field.d(3, 'TimestampSeconds')
  public targetDate: TimestampSeconds
}
