import { KeyPair } from '@/model/KeyPair'
import { sign as ed25519Sign, verify as ed25519Verify } from 'bip32-ed25519'

export const sign = (message: Buffer, keyPair: KeyPair): Buffer => {
  return ed25519Sign(message, keyPair.getExtendPrivateKey())
}
