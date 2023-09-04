import { Field, Message } from '@apollo/protobufjs'

import { TimestampSeconds } from './TimestampSeconds'
import { TransferAmount } from './TransferAmount'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'

// need signature from group admin or
// percent of group users another than the receiver
// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoCreation extends Message<GradidoCreation> {
  constructor(transaction: TransactionDraft) {
    super({
      recipient: new TransferAmount({ amount: transaction.amount.toString() }),
      targetDate: new TimestampSeconds(),
    })
  }

  @Field.d(1, TransferAmount)
  public recipient: TransferAmount

  @Field.d(3, 'TimestampSeconds')
  public targetDate: TimestampSeconds
}
