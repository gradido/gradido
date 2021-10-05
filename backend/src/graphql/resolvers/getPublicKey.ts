import { apiPost } from '../../apis/HttpRequest'
import CONFIG from '../../config'
import { isHexPublicKey } from '../../util/validate'

// target can be email, username or public_key
// groupId if not null and another community, try to get public key from there
export default async function getPublicKey(
  target: string,
  sessionId: number,
  groupId = 0,
): Promise<string | undefined> {
  // if it is already a public key, return it
  if (isHexPublicKey(target)) {
    return target
  }

  // assume it is a email address if it's contain a @
  if (/@/i.test(target)) {
    const result = await apiPost(CONFIG.LOGIN_API_URL + 'getUserInfos', {
      session_id: sessionId,
      email: target,
      ask: ['user.pubkeyhex'],
    })
    if (result.success) {
      return result.data.userData.pubkeyhex
    }
  }

  // if username is used add code here

  // if we have multiple communities add code here

  return undefined
}
