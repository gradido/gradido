import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { getTransaction } from '../../client/GradidoNode/api'

import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'
import { GradidoNodeInvalidTransactionError, GradidoNodeMissingTransactionError } from '../../errors'

export class ForeignCommunityKeyPairRole extends AbstractRemoteKeyPairRole {
  public constructor(communityUuid: string) {
    super(communityUuid)
  }

  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    const transactionIdentifier = {
      transactionNr: 1,
      iotaTopic: this.topic,
    }
    const firstTransaction = await getTransaction(transactionIdentifier)
    if (!firstTransaction) {
      throw new GradidoNodeMissingTransactionError('Cannot find transaction', transactionIdentifier)
    }
    const transactionBody = firstTransaction.getGradidoTransaction()?.getTransactionBody()
    if (!transactionBody) {
      throw new GradidoNodeInvalidTransactionError(
        'Invalid transaction, body is missing', 
        transactionIdentifier
      )
    }
    if (!transactionBody.isCommunityRoot()) {
      throw new GradidoNodeInvalidTransactionError(
        'Invalid transaction, community root type expected',
        transactionIdentifier
      )
    }
    const communityRoot = transactionBody.getCommunityRoot()
    if (!communityRoot) {
      throw new GradidoNodeInvalidTransactionError(
        'Invalid transaction, community root is missing',
        transactionIdentifier
      )
    }
    return new KeyPairEd25519(communityRoot.getPublicKey())
  }
}
