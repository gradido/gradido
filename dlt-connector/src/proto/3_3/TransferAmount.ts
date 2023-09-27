import { Field, Message } from '@apollo/protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class TransferAmount extends Message<TransferAmount> {
  @Field.d(1, 'bytes')
  public pubkey: Buffer

  @Field.d(2, 'string')
  public amount: string

  // community which created this coin
  // used for colored coins
  @Field.d(3, 'string')
  public communityId: string
}
