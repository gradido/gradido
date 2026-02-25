import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { Uuidv4 } from '../../schemas/typeGuard.schema'

export abstract class AbstractRemoteKeyPairRole {
  protected communityId: Uuidv4
  public constructor(communityId: Uuidv4) {
    this.communityId = communityId
  }
  public abstract retrieveKeyPair(): Promise<KeyPairEd25519>
}
