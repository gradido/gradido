import { KeyPair } from '@/data/KeyPair'
import { sign as ed25519Sign, generateFromSeed } from 'bip32-ed25519'
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'
// eslint-disable-next-line camelcase
import { randombytes_buf } from 'sodium-native'

export const sign = (message: Buffer, keyPair: KeyPair): Buffer => {
  return ed25519Sign(message, keyPair.getExtendPrivateKey())
}

export const generateKeyPair = (mnemonic: string): KeyPair => {
  const seedFromMnemonic = mnemonicToSeedSync(mnemonic)
  return new KeyPair(generateFromSeed(seedFromMnemonic))
}

export const generateMnemonic = (seed?: Buffer | string): string => {
  if (seed) {
    return entropyToMnemonic(seed)
  }
  const entropy = Buffer.alloc(256)
  randombytes_buf(entropy)
  return entropyToMnemonic(entropy)
}
