/* eslint-disable camelcase */
import { AddressType_COMMUNITY_HUMAN, GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { LogError } from '@/server/LogError'
import { uuid4ToHash } from '@/utils/typeConverter'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class RegisterAddressTransactionRole extends AbstractTransactionRole {
  constructor(private self: UserAccountDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.user.communityUuid
  }

  getRecipientCommunityUuid(): string {
    throw new LogError('cannot yet be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(this.self.user.communityUuid)
    const accountKeyPair = await KeyPairCalculation(this.self.user)
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setRegisterAddress(
        accountKeyPair.getPublicKey(),
        AddressType_COMMUNITY_HUMAN,
        uuid4ToHash(this.self.user.uuid),
      )
      .sign(communityKeyPair)
      .sign(accountKeyPair)
    return builder
  }
}
