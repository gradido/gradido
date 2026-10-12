// AI-GENERATED — not an architecture reference
import {
  Community as DbCommunity,
  User as DbUser,
  dbClearGmsRegistration,
  dbFindUsersWithEmailContactByIds,
  getHomeCommunity,
  MatchingEntrySelect,
} from 'database'
import { getLogger } from 'log4js'
import { Point } from 'typeorm'
import { deleteGmsMatchingEntry, deleteGmsUser, putGmsMatchingEntry } from '@/apis/gms/GmsClient'
import { GmsUserMatchingEntry } from '@/apis/gms/model/GmsMatchingEntry'
import { CONFIG } from '@/config'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { noteUserDeleteUnderWay } from './gmsUserDeletesUnderWay'
import { Point2Location } from './Location2Point'
import { sendUsersToGms } from './sendUserToGms'

const logger = getLogger(
  `${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.util.syncMatchingEntryToGms`,
)

// A lost delete is a lasting privacy leak - the member's copy would stay in the
// GMS after they asked for it to go. So deletes are retried, while a lost upsert
// only means "not visible yet" and heals with the next edit or repair run.
const DELETE_RETRIES = 3
const DELETE_RETRY_DELAY_MS = [2000, 8000, 30000]

// How long the moderator's "bring back" waits for the GMS to take the member again: as long
// as one call that takes a member off may take (GMS_REQUEST_TIMEOUT_MS in the client). The
// two calls that hand a member over carry no timeout of their own.
const RESTORE_WAIT_MS = 30_000

/** What a delete that is being tried again is asked before every try, and told at its end. */
type Wanted = { stillWanted: () => boolean; over: () => void }

async function findGmsApiKey(): Promise<{ community: DbCommunity; apiKey: string } | undefined> {
  if (!CONFIG.GMS_ACTIVE) {
    return undefined
  }
  const community = await getHomeCommunity()
  if (!community?.gmsApiKey) {
    logger.warn('no home community with a gms api key, cannot reach the GMS')
    return undefined
  }
  return { community, apiKey: community.gmsApiKey }
}

/**
 * Retry in the background, so the member's mutation returns straight away. This
 * only survives as long as the process does; making the guarantee durable is what
 * the outbox is for, and that comes with the hardening step.
 */
function retryInBackground(what: string, operation: () => Promise<unknown>, wanted?: Wanted): void {
  runRetries(what, operation, wanted)
    .catch((e) => {
      logger.error(`retry loop for "${what}" crashed: ${e}`)
    })
    .finally(() => wanted?.over())
}

/**
 * The tries themselves: after each wait one more, until one gets through or the last has
 * failed - which is then said as an error, so that somebody sees it. With `wanted`, a try
 * is only made while what it is for is still wanted.
 */
async function runRetries(
  what: string,
  operation: () => Promise<unknown>,
  wanted?: Wanted,
): Promise<void> {
  for (let attempt = 0; attempt < DELETE_RETRIES; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, DELETE_RETRY_DELAY_MS[attempt]))
    // Asked after the wait, right before the try: what the wait was for may have been
    // overtaken meanwhile (a member who was handed over again).
    if (wanted && !wanted.stillWanted()) {
      logger.info(`${what} is not wanted any more, not tried again`)
      return
    }
    try {
      await operation()
      logger.info(`${what} succeeded on retry ${attempt + 1}`)
      return
    } catch (retryError) {
      logger.warn(`${what} failed on retry ${attempt + 1}: ${retryError}`)
    }
  }
  // Never silently given up on: someone has to see this.
  logger.error(`${what} still failing after ${DELETE_RETRIES} retries - GMS copy may remain`)
}

/**
 * Bring one entry in line with the GMS.
 *
 * Only entries that may actually be found belong there: the member takes part
 * (gmsAllowed), their account is not deleted, and the entry is live (active).
 * Anything else is removed - which makes pausing an entry and deleting it the very
 * same operation towards the GMS.
 *
 * The account: the GMS may still hold a deleted member where taking them off failed,
 * and would take an entry of theirs.
 */
