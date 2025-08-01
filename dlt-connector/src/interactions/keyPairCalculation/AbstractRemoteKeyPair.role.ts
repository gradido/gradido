import { KeyPairEd25519 } from 'gradido-blockchain-js'
import { communityUuidToTopicSchema } from '../../client/backend/community.schema'
import * as v from 'valibot'

export abstract class AbstractRemoteKeyPairRole {
  protected topic: string
  public constructor(communityUuid: string) {
    this.topic = v.parse(communityUuidToTopicSchema, communityUuid)
  }
  public abstract retrieveKeyPair(): Promise<KeyPairEd25519>
}
