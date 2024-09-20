import { Community } from '@entity/Community'
// https://www.npmjs.com/package/bip32-ed25519
import {
  KeyPairEd25519,
  MemoryBlock,
  Passphrase,
  SecretKeyCryptography,
  SignaturePair,
} from 'gradido-blockchain-js'

import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'

/**
 * Class Managing Key Pair and also generate, sign and verify signature with it
 */
export class KeyPair {
  private _ed25519KeyPair: KeyPairEd25519
  /**
   * @param input: KeyPairEd25519 = already loaded KeyPairEd25519
   * @param input: Passphrase = Passphrase which work as seed for generating algorithms
   * @param input: MemoryBlock = a seed at least 32 byte
   * @param input: Community = community entity with keys loaded from db
   */
  public constructor(input: KeyPairEd25519 | Passphrase | MemoryBlock | Community) {
    let keyPair: KeyPairEd25519 | null = null
    if (input instanceof KeyPairEd25519) {
      keyPair = input
    } else if (input instanceof Passphrase) {
      keyPair = KeyPairEd25519.create(input)
    } else if (input instanceof MemoryBlock) {
      keyPair = KeyPairEd25519.create(input)
    } else if (input instanceof Community) {
      if (!input.rootEncryptedPrivkey || !input.rootChaincode || !input.rootPubkey) {
        throw new LogError(
          'missing encrypted private key or chaincode or public key in commmunity entity',
        )
      }
      const secretBox = this.createSecretBox(input.iotaTopic)
      keyPair = new KeyPairEd25519(
        new MemoryBlock(input.rootPubkey),
        secretBox.decrypt(new MemoryBlock(input.rootEncryptedPrivkey)),
        new MemoryBlock(input.rootChaincode),
      )
    }
    if (!keyPair) {
      throw new LogError("couldn't create KeyPairEd25519 from input")
    }
    this._ed25519KeyPair = keyPair
  }

  /**
   * copy keys to community entity
   * @param community
   */
  public fillInCommunityKeys(community: Community) {
    const secretBox = this.createSecretBox(community.iotaTopic)
    community.rootPubkey = this._ed25519KeyPair.getPublicKey()?.data()
    community.rootEncryptedPrivkey = this._ed25519KeyPair.getCryptedPrivKey(secretBox).data()
    community.rootChaincode = this._ed25519KeyPair.getChainCode()?.data()
  }

  public get publicKey(): Buffer {
    const publicKey = this._ed25519KeyPair.getPublicKey()
    if (!publicKey) {
      throw new LogError('invalid key pair, get empty public key')
    }
    return publicKey.data()
  }

  public get keyPair(): KeyPairEd25519 {
    return this._ed25519KeyPair
  }

  public derive(path: number[]): KeyPair {
    return new KeyPair(
      path.reduce(
        (keyPair: KeyPairEd25519, node: number) => keyPair.deriveChild(node),
        this._ed25519KeyPair,
      ),
    )
  }

  public sign(message: Buffer): Buffer {
    return this._ed25519KeyPair.sign(new MemoryBlock(message)).data()
  }

  public static verify(message: Buffer, signaturePair: SignaturePair): boolean {
    const publicKeyPair = new KeyPairEd25519(signaturePair.getPubkey())
    const signature = signaturePair.getSignature()
    if (!signature) {
      throw new LogError('missing signature')
    }
    return publicKeyPair.verify(new MemoryBlock(message), signature)
  }

  private createSecretBox(salt: string): SecretKeyCryptography {
    if (!CONFIG.GRADIDO_BLOCKCHAIN_PRIVATE_KEY_ENCRYPTION_PASSWORD) {
      throw new LogError(
        'missing GRADIDO_BLOCKCHAIN_PRIVATE_KEY_ENCRYPTION_PASSWORD in env or config',
      )
    }
    const secretBox = new SecretKeyCryptography()
    secretBox.createKey(salt, CONFIG.GRADIDO_BLOCKCHAIN_PRIVATE_KEY_ENCRYPTION_PASSWORD)
    return secretBox
  }
}
