import { sign as ed25519Sign, verify as ed25519Verify } from 'bip32-ed25519'

import { GradidoTransaction } from '@/data/proto/3_3/GradidoTransaction'
import { SignaturePair } from '@/data/proto/3_3/SignaturePair'
import { logger } from '@/logging/logger'
import { KeyPair } from '@/model/KeyPair'

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
