import { sign as ed25519Sign } from 'bip32-ed25519'

import { KeyPair } from '@/model/KeyPair'
import { GradidoTransaction } from '@/proto/3_3/GradidoTransaction'
import { TransactionBody } from '@/proto/3_3/TransactionBody'
import { SignaturePair } from '@/proto/3_3/SignaturePair'

export const create = (body: TransactionBody): GradidoTransaction => {
  return new GradidoTransaction(body)
}

export const sign = (transaction: GradidoTransaction, signer: KeyPair): void => {
  const signature = ed25519Sign(transaction.bodyBytes, signer.getExtendPrivateKey())
  const sigPair = new SignaturePair({ pubKey: signer.publicKey, signature })
  transaction.sigMap.sigPair.push(sigPair)
}
