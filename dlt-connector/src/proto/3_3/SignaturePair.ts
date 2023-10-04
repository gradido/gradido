import { Field, Message } from '@apollo/protobufjs'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class SignaturePair extends Message<SignaturePair> {
  @Field.d(1, 'bytes')
  public pubKey: Buffer

  @Field.d(2, 'bytes')
  public signature: Buffer
}