export async function syncMatchingEntryToGms(
  user: DbUser,
  entry: MatchingEntrySelect,
): Promise<void> {
  const gms = await findGmsApiKey()
  if (!gms) {
    return
  }

  if (!user.gmsAllowed || !entry.active || user.deletedAt) {
    await removeMatchingEntryFromGms(entry.uuid)
    return
  }

  try {
    // The entry needs its user to exist over there first. A member who never
    // published anything is not in the GMS yet; their first entry brings them in.
    if (!user.gmsRegistered) {
      await sendUsersToGms([user], gms.community)
    }
    await putGmsMatchingEntry(gms.apiKey, new GmsUserMatchingEntry(user.gradidoID, entry))
  } catch (e) {
    // The member keeps their entry either way; it just may not be findable yet.
    // The next edit, or a bulk repair run, brings it over.
    logger.warn(`could not publish matching entry ${entry.uuid} to the GMS: ${e}`)
  }
}

/** Remove one entry from the GMS - deleted or paused, it must not be findable. */
export async function removeMatchingEntryFromGms(uuid: string): Promise<void> {
  const gms = await findGmsApiKey()
  if (!gms) {
    return
  }

  try {
    await deleteGmsMatchingEntry(gms.apiKey, uuid)
  } catch (e) {
    logger.warn(`could not delete matching entry ${uuid} from the GMS: ${e}`)
    retryInBackground(`deleting matching entry ${uuid} from the GMS`, () =>
      deleteGmsMatchingEntry(gms.apiKey, uuid),
    )
  }
}

/**
 * Remove a member and everything of theirs from the GMS, because they withdrew
 * their consent or deleted their account.
 *
 * Until now nothing was sent in that case at all: switching GMS off left the copy
 * over there untouched, for good. This is the path that honours the withdrawal.
 */
export async function removeUserFromGms(user: DbUser): Promise<void> {
  const gms = await findGmsApiKey()
  if (!gms) {
    return
  }

  try {
    await deleteGmsUser(gms.apiKey, user.gradidoID)
  } catch (e) {
    logger.warn(`could not delete user ${user.id} from the GMS: ${e}`)
    // Named by id: where every retry fails too, the last line says whose copy may remain.
    // And noted as under way: handing the member over again ends these tries
    // (gmsUserDeletesUnderWay.ts).
    retryInBackground(
      `deleting user ${user.id} from the GMS`,
      () => deleteGmsUser(gms.apiKey, user.gradidoID),
      noteUserDeleteUnderWay(user.id),
    )
  }
  await forgetGmsRegistration(user)
}

/**
 * The moderation deleted an account: the member leaves the GMS with it.
 *
 * ⛔ An account is deleted softly here, and the export to the GMS leaves a deleted member
 * out - which takes nobody off: a member left out of a batch is not touched over there
 * (sendUserToGms.ts). So the GMS is told, as it is told when a member withdraws their
 * consent.
 *
 * For every account, whatever its row says about the GMS. The row can say "does not take
 * part, not held" for a member who stands over there all the same -- a delete after a
 * withdrawn consent that failed for good clears the note here and leaves the copy there.
 * Deleting there is idempotent and answers for a member it does not know as for one it
 * took off, so asking once too often costs a request and nothing else.
 *
 * Never throws. The account is deleted by now, and a GMS that cannot be reached must not
 * turn the moderator's deletion into an error; `removeUserFromGms` retries a failed delete
 * by itself, three times within a minute, and says so where that fails as well.
 */
export async function removeDeletedUserFromGms(user: DbUser): Promise<void> {
  try {
    await removeUserFromGms(user)
  } catch (e) {
    logger.error(`could not take the deleted user ${user.id} off the GMS: ${e}`)
  }
}

