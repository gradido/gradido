import { sign as ed25519Sign } from 'bip32-ed25519'

import { KeyPair } from '@/model/KeyPair'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { SignaturePair } from '@/proto/3_3/SignaturePair'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { logger } from '@/server/logger'
import { LogError } from '@/server/LogError'

export const create = (body: TransactionBody): GradidoTransaction => {
  const err = TransactionBody.verify(body)
  if (err) {
    logger.error('error verify TransactionBody with: %s', err)
    throw new TransactionError(TransactionErrorType.PROTO_DECODE_ERROR, 'body verifying failed')
  }
  const serialized = TransactionBody.encode(body).finish()
  if (body !== TransactionBody.decode(serialized)) {
    throw new LogError(' nooooo !')
  }
  return new GradidoTransaction(body)
}

export const sign = (transaction: GradidoTransaction, signer: KeyPair): void => {
  const signature = ed25519Sign(transaction.bodyBytes, signer.getExtendPrivateKey())
  const sigPair = new SignaturePair({ pubKey: signer.publicKey, signature })
  transaction.sigMap.sigPair.push(sigPair)
}
