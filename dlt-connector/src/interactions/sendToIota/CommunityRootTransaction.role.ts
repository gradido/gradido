import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { LogError } from '@/server/LogError'
import {
  AUF_ACCOUNT_DERIVATION_INDEX,
  GMW_ACCOUNT_DERIVATION_INDEX,
  hardenDerivationIndex,
} from '@/utils/derivationHelper'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CommunityRootTransactionRole extends AbstractTransactionRole {
  constructor(private self: CommunityDraft) {
    super()
  }

  getSenderCommunityUuid(): string {
    return this.self.uuid
  }

  getRecipientCommunityUuid(): string {
    throw new LogError('cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(this.self.uuid)
    const gmwKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    )
    const aufKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    )
    builder
      .setCreatedAt(new Date(this.self.createdAt))
      .setCommunityRoot(
        communityKeyPair.getPublicKey(),
        gmwKeyPair.getPublicKey(),
        aufKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
    return builder
  }
}
