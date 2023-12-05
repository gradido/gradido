import { Field, Message } from 'protobufjs'

import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { TransactionError } from '@/graphql/model/TransactionError'
import { LogError } from '@/server/LogError'
import { logger } from '@/server/logger'

import { SignatureMap } from './SignatureMap'
import { SignaturePair } from './SignaturePair'
import { TransactionBody } from './TransactionBody'

// https://www.npmjs.com/package/@apollo/protobufjs
// eslint-disable-next-line no-use-before-define
export class GradidoTransaction extends Message<GradidoTransaction> {
  constructor(body?: TransactionBody) {
    if (body) {
      super({
        sigMap: new SignatureMap(),
        bodyBytes: Buffer.from(TransactionBody.encode(body).finish()),
      })
    } else {
      super()
    }
  }

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
  public parentMessageId?: Buffer

  getFirstSignature(): SignaturePair {
    const sigPair = this.sigMap.sigPair
    if (sigPair.length !== 1) {
      throw new LogError("signature count don't like expected")
    }
    return sigPair[0]
  }

  getTransactionBody(): TransactionBody {
    try {
      return TransactionBody.decode(new Uint8Array(this.bodyBytes))
    } catch (error) {
      logger.error('error decoding body from gradido transaction: %s', error)
      throw new TransactionError(
        TransactionErrorType.PROTO_DECODE_ERROR,
        'cannot decode body from gradido transaction',
      )
    }
  }
}
