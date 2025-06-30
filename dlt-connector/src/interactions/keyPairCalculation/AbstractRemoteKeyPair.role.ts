import { KeyPairEd25519 } from 'gradido-blockchain-js'

export abstract class AbstractRemoteKeyPairRole {
  public abstract retrieveKeyPair(): Promise<KeyPairEd25519>
}
