import { KeyPairEd25519 } from 'gradido-blockchain-js'

import { findUserByNameHash } from '../../client/GradidoNode/api'
import { IdentifierAccount } from '../../schemas/account.schema'
import { GradidoNodeMissingUserError, ParameterError } from '../../errors'
import { AbstractRemoteKeyPairRole } from './AbstractRemoteKeyPair.role'
import { uuid4ToHashSchema } from '../../schemas/typeConverter.schema'
import * as v from 'valibot'

export class RemoteAccountKeyPairRole extends AbstractRemoteKeyPairRole {
  public constructor(private identifier: IdentifierAccount) {
    super(identifier.communityUuid)
  }

  public async retrieveKeyPair(): Promise<KeyPairEd25519> {
    if (!this.identifier.account) {
      throw new ParameterError('missing account')
    }

    const accountPublicKey = await findUserByNameHash(
      v.parse(uuid4ToHashSchema, this.identifier.account.userUuid),
      this.topic,
    )
    if (accountPublicKey) {
      return new KeyPairEd25519(accountPublicKey)
    }
    throw new GradidoNodeMissingUserError('cannot find remote user', this.identifier)
  }
}
