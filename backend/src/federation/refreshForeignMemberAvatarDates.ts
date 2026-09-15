// AI-GENERATED — not an architecture reference
import { xcomMemberAvatars } from 'core'
import {
  dbSelectAuthenticatedForeignCommunities,
  dbSelectForeignMemberGradidoIds,
  dbUpsertForeignMemberAvatarDates,
  getHomeCommunity,
} from 'database'
import { getLogger } from 'log4js'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import {
  MEMBER_AVATARS_MAX_REFS,
  XCOM_MEMBER_AVATAR_DATES_TIMEOUT_MS,
} from '@/data/MemberAvatars.logic'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.federation.refreshForeignMemberAvatarDates`)

/**
 * Runs the refresh every `intervalMs`, the first time one interval after the start -- a
 * restart does not ask every other community at once, and the dates from the last run stay in
 * the table in the meantime.
 *
 * setTimeout twice rather than setInterval, like startValidateCommunities: a run that takes
 * longer than the interval does not overlap the next.
 *
 * ⛔ A run that throws is logged and the next one still comes. Nothing the other communities
 * answer throws (xcomMemberAvatars returns every failure of theirs), but a failing database
 * read does -- and without the catch the refresh would stop until the next restart, and with
 * it every withdrawal over there.
 */
export function startRefreshForeignMemberAvatarDates(intervalMs: number): void {
  logger.info(`refreshing the picture dates of other communities' members every ${intervalMs} ms`)
  setTimeout(async function run() {
    try {
      await refreshForeignMemberAvatarDates()
    } catch (err) {
      logger.error('refreshing the picture dates of other communities failed', err)
    }
    setTimeout(run, intervalMs)
  }, intervalMs)
}

/**
 * Asks every other community this one may ask when their members, as far as this community
 * holds a row for them, last changed the picture members may see (AS-019), and stores the
 * answers in `foreign_member_avatar_dates`. The booking list and the contact list read them
 * from there; the wallet fetches a picture where a date is, and forgets it where the date goes.
 *
 * The run itself remembers nothing: all state is in the table. A run that stops half way
 * leaves older rows, never a half-written one.
 *
 * ★ A member the answer does not name is stored as null -- no picture, switch off, deleted,
 * all the same to this side. That is how a withdrawal over there arrives here.
 *
 * ⛔ A block that fails -- no answer in time, a refusal, an answer that does not hold up -- gets
 * nothing written, and the rest of that community's blocks are not asked this run: what was
 * stored for them stays, until the community answers again. Writing null instead would take
 * every face of that community off the lists whenever it is briefly away.
 *
 * ★ The blocks answered before the failing one keep what they brought, on purpose. Each row is
 * true for its own member as of its own check, so a community refreshed in part holds no row
 * that contradicts another. Holding those answers back until every block has succeeded would
 * hold back the withdrawals in them as well -- and a community that fails somewhere on every
 * run would never be refreshed at all.
 *
 * One request at a time, each waiting for its answer, with at most MEMBER_AVATARS_MAX_REFS
 * members in it: ⌈stored members / MEMBER_AVATARS_MAX_REFS⌉ requests per community per run.
 */
export async function refreshForeignMemberAvatarDates(): Promise<void> {
  const homeCom = await getHomeCommunity()
  // Without its own key this community cannot seal a question, so every one would fail.
  if (!homeCom?.privateJwtKey) {
    return
  }
  for (const community of await dbSelectAuthenticatedForeignCommunities()) {
    // Not null: the query only hands out communities with a uuid.
    const communityUuid = community.communityUuid as string
    const gradidoIDs = await dbSelectForeignMemberGradidoIds(communityUuid)
    for (let start = 0; start < gradidoIDs.length; start += MEMBER_AVATARS_MAX_REFS) {
      const block = gradidoIDs.slice(start, start + MEMBER_AVATARS_MAX_REFS)
      const answer = await xcomMemberAvatars(
        homeCom,
        community,
        'dates',
        block,
        XCOM_MEMBER_AVATAR_DATES_TIMEOUT_MS,
      )
      if (!answer.success) {
        logger.warn('no picture dates from another community', answer.error.message)
        break
      }
      const dated = new Map(
        answer.value.map((member) => [member.gradidoID, new Date(member.avatarUpdatedAt)]),
      )
      const checkedAt = new Date()
      await dbUpsertForeignMemberAvatarDates(
        block.map((gradidoId) => ({
          communityUuid,
          gradidoId,
          // ★ Not named: nothing to show there.
          avatarUpdatedAt: dated.get(gradidoId) ?? null,
          checkedAt,
        })),
      )
    }
  }
}
