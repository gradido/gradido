import { GradidoTransactionBuilder } from 'gradido-blockchain-js'
import { KeyPairIdentifierLogic } from '../../data/KeyPairIdentifier.logic'
import { GradidoBlockchainCryptoError } from '../../errors'
import { Community } from '../../schemas/transaction.schema'
import { HieroId } from '../../schemas/typeGuard.schema'
import {
  AUF_ACCOUNT_DERIVATION_INDEX,
  GMW_ACCOUNT_DERIVATION_INDEX,
  hardenDerivationIndex,
} from '../../utils/derivationHelper'
import { ResolveKeyPair } from '../resolveKeyPair/ResolveKeyPair.context'
import { AbstractTransactionRole } from './AbstractTransaction.role'

export class CommunityRootTransactionRole extends AbstractTransactionRole {
  constructor(private readonly community: Community) {
    super()
  }

  getSenderCommunityTopicId(): HieroId {
    return this.community.hieroTopicId
  }

  getRecipientCommunityTopicId(): HieroId {
    throw new Error('cannot be used as cross group transaction')
  }

  public async getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder> {
    const builder = new GradidoTransactionBuilder()
    const communityKeyPair = await ResolveKeyPair(
      new KeyPairIdentifierLogic({ communityTopicId: this.community.hieroTopicId }),
    )
    const gmwKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(GMW_ACCOUNT_DERIVATION_INDEX),
    )
    if (!gmwKeyPair) {
      throw new GradidoBlockchainCryptoError(
        `KeyPairEd25519 child derivation failed, has private key: ${communityKeyPair.hasPrivateKey()} for community: ${this.community.uuid}`,
      )
    }
    const aufKeyPair = communityKeyPair.deriveChild(
      hardenDerivationIndex(AUF_ACCOUNT_DERIVATION_INDEX),
    )
    if (!aufKeyPair) {
      throw new GradidoBlockchainCryptoError(
        `KeyPairEd25519 child derivation failed, has private key: ${communityKeyPair.hasPrivateKey()} for community: ${this.community.uuid}`,
      )
    }
    builder
      .setCreatedAt(this.community.creationDate)
      .setCommunityRoot(
        communityKeyPair.getPublicKey(),
        gmwKeyPair.getPublicKey(),
        aufKeyPair.getPublicKey(),
      )
      .sign(communityKeyPair)
    return builder
  }
}
