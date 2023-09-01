import { Field, Message } from '@apollo/protobufjs'

import { TransferAmount } from './TransferAmount'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransfer extends Message<GradidoTransfer> {
  @Field.d(1, TransferAmount)
  public sender: TransferAmount

  @Field.d(2, 'bytes')
  public recipient: Buffer
}
