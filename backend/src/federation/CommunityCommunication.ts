import { apiPost } from '@/apis/HttpRequest'
import CONFIG from '@/config'
import { Jwt } from 'jsonwebtoken'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const sodium = require('sodium-native')

/**
 * create signature from message with community ed25519 private key
 * @param message as buffer in binary format
 * @returns buffer containing signature in binary format
 */
function signWithCommunityPrivateKey(message: Buffer): Buffer {
  const sign = Buffer.alloc(sodium.crypto_sign_BYTES)
  // ed25519 private or secret key starts with 32 Bytes secret and end with 32 Bytes public key
  const secretKey = Buffer.from(CONFIG.COMMUNITY_PRIVATE_KEY + CONFIG.COMMUNITY_PUBLIC_KEY, 'hex')
  sodium.crypto_sign_detached(sign, message, secretKey)
  return sign
}

/**
 * start request to open communication with another community or blockchain connector
 * if succeed, it returns a valid jwt token for further requests
 * @param communityBPublicKey target community public key in hex format
 * @param communityBUrl target community url
 * @returns
 */
async function openCommunication(
  communityBPublicKey: string,
  communityBUrl: string,
): Promise<null | Jwt> {
  const result = await apiPost(`${communityBUrl}/openCommunication`, {
    'community-key-A': CONFIG.COMMUNITY_PUBLIC_KEY,
    signature: signWithCommunityPrivateKey(Buffer.from(communityBPublicKey, 'hex')).toString('hex'),
  })

  if (!result.success) {
    throw new Error(result.data)
  }
  return result.data.token
}

export { openCommunication }
