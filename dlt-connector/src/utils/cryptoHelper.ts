import { KeyPair } from '@/data/KeyPair'

import { sign as ed25519Sign } from 'bip32-ed25519'

export const sign = (message: Buffer, keyPair: KeyPair): Buffer => {
  return ed25519Sign(message, keyPair.getExtendPrivateKey())
}
