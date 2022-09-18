import { apiPost } from '@/apis/HttpRequest'
import CONFIG from '@/config'
import { signWithCommunityPrivateKey } from '@/util/crypto'
import { decode, Jwt } from 'jsonwebtoken'

async function openCommunication(communityBPublicKey: Buffer, communityBUrl: string): Promise<null | Jwt> {
  const result = await apiPost(`${CONFIG.BLOCKCHAIN_CONNECTOR_API_URL}/openCommunication`, {
    'community-key-A': CONFIG.COMMUNITY_PUBLIC_KEY,
    signature: signWithCommunityPrivateKey(communityBPublicKey).toString('hex'),
  })
  if (!result.success) {
    throw new Error(result.data)
  }
  return decode(result.data.jwt, { complete: true })
}

export { openCommunication }
