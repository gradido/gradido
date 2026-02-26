import { KeyPairEd25519, MemoryBlock } from 'gradido-blockchain-js'
import { GradidoBlockchainCryptoError, ParameterError } from '../errors'
import { Hex32, Uuidv4 } from '../schemas/typeGuard.schema'
import { hardenDerivationIndex } from '../utils/derivationHelper'

export function deriveFromSeed(seed: Hex32): KeyPairEd25519 {
  const keyPair = KeyPairEd25519.create(MemoryBlock.fromHex(seed))
  if (!keyPair) {
    throw new Error(`couldn't create keyPair from seed: ${seed}`)
  }
  return keyPair
}

export function deriveFromCode(code: string): KeyPairEd25519 {
  // code is expected to be 24 bytes long, but we need 32
  // so hash the seed with blake2 and we have 32 Bytes
  const hash = new MemoryBlock(code).calculateHash()
  const keyPair = KeyPairEd25519.create(hash)
  if (!keyPair) {
    throw new ParameterError(`error creating Ed25519 KeyPair from seed: ${code.substring(0, 5)}...`)
  }
  return keyPair
}

export function deriveFromKeyPairAndUuid(keyPair: KeyPairEd25519, uuid: Uuidv4): KeyPairEd25519 {
  const wholeHex = Buffer.from(uuid.replace(/-/g, ''), 'hex')
  const parts = []
  for (let i = 0; i < 4; i++) {
    parts[i] = hardenDerivationIndex(wholeHex.subarray(i * 4, (i + 1) * 4).readUInt32BE())
  }
  // parts: [2206563009, 2629978174, 2324817329, 2405141782]
  return parts.reduce(
    (keyPair: KeyPairEd25519, node: number) => deriveFromKeyPairAndIndex(keyPair, node),
    keyPair,
  )
}

export function deriveFromKeyPairAndIndex(keyPair: KeyPairEd25519, index: number): KeyPairEd25519 {
  const localKeyPair = keyPair.deriveChild(index)
  if (!localKeyPair) {
    throw new GradidoBlockchainCryptoError(
      `KeyPairEd25519 child derivation failed, has private key: ${keyPair.hasPrivateKey()}, index: ${index}`,
    )
  }
  return localKeyPair
}
