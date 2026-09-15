// AI-GENERATED — not an architecture reference
import { EncryptedTransferArgs, interpretEncryptedTransferArgs } from 'core'
import {
  dbFindMemberAvatarFullWithDate,
  dbFindMemberAvatarsSmall,
  dbFindMemberAvatarTimestampsByGradidoIds,
  getCommunityByPublicKeyOrFail,
  getHomeCommunity,
} from 'database'
import { getLogger, Logger } from 'log4js'
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

/** Logged here, thrown to the peer. Every reason is about the peer, never about a member. */
const refusal = (logger: Logger, reason: string): Error => {
  const errmsg = `memberAvatars refused: ${reason}`
  logger.warn(errmsg)
  return new Error(errmsg)
}

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

  if (kind === 'dates') {
    const dates = await dbFindMemberAvatarTimestampsByGradidoIds(gradidoIDs)
    return [...dates].map(([gradidoID, updatedAt]) => ({
      gradidoID,
      avatarUpdatedAt: updatedAt.toISOString(),
      avatar: null,
    }))
  }

  // kind 'full': the 512 crop by the pair -- this community is the member's home, so its uuid
  // is the other half -- with the date of the same row.
  const [gradidoID] = gradidoIDs
  const row = await dbFindMemberAvatarFullWithDate(gradidoID, homeCommunityUuid)
  return row
    ? [
        {
          gradidoID,
          avatarUpdatedAt: row.updatedAt.toISOString(),
          avatar: row.avatarFull.toString('base64'),
        },
      ]
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
   * and decrypts with ours -- the door voteForSendCoins goes through. On top of that, the
   * community must have completed the authentication handshake (`authenticated_at`): the
   * backend's validateCommunities stores a community's JWT key BEFORE it starts that
   * handshake, so a verified envelope alone says nothing about whether it ever succeeded.
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

    // Throws for an unknown community, a missing JWT key and an envelope that does not verify
    // or decrypt.
    const payload = await interpretEncryptedTransferArgs(args)

    const requestingCom = await getCommunityByPublicKeyOrFail(new Ed25519PublicKey(args.publicKey))
    if (!requestingCom.authenticatedAt || !requestingCom.publicJwtKey) {
      throw refusal(methodLogger, 'requesting community is not authenticated')
    }

    const question = readQuestion(payload)
    if (!question.success) {
      throw refusal(methodLogger, question.error)
    }

    // interpretEncryptedTransferArgs has just decrypted with the home key, so a missing value
    // here is a broken community row, not something the peer did.
    const homeCom = await getHomeCommunity()
    if (!homeCom?.privateJwtKey || !homeCom.communityUuid) {
      throw new Error('home community without JWT key or community uuid')
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
