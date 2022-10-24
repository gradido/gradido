import { apiPost } from '@/apis/HttpRequest'
import CONFIG from '@/config'
import { decode, Jwt } from 'jsonwebtoken'

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
 * Start request to open communication with another community or blockchain connector.
 * If succeed, it returns a valid jwt token for further requests.
 * It is assumed that both communication partner are knowing each other.
 * For example by handshaking before or writing each others public key into config.
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
  // check if we really get a jwt token
  const decoded = decode(result.data.token)
  if (!decoded || typeof decoded === 'string' || !decoded.iat || !decoded.exp) {
    throw new Error('getting something other than JWT token')
  }
  const secondsSinceEpoch = Math.floor(new Date().getTime() / 1000)
  if (decoded.iat > secondsSinceEpoch || decoded.exp < secondsSinceEpoch) {
    throw new Error("JWT Token hasn't valid dates")
  }
  return result.data.token
}

export { openCommunication }
