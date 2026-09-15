// AI-GENERATED — not an architecture reference
import { EncryptedTransferArgs, interpretEncryptedTransferArgs } from 'core'
import {
  dbFindMemberAvatarFull,
  dbFindMemberAvatarsSmall,
  dbFindMemberAvatarTimestampsByGradidoIds,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import {
  Ed25519PublicKey,
  encryptAndSign,
  isMemberAvatarsKind,
  JwtPayloadType,
  MemberAvatarPayload,
  MemberAvatarsJwtPayloadType,
  MemberAvatarsKind,
  MemberAvatarsResponseJwtPayloadType,
  Result,
} from 'shared'
import { Arg, Query, Resolver } from 'type-graphql'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { MEMBER_AVATARS_MAX_REFS } from '@/data/MemberAvatars.logic'

const createLogger = (method: string) =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.api.1_0.resolver.MemberAvatarsResolver.${method}`)

interface MemberAvatarsQuestion {
  kind: MemberAvatarsKind
  gradidoIDs: string[]
}

// TODO: replace with a valibot schema after update to typescript 5 is possible
/**
 * The question as the other server wrote it. It arrives as parsed JSON, so the payload type
 * is what the sender promised, not what arrived -- every field is checked before it is used.
 *
 * Every refusal is a statement about the PEER (it broke the protocol), never about a member,
 * and none of them echoes what the peer sent.
 */
const readQuestion = (payload: JwtPayloadType | null): Result<MemberAvatarsQuestion, string> => {
  if (!payload || payload.tokentype !== MemberAvatarsJwtPayloadType.MEMBER_AVATARS_TYPE) {
    return { success: false, error: 'unexpected tokentype' }
  }
  const { kind, gradidoIDs } = payload
  if (!isMemberAvatarsKind(kind)) {
    return { success: false, error: 'unknown kind' }
  }
  if (
    !Array.isArray(gradidoIDs) ||
    !gradidoIDs.every((id): id is string => typeof id === 'string')
  ) {
    return { success: false, error: 'gradidoIDs is not a list of strings' }
  }
  // The zoom answers one click (AS-018, AS-020): one member per field, as in the backend.
  if (kind === 'full' && gradidoIDs.length !== 1) {
    return { success: false, error: 'kind full takes exactly one gradidoID' }
  }
  if (gradidoIDs.length > MEMBER_AVATARS_MAX_REFS) {
    return { success: false, error: 'too many gradidoIDs at once' }
  }
  return { success: true, value: { kind, gradidoIDs } }
}

/**
 * Only this community's own members, and only the ones the switch, the deletion and the
 * community scope allow -- mayBeShownToMembers() inside each query decides that, exactly as
 * it does for a member of this community asking.
 */
const findMembers = async (
  { kind, gradidoIDs }: MemberAvatarsQuestion,
  homeCommunityUuid: string,
): Promise<MemberAvatarPayload[]> => {
  if (kind === 'small') {
    const rows = await dbFindMemberAvatarsSmall(gradidoIDs)
    return rows.map((row) => ({
      gradidoID: row.gradidoId,
      avatarUpdatedAt: row.updatedAt.toISOString(),
      avatar: row.avatarSmall.toString('base64'),
    }))
  }

  const dates = await dbFindMemberAvatarTimestampsByGradidoIds(gradidoIDs)
  if (kind === 'dates') {
    return [...dates].map(([gradidoID, updatedAt]) => ({
      gradidoID,
      avatarUpdatedAt: updatedAt.toISOString(),
      avatar: null,
    }))
  }

  // kind 'full': the date first, because it costs no picture data, then the 512 crop by the
  // pair -- this community is the member's home, so its uuid is the other half. Both readers
  // carry the same guard; if either says no, there is no entry.
  const [gradidoID] = gradidoIDs
  const updatedAt = dates.get(gradidoID)
  if (!updatedAt) {
    return []
  }
  const avatar = await dbFindMemberAvatarFull(gradidoID, homeCommunityUuid)
  return avatar
    ? [{ gradidoID, avatarUpdatedAt: updatedAt.toISOString(), avatar: avatar.toString('base64') }]
    : []
}

@Resolver()
export class MemberAvatarsResolver {
  /**
   * Another community asks for the pictures of members of THIS community -- for its own
   * members' lists (`small`), their zoom (`full`) or only the dates (`dates`).
   *
   * Who can ask: interpretEncryptedTransferArgs throws unless the publicKey names a community
   * this one knows, that community has a JWT key here, and the envelope verifies with that key
   * and decrypts with ours -- the same door voteForSendCoins goes through. Neither consults
   * `authenticated_at`: the backend's validateCommunities stores the JWT key of every
   * community it verifies and starts the authentication right after.
   *
   * The answer goes back the same way round: encrypted for the asking community's JWT key,
   * signed with ours.
   *
   * ⛔ No entry for a member who is unknown, has no picture, switched it off or is deleted,
   * and never an error for any of that -- one answer for all of them, so that asking cannot
   * be used to find out which accounts exist. An error means the peer broke the protocol.
   *
   * A query, since it only reads. The caller sends it as POST, like SendCoinsClient does.
   */
  @Query(() => String)
  async memberAvatars(@Arg('data') args: EncryptedTransferArgs): Promise<string> {
    const methodLogger = createLogger('memberAvatars')
    methodLogger.addContext('handshakeID', args.handshakeID)

    const question = readQuestion(await interpretEncryptedTransferArgs(args))
    if (!question.success) {
      const errmsg = `memberAvatars refused: ${question.error}`
      methodLogger.warn(errmsg)
      throw new Error(errmsg)
    }

    // interpretEncryptedTransferArgs has just read both rows and decrypted with the home
    // key, so a missing value here is a broken community row, not something the peer did.
    const homeCom = await getHomeCommunity()
    if (!homeCom?.privateJwtKey || !homeCom.communityUuid) {
      throw new Error('home community without JWT key or community uuid')
    }
    const requestingCom = await getCommunityByPublicKeyOrFail(new Ed25519PublicKey(args.publicKey))
    if (!requestingCom.publicJwtKey) {
      throw new Error('requesting community without JWT key')
    }

    const members = await findMembers(question.value, homeCom.communityUuid)
    methodLogger.debug(
      `memberAvatars ${question.value.kind}: ${question.value.gradidoIDs.length} asked, ${members.length} answered`,
    )
    return await encryptAndSign(
      new MemberAvatarsResponseJwtPayloadType(args.handshakeID, members),
      homeCom.privateJwtKey,
      requestingCom.publicJwtKey,
    )
  }
}
