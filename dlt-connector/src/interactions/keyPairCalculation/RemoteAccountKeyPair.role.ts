import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'

import { findUserByNameHash } from '../../client/GradidoNode/api'
import { Uuidv4Hash } from '../../data/Uuidv4Hash'
import { GradidoNodeMissingUserError, ParameterError } from '../../errors'
import { IdentifierAccount } from '../../schemas/account.schema'
import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'

export class RemoteAccountKeyPairRole extends AbstractRemoteKeyPairRole {
  public constructor(private identifier: IdentifierAccount) {
    super(identifier.communityTopicId)
  }

  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    if (!this.identifier.account) {
      throw new ParameterError('missing account')
    }

    const accountPublicKey = await findUserByNameHash(
      new Uuidv4Hash(this.identifier.account.userUuid),
      this.topic,
    )
    if (accountPublicKey) {
      return new KeyPairEd25519(MemoryBlock.createPtr(MemoryBlock.fromHex(accountPublicKey)))
    }
    throw new GradidoNodeMissingUserError('cannot find remote user', this.identifier)
  }
}
