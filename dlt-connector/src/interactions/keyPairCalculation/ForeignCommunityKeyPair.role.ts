import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { getTransaction } from '@/client/GradidoNode'
import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'

export class ForeignCommunityKeyPairRole extends AbstractRemoteKeyPairRole {
  public constructor(private communityUuid: string) {
    super()
  }

  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    const firstTransaction = await getTransaction(1, uuid4ToHash(this.communityUuid).convertToHex())
    if (!firstTransaction) {
      throw new LogError(
        "GradidoNode Server don't know this community with uuid " + this.communityUuid,
      )
    }
    const transactionBody = firstTransaction.getGradidoTransaction()?.getTransactionBody()
    if (!transactionBody || !transactionBody.isCommunityRoot()) {
      throw new LogError('get invalid confirmed transaction from gradido node')
    }
    const communityRoot = transactionBody.getCommunityRoot()
    if (!communityRoot) {
      throw new LogError('invalid confirmed transaction')
    }
    return new KeyPairEd25519(communityRoot.getPublicKey())
  }
}
