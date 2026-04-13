import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { GradidoNodeClient } from '../../client/GradidoNode/GradidoNodeClient'
import {
  GradidoNodeInvalidTransactionError,
  GradidoNodeMissingTransactionError,
} from '../../errors'
import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'

export class ForeignCommunityKeyPairRole extends AbstractRemoteKeyPairRole {
  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    const transactionIdentifier = {
      transactionId: 1,
      communityId: this.communityId,
    }
    const firstTransaction =
      await GradidoNodeClient.getInstance().getTransaction(transactionIdentifier)
    if (!firstTransaction) {
      throw new GradidoNodeMissingTransactionError('Cannot find transaction', transactionIdentifier)
    }
    const transactionBody = firstTransaction.getGradidoTransaction()?.getTransactionBody()
    if (!transactionBody) {
      throw new GradidoNodeInvalidTransactionError(
        'Invalid transaction, body is missing',
        transactionIdentifier,
      )
    }
    if (!transactionBody.isCommunityRoot()) {
      throw new GradidoNodeInvalidTransactionError(
        'Invalid transaction, community root type expected',
        transactionIdentifier,
      )
    }
    const communityRoot = transactionBody.getCommunityRoot()
    if (!communityRoot) {
      throw new GradidoNodeInvalidTransactionError(
        'Invalid transaction, community root is missing',
        transactionIdentifier,
      )
    }
    return new KeyPairEd25519(communityRoot.getPublicKey())
  }
}
