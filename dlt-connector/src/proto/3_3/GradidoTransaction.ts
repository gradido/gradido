import { Field, Message } from '@apollo/protobufjs'

import { SignatureMap } from './SignatureMap'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransaction extends Message<GradidoTransaction> {
  @Field.d(1, SignatureMap)
  public sigMap: SignatureMap

  // inspired by Hedera
  // bodyBytes are the payload for signature
  // bodyBytes are serialized TransactionBody
  @Field.d(2, 'bytes')
  public bodyBytes: Buffer

  // if it is a cross group transaction the parent message
  // id from outbound transaction or other by cross
  @Field.d(3, 'bytes')
  public parentMessageId: Buffer
}
