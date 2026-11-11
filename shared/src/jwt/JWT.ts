import { createPrivateKey, createPublicKey, generateKeyPair, KeyObject } from 'node:crypto'
import { promisify } from 'node:util'
import { ResultNoError } from '../errorTypes'

// node crypto native variant, faster
const generateKeyPairAsync = promisify(generateKeyPair)
export async function createKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const { publicKey, privateKey } = await generateKeyPairAsync('rsa', {
    modulusLength: 2048,
    publicExponent: 0x10001,
  })

  return {
    publicKey: publicKey
      .export({
        type: 'spki',
        format: 'pem',
      })
      .toString(),

    privateKey: privateKey
      .export({
        type: 'pkcs8',
        format: 'pem',
      })
      .toString(),
  }
}

export function getPrivateKeyObjekt(value: string): ResultNoError<KeyObject> {
  try {
    return { success: true, value: createPrivateKey(value) }
  } catch {
    return { success: false }
  }
}

export function getPublicKeyObject(value: string): ResultNoError<KeyObject> {
  try {
    return { success: true, value: createPublicKey(value) }
  } catch {
    return { success: false }
  }
}
