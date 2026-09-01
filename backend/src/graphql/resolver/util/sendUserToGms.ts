import {
  AppDatabase,
  Community as DbCommunity,
  User as DbUser,
  dbSelectActiveMatchingEntriesByUserIds,
  MatchingEntrySelect,
} from 'database'
import { getLogger } from 'log4js'
import { putGmsMatchingEntrySnapshots, upsertGmsUsers } from '@/apis/gms/GmsClient'
import { GmsMatchingEntrySnapshot } from '@/apis/gms/model/GmsMatchingEntry'
import { GmsUser } from '@/apis/gms/model/GmsUser'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { LogError } from '@/server/LogError'

const logger = getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.sendUserToGms`)

/**
 * What one snapshot call may carry, as the GMS bounds it.
 *
 * Mirrored rather than imported - the GMS is a separate repository - and deliberately
 * a little under its own numbers (500 snapshots, 3000 entries), so that its next
 * change does not break this the day it lands.
 */
const GMS_MAX_SNAPSHOTS_PER_CALL = 400
const GMS_MAX_ENTRIES_PER_CALL = 2500

/**
 * @param withMatchingEntries send each user's live entries along, stating their
 *   full set: the GMS writes what it receives and removes what is missing. This is
 *   the repair path (ExportUsers) - it also cleans up entries that were paused or
 *   deleted while the GMS was unreachable. The everyday path leaves it out, and
 *   the GMS keeps the entries it has.
 */
/**
 * Split a batch of snapshots so that no call exceeds what the GMS accepts.
 *
 * Two bounds at once - members per call and entries across the call - because the GMS
 * enforces both and either can bind first.
 *
 * ⛔ A member whose OWN entries exceed the entry limit gets a chunk to themselves, and
 * that chunk cannot succeed - nothing here can make them fit, and splitting their
 * snapshot would change what a snapshot MEANS (the full set, so that what is missing
 * is deleted) and silently wipe the entries left out. Such a chunk is therefore never
 * sent; `sendUsersToGms` drops it before the call. An earlier comment here claimed the
 * member would be "refused there rather than taking the batch down with them", which
 * was wrong in a way worth naming: the send THROWS on a refusal, the throw leaves the
 * loop, and every later chunk goes unsent - for ever, because the repair run retries
 * from the same place and hits the same member again.
 */
function chunkByEntryCount(snapshots: GmsMatchingEntrySnapshot[]): GmsMatchingEntrySnapshot[][] {
  const chunks: GmsMatchingEntrySnapshot[][] = []
  let chunk: GmsMatchingEntrySnapshot[] = []
  let entries = 0
  for (const snapshot of snapshots) {
    const wouldExceed =
      chunk.length >= GMS_MAX_SNAPSHOTS_PER_CALL ||
      (chunk.length > 0 && entries + snapshot.entries.length > GMS_MAX_ENTRIES_PER_CALL)
    if (wouldExceed) {
      chunks.push(chunk)
      chunk = []
      entries = 0
    }
    chunk.push(snapshot)
    entries += snapshot.entries.length
  }
  if (chunk.length) {
    chunks.push(chunk)
  }
  return chunks
}

export async function sendUsersToGms(
  users: DbUser[],
  homeCom: DbCommunity,
  withMatchingEntries = false,
): Promise<boolean> {
  if (homeCom.gmsApiKey === null) {
    throw new LogError('HomeCommunity needs GMS-ApiKey to publish user data to GMS.')
  }

  try {
    const userIds = users.map((user) => user.id)
    logger.debug(`Users will be send to GMS ${userIds}`)

    let snapshots: GmsMatchingEntrySnapshot[] | undefined
    if (withMatchingEntries) {
      const entriesByUser = await findLiveEntriesByUser(userIds)
      // ⛔ Only members who may actually be published, and this became a rule rather
      // than a nicety when the snapshot started carrying an entry's KEYING. A
      // member's own sentence going over for somebody who has left is one thing; the
      // words derived from it are another, because they go on into a vocabulary with
      // no community bound and no delete path.
      //
      // Belt as well as braces: every caller already filters. `ExportUsers` selects
      // `foreign: false, gmsAllowed: true` with `deleted_at is null`; the resolver
      // path sits inside `user.gmsAllowed`; registration inside `dbUser.gmsAllowed`.
      // Measured at the call sites, not inferred - and kept here anyway, because this
      // is the only place that knows what a snapshot now carries.
      //
      // Left out entirely rather than sent with an empty list: an empty snapshot
      // means "this member has no live entries", which would delete what the GMS
      // holds. For somebody who has withdrawn, that removal belongs to
      // `removeUserFromGms`, which does it properly and retries.
      snapshots = users
        .filter((user) => user.gmsAllowed && !user.deletedAt && !user.foreign)
        // One snapshot per remaining user, the ones without entries included. An empty
        // list matters: it tells the GMS this member has no live entries, so any it
        // still holds are removed. A member left out of the batch is not touched.
        .map(
          (user) => new GmsMatchingEntrySnapshot(user.gradidoID, entriesByUser.get(user.id) ?? []),
        )
    }

    const result = await upsertGmsUsers(
      homeCom.gmsApiKey,
      users.map((user) => new GmsUser(user)),
    )
    if (result) {
      if (snapshots) {
        // Strictly after the users: the GMS drops a snapshot for a member it does not
        // know yet, warns, and answers 200 all the same - so the wrong order loses the
        // entries without anything here noticing.
        //
        // In chunks by ENTRY count, not by member count, because that is what the GMS
        // bounds. Its limit counts database rows, and one member can hold any number
        // of entries - so a caller that only counts members has no idea how close it
        // is. It moved from 5000 to 3000 when the keyed columns widened an entry row,
        // and it will move again; chunking here means the caller never has to know.
        for (const chunk of chunkByEntryCount(snapshots)) {
          const entries = chunk.reduce((sum, snapshot) => sum + snapshot.entries.length, 0)
          if (chunk.length === 1 && entries > GMS_MAX_ENTRIES_PER_CALL) {
            // ⛔ Not sent, because it cannot succeed: one member over the limit is a
            // guaranteed refusal, and a refusal here THROWS - which would leave this
            // loop and take every later chunk with it, on this run and on every repair
            // run after it. One member would quietly stop the whole export.
            //
            // Logged at error with the member, because this IS a gap: their entries do
            // not reach the GMS and nothing retries them. The member record itself did
            // go, so they are findable - it is their entries that are missing, and that
            // needs a hand rather than another attempt.
            logger.error(
              `##gms## snapshot of member ${chunk[0].userUuid} holds ${entries} entries, over the ${GMS_MAX_ENTRIES_PER_CALL} a single call may carry - skipped, their entries are NOT on the GMS`,
            )
            continue
          }
          await putGmsMatchingEntrySnapshots(homeCom.gmsApiKey, chunk)
        }
      }
      await batchUpdateGmsStatus(userIds)
    }
  } catch (err) {
    if (CONFIG.GMS_CREATE_USER_THROW_ERRORS) {
      throw err
    }
    logger.warn('publishing user fails with ', err)
    return false
  }
  return true
}

async function findLiveEntriesByUser(
  userIds: number[],
): Promise<Map<number, MatchingEntrySelect[]>> {
  // Paused entries are deliberately left out - the GMS only holds what may
  // actually turn up in someone's search.
  const entries = await dbSelectActiveMatchingEntriesByUserIds(userIds)
  const byUser = new Map<number, MatchingEntrySelect[]>()
  for (const entry of entries) {
    const list = byUser.get(entry.userId)
    if (list) {
      list.push(entry)
    } else {
      byUser.set(entry.userId, [entry])
    }
  }
  return byUser
}

async function batchUpdateGmsStatus(userIds: number[]) {
  await AppDatabase.getInstance()
    .getDataSource()
    .createQueryBuilder()
    .update(DbUser)
    .set({
      gmsRegistered: true,
      gmsRegisteredAt: new Date(),
    })
    .where('id IN (:...ids)', { ids: userIds })
    .execute()
  logger.debug(`${userIds} User marked as gms published.`)
}
