import { User } from '@entity/User'
import { mnemonicToSeedSync } from 'bip39'
import { getMasterKeyFromSeed, getPublicKey } from 'ed25519-hd-key'

import { SecretKeyCryptography } from './SecretKeyCryptography'

export class HDWallet {
  privateKey: Buffer | null = null
  publicKey: Buffer | null = null
  chainCode: Buffer | null = null

  static createFromPassphrase(passphrase: string): HDWallet {
    const wallet = new HDWallet()
    const seed = mnemonicToSeedSync(passphrase)
    const { key, chainCode } = getMasterKeyFromSeed(seed.toString('hex'))
    wallet.privateKey = key
    wallet.chainCode = chainCode

    wallet.publicKey = getPublicKey(key, false)
    return wallet
  }

  /**
   * create wallet from user login
   * TODO: store also chain code encrypted in db
   * @param user
   * @param secretKey
   * @returns wallet
   */
  static createFromUserLogin(user: User, secretKey: SecretKeyCryptography): HDWallet | null {
    if (!user.privateKeyEncrypted) return null
    const wallet = new HDWallet()

    wallet.privateKey = secretKey.decrypt(Buffer.from(user.privateKeyEncrypted, 'hex'))
    if (wallet.privateKey) {
      wallet.publicKey = getPublicKey(wallet.privateKey, false)
    }
    return wallet
  }

  getRootPublicKeyHex(): string {
    return this.publicKey ? this.publicKey.toString('hex') : ''
  }

  getRootPrivateKeyEncryptedHex(secretKey: SecretKeyCryptography): string {
    if (!this.privateKey) return ''
    return secretKey.encrypt(this.privateKey).toString('hex')
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}
}
