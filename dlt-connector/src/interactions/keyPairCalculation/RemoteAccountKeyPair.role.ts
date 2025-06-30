import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { getTransactions } from '@/client/GradidoNode'
import { UserIdentifier } from '@/graphql/input/UserIdentifier'
import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'

export class RemoteAccountKeyPairRole extends AbstractRemoteKeyPairRole {
  public constructor(private user: UserIdentifier) {
    super()
  }

  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    if (!this.user.communityUser) {
      throw new LogError('missing community user')
    }

    const nameHash = uuid4ToHash(this.user.communityUser.uuid)
    const confirmedTransactions = await getTransactions(
      0,
      30,
      uuid4ToHash(this.user.communityUuid).convertToHex(),
    )
    for (let i = 0; i < confirmedTransactions.length; i++) {
      const transactionBody = confirmedTransactions[i].getGradidoTransaction()?.getTransactionBody()
      if (transactionBody && transactionBody.isRegisterAddress()) {
        const registerAddress = transactionBody.getRegisterAddress()
        if (registerAddress && registerAddress.getNameHash()?.equal(nameHash)) {
          return new KeyPairEd25519(registerAddress.getAccountPublicKey())
        }
      }
    }
    throw new LogError(
      'cannot find remote user in first 30 transaction from remote blockchain, please wait for better recover implementation',
    )
  }
}
