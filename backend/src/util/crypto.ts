import CONFIG from '@/config'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

function signWithCommunityPrivateKey(message: Buffer): Buffer {
  const sign = Buffer.alloc(sodium.crypto_sign_BYTES)
  const secretKey = Buffer.from(CONFIG.COMMUNITY_PRIVATE_KEY + CONFIG.COMMUNITY_PUBLIC_KEY, 'hex')
  sodium.crypto_sign_detached(sign, message, secretKey)
  return sign
}

export { signWithCommunityPrivateKey }
