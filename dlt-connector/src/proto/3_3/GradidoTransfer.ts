import { Field, Message } from '@apollo/protobufjs'

import { TransferAmount } from './TransferAmount'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransfer extends Message<GradidoTransfer> {
  constructor(transaction: TransactionDraft, coinOrigin?: string) {
    super({
      sender: new TransferAmount({
        amount: transaction.amount.toString(),
        communityId: coinOrigin,
      }),
    })
  }

  @Field.d(1, TransferAmount)
  public sender: TransferAmount

  @Field.d(2, 'bytes')
  public recipient: Buffer
}
