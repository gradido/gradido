import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { HieroId } from '../../schemas/typeGuard.schema'

export abstract class AbstractRemoteKeyPairRole {
  protected topic: HieroId
  public constructor(communityTopicId: HieroId) {
    this.topic = communityTopicId
  }
  public abstract retrieveKeyPair(): Promise<KeyPairEd25519>
}
