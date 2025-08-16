import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { getTransaction } from '../../client/GradidoNode/api'
import {
  GradidoNodeInvalidTransactionError,
  GradidoNodeMissingTransactionError,
} from '../../errors'
import { HieroId } from '../../schemas/typeGuard.schema'
import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'

export class ForeignCommunityKeyPairRole extends AbstractRemoteKeyPairRole {
  public constructor(communityTopicId: HieroId) {
    super(communityTopicId)
  }

  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    const transactionIdentifier = {
      transactionNr: 1,
      topic: this.topic,
    }
    const firstTransaction = await getTransaction(transactionIdentifier)
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
