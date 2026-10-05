// AI-GENERATED — not an architecture reference
import { Community as DbCommunity, dbFindFederatedCommunityByPublicKeyAndApi } from 'database'
import {
  AVATAR_FULL_MAX_BYTES,
  AVATAR_FULL_MAX_SIDE,
  AVATAR_SMALL_MAX_BYTES,
  AVATAR_SMALL_MAX_SIDE,
  encryptAndSign,
  JwtPayloadType,
  MemberAvatarPayload,
  MemberAvatarsJwtPayloadType,
  MemberAvatarsKind,
  MemberAvatarsResponseJwtPayloadType,
  Result,
  verifyAndDecrypt,
  XComRequestError,
} from 'shared'
import { probeImage } from 'shared-native'
import { randombytes_random } from 'sodium-native'
import { CONFIG as CONFIG_CORE } from '../../../config'
import { EncryptedTransferArgs } from '../../../graphql/model/EncryptedTransferArgs'
import { decodeJpegImage } from '../../../logic/JpegImage.logic'
import { MemberAvatarsClientFactory } from '../client/MemberAvatarsClientFactory'
import { readTransferAvatarDate } from './transferAvatarDate'

/** What a picture of each kind may be: the bounds setUserAvatar holds this community's own to. */
const PICTURE_BOUNDS = {
  small: { maxBytes: AVATAR_SMALL_MAX_BYTES, maxSide: AVATAR_SMALL_MAX_SIDE },
  full: { maxBytes: AVATAR_FULL_MAX_BYTES, maxSide: AVATAR_FULL_MAX_SIDE },
}

/**
 * Why a picture another community answered with is not handed on, or null: it is longer than a
 * picture of its kind may be, is not plain base64, does not begin and end as a JPEG, has a
 * header that is no JPEG's, or more pixels on a side than this community takes of its own
 * members.
 *
 * ⛔ The other community is authenticated, not trusted: the handshake says who answers, not
 * what its software does. What passes here goes to the wallet as it is, is shown to members
 * of this community and kept on their devices. This reads the header and no more -- it does
 * not decode the picture and does not encode it again, so it bounds what a picture costs
 * whoever shows it, and says nothing about what else the file carries.
 *
 * The length is asked first and on the string, before anything is decoded: 100 members may be
 * asked about at once.
 */
const pictureDefect = (avatar: string, kind: 'small' | 'full'): string | null => {
  const { maxBytes, maxSide } = PICTURE_BOUNDS[kind]
  if (avatar.length > Math.ceil(maxBytes / 3) * 4) {
    return 'is too long'
  }
  const decoded = decodeJpegImage(avatar, maxBytes)
  if (!decoded.success) {
    return `is ${decoded.error.reason}`
  }
  // Buffer.from skips what is no base64 instead of failing; the wallet puts the string into
  // an address, where it has to be exactly that.
  if (decoded.value.toString('base64') !== avatar) {
    return 'is not plain base64'
  }
  const probed = probeImage(decoded.value)
  if (!probed.success || probed.value.format !== 'jpeg') {
    return 'has no JPEG header'
  }
  if (probed.value.width > maxSide || probed.value.height > maxSide) {
    return 'has too many pixels'
  }
  return null
}

// TODO: replace with a valibot schema after update to typescript 5 is possible
/**
 * The answer as the other server wrote it. It arrives as parsed JSON, so the payload type is
 * what that server promised, not what arrived -- every field is checked before it is used.
 *
 * ⛔ More than the tokentype, and on purpose. The backend hands these members on as
 * `MemberAvatar`s, and ONE date that does not parse makes GraphQL answer the member's whole
 * `memberAvatars` request with `data: null` (measured with type-graphql 1.1.1) -- this
 * community's own faces included. And a member nobody asked about must not come back in the
 * place of one who was: the zoom shows the first entry as the face that was tapped.
 *
 * Each member at most once, which also bounds the answer by the question: without it one
 * member asked about could come back any number of times, each with a picture, and the
 * backend would hand every copy on to the wallet.
 *
 * And every picture is one this community would take of its own members by size and header
 * (pictureDefect). One that is not fails the whole answer, as every other defect does: no
 * faces from there this time.
 */
