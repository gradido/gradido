import { Field, Message } from 'protobufjs'

import { SignaturePair } from './SignaturePair'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class SignatureMap extends Message<SignatureMap> {
  constructor() {
    super({ sigPair: [] })
  }

  @Field.d(1, SignaturePair, 'repeated')
  public sigPair: SignaturePair[]
}
