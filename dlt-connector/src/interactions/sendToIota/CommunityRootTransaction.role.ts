import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import {
  AUF_ACCOUNT_DERIVATION_INDEX,
  GMW_ACCOUNT_DERIVATION_INDEX,
  hardenDerivationIndex,
} from '../../utils/derivationHelper'

import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'

import { AbstractTransactionRole } from './AbstractTransaction.role'
import { Community, CommunityInput, communitySchema } from '../../schemas/rpcParameter.schema'
import * as v from 'valibot'

export class CommunityRootTransactionRole extends AbstractTransactionRole {
  private com: Community
  constructor(input: CommunityInput) {
    super()
    this.com = v.parse(communitySchema, input)
  }

  getSenderCommunityUuid(): string {
    return this.com.uuid
  }

  getRecipientCommunityUuid(): string {
    throw new Error('cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({ communityUuid: this.com.uuid }))
    const gmwKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    )
    const aufKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    )
    builder
      .setCreatedAt(this.com.createdAt)
      .setCommunityRoot(
        communityKeyPair.getPublicKey(),
        gmwKeyPair.getPublicKey(),
        aufKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
    return builder
  }
}
