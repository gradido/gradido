import { KeyPairEd25519 } from 'gradido-blockchain-js'

export abstract class AbstractKeyPairRole {
  public abstract generateKeyPair(): KeyPairEd25519
}
