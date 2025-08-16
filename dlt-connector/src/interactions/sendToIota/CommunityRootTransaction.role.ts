import { GradidoTransactionBuilder } from 'gradido-blockchain-js'
import { Community } from '../../client/backend/community.schema'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { HieroId } from '../../schemas/typeGuard.schema'
import {
  AUF_ACCOUNT_DERIVATION_INDEX,
  GMW_ACCOUNT_DERIVATION_INDEX,
  hardenDerivationIndex,
} from '../../utils/derivationHelper'
import { KeyPairCalculation } from '../keyPairCalculation/KeyPairCalculation.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CommunityRootTransactionRole extends AbstractTransactionRole {
  constructor(private readonly community: Community) {
    super()
  }

  getSenderCommunityTopicId(): HieroId {
    return this.community.topicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await KeyPairCalculation(
      new KeyPairIdentifierLogic({ communityTopicId: this.community.topicId }),
    )
    const gmwKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    ) // as unknown as KeyPairEd25519
    const aufKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    ) // as unknown as KeyPairEd25519
    builder
      .setCreatedAt(this.community.createdAt)
      .setCommunityRoot(
        communityKeyPair.getPublicKey(),
        gmwKeyPair.getPublicKey(),
        aufKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
    return builder
  }
}