const readAnswer = (
  payload: JwtPayloadType,
  kind: MemberAvatarsKind,
  gradidoIDs: string[],
): Result<MemberAvatarPayload[], string> => {
  if (payload.tokentype !== MemberAvatarsResponseJwtPayloadType.MEMBER_AVATARS_RESPONSE_TYPE) {
    return { success: false, error: 'unexpected tokentype in the answer' }
  }
  const { members } = payload
  if (!Array.isArray(members)) {
    return { success: false, error: 'members in the answer is not a list' }
  }
  const asked = new Set(gradidoIDs)
  const answered = new Set<string>()
  for (const member of members) {
    const { gradidoID, avatarUpdatedAt, avatar } = (member ?? {}) as Record<string, unknown>
    if (typeof gradidoID !== 'string' || !asked.has(gradidoID)) {
      return { success: false, error: 'the answer names a member nobody asked about' }
    }
    if (answered.has(gradidoID)) {
      return { success: false, error: 'the answer names a member more than once' }
    }
    answered.add(gradidoID)
    if (readTransferAvatarDate(avatarUpdatedAt) === null) {
      return { success: false, error: 'the answer carries an unusable date' }
    }
    if (kind === 'dates' ? avatar !== null : typeof avatar !== 'string') {
      return {
        success: false,
        error: `the answer carries a picture that does not fit kind ${kind}`,
      }
    }
    if (kind !== 'dates') {
      // The reason, never the picture.
      const defect = pictureDefect(avatar as string, kind)
      if (defect) {
        return { success: false, error: `the answer carries a picture that ${defect}` }
      }
    }
  }
  return { success: true, value: members as MemberAvatarPayload[] }
}

/**
 * Asks another community about the pictures of ITS members -- the small renditions for a
 * list, the full one for a zoom (AS-020), or only the dates (AS-019). This community stores
 * none of what comes back (AS-004).
 *
 * The envelope is the one the money takes (processXComSendCoins): the question is encrypted
 * for the other community's JWT key and signed with ours, and the answer comes back the other
 * way round. The other side decides with its own rule who may be shown
 * (federation MemberAvatarsResolver, mayBeShownToMembers) and only answers a community that
 * has completed the authentication handshake with it.
 *
 * ★ Whatever the other community does wrong is a Result, never a throw: no federation entry
 * for the API version, no answer within `timeoutMs`, a refusal (an older community answers
 * "Cannot query field", one that does not trust this one "memberAvatars refused: …"), an
 * envelope that does not verify or decrypt, an answer that does not hold up (readAnswer).
 * What that means is the caller's decision -- for the relay, no faces from there this time.
 * A failing database read here still throws, as everywhere else.
 *
 * ⛔ It throws only for a call that could never have worked -- no ids, a zoom for more than
 * one member, a community without uuid. Those are mistakes of the caller, not of the other
 * community.
 *
 * @param timeoutMs how long the request may take, answer included (the signal is handed to
 *   graphql-request, see MemberAvatarsClient)
 */
export async function xcomMemberAvatars(
  homeCom: DbCommunity,
  foreignCom: DbCommunity,
  kind: MemberAvatarsKind,
  gradidoIDs: string[],
  timeoutMs: number,
): Promise<Result<MemberAvatarPayload[], XComRequestError>> {
  const communityUuid = foreignCom.communityUuid
  if (!communityUuid) {
    throw new Error('xcomMemberAvatars: the community to ask has no uuid')
  }
  if (gradidoIDs.length === 0 || (kind === 'full' && gradidoIDs.length !== 1)) {
    throw new Error(`xcomMemberAvatars: ${gradidoIDs.length} gradidoIDs for kind ${kind}`)
  }
  const failure = (reason: string): { success: false; error: XComRequestError } => ({
    success: false,
    error: new XComRequestError(communityUuid, reason),
  })

  // Data, not a mistake of the caller: a community whose handshake never finished has no key.
  const { privateJwtKey } = homeCom
  const { publicJwtKey } = foreignCom
  if (!privateJwtKey || !publicJwtKey) {
    return failure('no JWT key to build the envelope with')
  }

  const apiVersion = CONFIG_CORE.FEDERATION_BACKEND_SEND_ON_API
  const entry = await dbFindFederatedCommunityByPublicKeyAndApi(foreignCom.publicKey, apiVersion)
  if (!entry.success) {
    return failure(`no federation entry for api ${apiVersion}`)
  }
  const client = MemberAvatarsClientFactory.getInstance(entry.value)
  if (!client) {
    return failure(`no client for api ${entry.value.apiVersion}`)
  }

  const handshakeID = randombytes_random().toString()
  let jwt: string
  try {
    jwt = await encryptAndSign(
      new MemberAvatarsJwtPayloadType(handshakeID, kind, gradidoIDs),
      privateJwtKey,
      publicJwtKey,
    )
  } catch (err) {
    return failure(`the question could not be sealed: ${err}`)
  }
  const args: EncryptedTransferArgs = {
    handshakeID,
    publicKey: homeCom.publicKey.toString('hex'),
    jwt,
  }

  const response = await client.memberAvatars(args, AbortSignal.timeout(timeoutMs))
  if (!response.success) {
    return failure(response.error.message)
  }

  let payload: JwtPayloadType | null
  try {
    payload = await verifyAndDecrypt(handshakeID, response.value, privateJwtKey, publicJwtKey)
  } catch (err) {
    return failure(`the answer could not be opened: ${err}`)
  }
  if (!payload) {
    return failure('the answer does not verify with the key of the community asked')
  }
  const answer = readAnswer(payload, kind, gradidoIDs)
  return answer.success ? answer : failure(answer.error)
}