/**
 * The moderation brought a deleted account back: a member who takes part stands in the GMS
 * again, their live entries with them.
 *
 * The deletion asked the GMS to take the member and everything of theirs off. So what is
 * handed over here is the whole member, and their entries travel along as the full set -
 * as for a member who gives their consent again (UserResolver, updateUserInfos).
 *
 * Only a member of this community who takes part and has a place - whom the repair run
 * would send as well (apis/gms/ExportUsers). `GmsUser` refuses one without a place, and a
 * restored account without one is nothing to write an error about.
 *
 * Never throws: the account is restored by now, as it is deleted by then above. A publish
 * that fails is said here with the member's id and not tried again by itself. The member
 * is handed over whole again when they next change a setting the GMS shows, and by the
 * repair run (`bun run gmsusers`), which nothing starts by itself.
 *
 * And never waits for longer than RESTORE_WAIT_MS: the moderator's mutation awaits this, and
 * the two calls that hand a member over have no timeout. A GMS that does not answer in time
 * is said here, and what is still under way goes on by itself, to its end.
 */
export async function returnRestoredUserToGms(user: DbUser): Promise<void> {
  if (user.foreign || !user.gmsAllowed || Point2Location(user.location as Point) === null) {
    return
  }
  let giveUpWaiting: NodeJS.Timeout | undefined
  const waitedLongEnough = new Promise<'late'>((resolve) => {
    giveUpWaiting = setTimeout(() => resolve('late'), RESTORE_WAIT_MS)
  })
  try {
    // Not waited for any longer, the hand-over still goes on to its end - which includes
    // its look at the account (handOverRestoredUser).
    if ((await Promise.race([handOverRestoredUser(user), waitedLongEnough])) === 'late') {
      logger.error(
        `the GMS did not take the restored user ${user.id} back within ${RESTORE_WAIT_MS} ms, not waited for any longer`,
      )
    }
  } finally {
    clearTimeout(giveUpWaiting)
  }
}

/**
 * The hand-over itself, with everything that can go wrong in it said and kept here - and
 * at its end, where the GMS was asked at all, a look at the account as it stands by then.
 */
async function handOverRestoredUser(user: DbUser): Promise<void> {
  try {
    const gms = await findGmsApiKey()
    if (!gms) {
      return
    }
    // false where the GMS did not take them and GMS_CREATE_USER_THROW_ERRORS is off: the
    // line it writes then names nobody, so this one does.
    if (!(await sendUsersToGms([user], gms.community, true))) {
      logger.error(`could not bring the restored user ${user.id} back to the GMS`)
    }
  } catch (e) {
    logger.error(`could not bring the restored user ${user.id} back to the GMS: ${e}`)
  }
  await takeOffAgainIfDeletedMeanwhile(user)
}

/**
 * ⛔ Every hand-over of a restored account is held against the account as it stands when
 * the hand-over ends - in time or long after it was no longer waited for, got through or
 * not. The moderation may have deleted the account again while the GMS was being asked,
 * and the delete of that deletion may have come ahead of what the GMS takes only now. So a
 * member whose account is deleted by then is taken off once more: nothing else would do
 * that - the repair run leaves a deleted account out, and it cannot be deleted twice.
 */
async function takeOffAgainIfDeletedMeanwhile(user: DbUser): Promise<void> {
  try {
    const [standing] = await dbFindUsersWithEmailContactByIds([user.id])
    if (!standing) {
      logger.warn(
        `user ${user.id} was deleted again while the GMS was asked to take them back, taken off once more`,
      )
      await removeUserFromGms(user)
    }
  } catch (e) {
    logger.error(`could not look at user ${user.id} after the hand-over to the GMS: ${e}`)
  }
}

/**
 * From here on the member counts as no longer being in the GMS - also when the delete
 * just failed and is still being retried. The flag decides whether a later publish
 * registers them again first, and getting that wrong is one-sided: a needless upsert
 * costs one request, while a skipped one writes an entry that belongs to nobody.
 */
async function forgetGmsRegistration(user: DbUser): Promise<void> {
  const cleared = await dbClearGmsRegistration(user.id)
  if (!cleared.success) {
    logger.error(
      `could not clear the gms registration of user ${user.id}: ${cleared.error.message}`,
    )
    return
  }
  // The caller goes on working with this object, so it must not keep saying "registered".
  user.gmsRegistered = false
  user.gmsRegisteredAt = null
}
