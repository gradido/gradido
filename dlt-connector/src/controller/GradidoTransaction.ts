import { sign as ed25519Sign, verify as ed25519Verify } from 'bip32-ed25519'

import { KeyPair } from '@/model/KeyPair'
import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/data/proto/3_3/TransactionBody'
import { SignaturePair } from '@/data/proto/3_3/SignaturePair'
import { TransactionError } from '@/graphql/model/TransactionError'
import { TransactionErrorType } from '@/graphql/enum/TransactionErrorType'
import { logger } from '@/server/logger'
import { LogError } from '@/server/LogError'

export const create = (body: TransactionBody): GradidoTransaction => {
  try {
    const error = TransactionBody.verify(body)
    if (error) {
      logger.error('error verify TransactionBody with', error)
      throw new TransactionError(TransactionErrorType.PROTO_DECODE_ERROR, 'body verifying failed')
    }
  } catch (err) {
    if (err instanceof TransactionError) {
      throw err
    }
    logger.error('exception verify TransactionBody', err)
    throw new TransactionError(TransactionErrorType.PROTO_DECODE_ERROR, 'body verifying failed')
  }
  return new GradidoTransaction(body)
}

export const sign = (transaction: GradidoTransaction, signer: KeyPair): void => {
  const signature = ed25519Sign(transaction.bodyBytes, signer.getExtendPrivateKey())
  const sigPair = new SignaturePair({ pubKey: signer.publicKey, signature })
  logger.debug('sign transaction', {
    signature: signature.toString('hex'),
    publicKey: signer.publicKey.toString('hex'),
    bodyBytes: transaction.bodyBytes.toString('hex'),
  })
  transaction.sigMap.sigPair.push(sigPair)
}

export const verify = ({ sigMap, bodyBytes }: GradidoTransaction): boolean => {
  const { signature, pubKey } = sigMap.sigPair[0]
  logger.debug('verify transaction', {
    signature: signature.toString('hex'),
    publicKey: pubKey.toString('hex'),
    bodyBytes: bodyBytes.toString('hex'),
  })
  return ed25519Verify(bodyBytes, signature, pubKey)
}

export const getBody = (gradidoTransaction: GradidoTransaction): TransactionBody => {
  try {
    return TransactionBody.decode(new Uint8Array(gradidoTransaction.bodyBytes))
  } catch (error) {
    logger.error('error decoding body from gradido transaction: %s', error)
    throw new LogError('cannot decode body from gradido transaction')
  }
}
