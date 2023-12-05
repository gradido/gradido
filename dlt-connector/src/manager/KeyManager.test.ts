/* eslint-disable camelcase */
import { entropyToMnemonic, mnemonicToSeedSync } from 'bip39'

import { generateFromSeed, toPublic } from 'bip32-ed25519'

describe('controller/KeyManager', () => {
  describe('test crypto lib', () => {
    it('key length', () => {
      const mnemonic = entropyToMnemonic(
        'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
      )
      expect(mnemonic).toEqual(
        'primary taxi danger target useless ancient match hammer fever crisp timber crew produce toy jeans that abandon math mimic master filter design carbon carbon',
      )
      const seed = mnemonicToSeedSync(mnemonic)
      // private key 64 Bytes + 32 Byte ChainCode
      const extendPrivkey = generateFromSeed(seed)
      expect(extendPrivkey).toHaveLength(96)
      // public key 32 Bytes + 32 Bytes ChainCode
      expect(toPublic(extendPrivkey)).toHaveLength(64)
    })
  })
})
